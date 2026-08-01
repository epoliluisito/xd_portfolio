/* Measures the reported problems instead of eyeballing them:
   - how much screen the UI eats, at 2 and at 4 players
   - where dice actually come to rest, in screen space
   - how often a settled die cannot be tapped because UI swallows the tap
   Run: node diagnose.mjs */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROOT = new URL('../', import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': extname(f) === '.html' ? 'text/html' : 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8300 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const DEVICES = [
  { name: 'iPhone SE      ', w: 320, h: 568 },
  { name: 'iPhone 12/13/14', w: 390, h: 844 },
  { name: 'iPhone Pro Max ', w: 430, h: 932 },
  { name: 'desktop (yours) ', w: 1512, h: 857 },
  { name: 'landscape phone ', w: 844, h: 390 },
];

for (const dev of DEVICES){
  const page = await browser.newPage({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.KAKAJA, { timeout: 20000 });
  await page.waitForTimeout(1500);

  for (const seats of [2, 4]){
    const out = await page.evaluate(async ({ seats }) => {
      const K = window.KAKAJA, G = K.Game;
      G.seat(seats);
      G.busy = true;                       // stop the turn loop advancing under us
      await new Promise(r => setTimeout(r, 200));

      const R = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom),
                 left: Math.round(r.left), right: Math.round(r.right) };
      };
      // Which element would actually receive a tap at this point?
      const swallowed = (x, y) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return false;
        return !!el.closest('#hud');       // anything in the HUD eats the tap
      };

      // Screen-space footprint of the tray
      const T = K.THREE, corners = [];
      for (const x of [-K.CFG.tray.w/2, K.CFG.tray.w/2])
        for (const z of [K.PLAY.zFar, K.CFG.tray.d/2]){
          const p = new T.Vector3(x, 0, z).project(K.camera);
          corners.push({ sx: (p.x*.5+.5)*innerWidth, sy: (-p.y*.5+.5)*innerHeight });
        }
      const trayTop = Math.round(Math.min(...corners.map(c => c.sy)));
      const trayBot = Math.round(Math.max(...corners.map(c => c.sy)));

      // Throw six dice for real, many times, and record where they end up.
      const rest = [], blocked = [], dieR = [];
      G.busy = false;
      for (let t = 0; t < 60; t++){
        const set = K.__ensure(6);
        // Run the throw through the shared simulation, exactly as the game
        // does, but without waiting on the render loop.
        const th = K.__sim.beginThrow(K.sim, { seed: (Math.random()*2**32)>>>0, n: 6 });
        let steps = 0;
        while (!th.done && steps++ < 4000) K.__sim.stepThrow(K.sim, th);
        set.forEach(d => d.sync());
        for (const d of set){
          const p = d.group.position.clone().project(K.camera);
          const sx = (p.x*.5+.5)*innerWidth, sy = (-p.y*.5+.5)*innerHeight;
          rest.push({ sx, sy });
          const e = d.group.position.clone(); e.x += K.CFG.die.size/2;
          const pe = e.project(K.camera);
          const r = Math.abs((pe.x*.5+.5)*innerWidth - sx);
          dieR.push(r);
          // A die is "blocked" if its centre, or any of the four points a
          // half-die away, would have its tap eaten by the HUD.
          const pts = [[0,0],[0,-r],[0,r],[-r,0],[r,0]];
          if (pts.some(([dx,dy]) => swallowed(sx+dx, sy+dy)))
            blocked.push({ sx: Math.round(sx), sy: Math.round(sy) });
        }
      }
      const q = (a, p) => a.slice().sort((x,y)=>x-y)[Math.floor(a.length*p)];
      return {
        seats,
        vp: [innerWidth, innerHeight],
        top: R('#top'), bottom: R('#bottom'),
        chips: R('#chips'), actions: R('#actions'), ledger: R('#ledger'),
        tray: [trayTop, trayBot],
        n: rest.length,
        blocked: blocked.length,
        blockedPct: +(100*blocked.length/rest.length).toFixed(1),
        restY: { p10: Math.round(q(rest.map(r=>r.sy),.1)), p50: Math.round(q(rest.map(r=>r.sy),.5)),
                 p90: Math.round(q(rest.map(r=>r.sy),.9)), max: Math.round(Math.max(...rest.map(r=>r.sy))) },
        dieRadiusPx: +q(dieR,.5).toFixed(1),
      };
    }, { seats });

    if (seats === 2) console.log(`\n=== ${dev.name}  ${out.vp[0]}x${out.vp[1]} ===`);
    const uiTop = out.top.bottom, uiBot = out.bottom.top;
    console.log(`  ${seats} players:`);
    console.log(`     UI bands        top 0-${uiTop}px   bottom ${uiBot}-${out.vp[1]}px   (${uiTop + (out.vp[1]-uiBot)}px of ${out.vp[1]} = ${Math.round(100*(uiTop + (out.vp[1]-uiBot))/out.vp[1])}% of the screen)`);
    console.log(`     tray on screen  ${out.tray[0]} … ${out.tray[1]}px`);
    console.log(`     dice rest at    p10 ${out.restY.p10}  median ${out.restY.p50}  p90 ${out.restY.p90}  lowest ${out.restY.max}`);
    console.log(`     die radius      ${out.dieRadiusPx}px`);
    console.log(`     TAPS SWALLOWED BY UI: ${out.blocked}/${out.n} settled dice (${out.blockedPct}%)`);
  }
  await page.close();
}

await browser.close(); server.close();
