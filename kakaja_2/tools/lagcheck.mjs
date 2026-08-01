/* How long does a throw actually take, mid-turn?
 *
 * The lag report came with wrong dice counts, and both had the same cause: the
 * throw was operating on the wrong bodies, so a set-aside die sitting in the
 * saved row counted as "escaped the tray" and triggered the rescue path on
 * EVERY physics step. The throw could then never go quiet, and ran to the
 * 10-second failsafe — 1,800 steps instead of ~180 — while the render loop
 * burned 40 physics steps a frame trying to keep up.
 *
 * This measures steps-to-settle for throws at every hand size, which is where
 * that shows up. Anything near the 1,800-step ceiling is the bug returning.
 *
 * Run: node lagcheck.mjs [turns]
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const TURNS = +(process.argv[2] || 150);
const ROOT = new URL(process.env.KROOT || '../', import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': extname(f) === '.html' ? 'text/html' : 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8680 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/?q=low`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 30000 });

const out = await page.evaluate(async ({ TURNS }) => {
  const K = window.KAKAJA, G = K.Game;
  if (!K.AI.ready) K.AI.build();
  const byN = {}, previewMs = [];
  let failsafe = 0;

  G.state = 'PLAY';
  for (let turn = 0; turn < TURNS; turn++){
    G.stowed.forEach(d => d.unstow()); G.stowed = []; G.saved = 0;
    G.inHand = K.__ensure(6).slice();
    for (let step = 0; step < 12; step++){
      const hand = G.inHand.slice();
      if (!hand.length) break;
      const t0 = performance.now();
      G.rolling = true; G.phase = 'ROLL'; G.active = hand;
      K.__throwValues(hand, K.localValues(hand.length), null);
      previewMs.push(performance.now() - t0);
      const t = K.__throwState;
      let guard = 0;
      while (t && !t.done && guard++ < 5000) K.__sim.stepThrow(K.sim, t);
      (byN[hand.length] = byN[hand.length] || []).push(t.step);
      if (t.step > 1700) failsafe++;
      K.dice.forEach(d => d.sync());
      for (const d of hand) d.value = K.__sim.valueOnAxis(d.upAxis(), d.label);

      const c = [0,0,0,0,0,0,0];
      for (const d of hand) c[d.value]++;
      const dec = K.AI.decide(c, hand.length, G.saved, {});
      if (!dec) break;
      const keep = dec.keep.counts.slice(), kept = [];
      for (const d of hand) if (keep[d.value] > 0){ keep[d.value]--; kept.push(d); }
      for (const d of kept){
        G.stowed.push(d); G.inHand.splice(G.inHand.indexOf(d), 1);
        d.stow(G.stowed.length - 1);
        for (let f = 0; f < 20; f++) d.stepTween(0.05);
      }
      G.saved += dec.keep.score;
      if (!dec.roll) break;
      if (!G.inHand.length){ G.stowed.forEach(d => d.unstow()); G.stowed = []; G.inHand = K.__ensure(6).slice(); }
    }
  }
  return { byN, previewMs, failsafe, step: K.CFG.physics.step };
}, { TURNS });

const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
console.log(`\nsteps to settle, by number of dice thrown  (1 step = ${(out.step*1000).toFixed(1)}ms of sim)\n`);
console.log(`  dice   throws   median      p90         worst`);
for (const n of Object.keys(out.byN).sort((a,b)=>a-b)){
  const a = out.byN[n];
  console.log(`  ${String(n).padEnd(6)} ${String(a.length).padEnd(8)} ${String(q(a,.5)+' ('+(q(a,.5)*out.step).toFixed(2)+'s)').padEnd(12)}` +
              `${String(q(a,.9)+' ('+(q(a,.9)*out.step).toFixed(2)+'s)').padEnd(12)}${Math.max(...a)}`);
}
const all = Object.values(out.byN).flat();
console.log(`
  throws that hit the 10s failsafe: ${out.failsafe} of ${all.length}  ${out.failsafe ? '** THE LAG BUG IS BACK **' : '(none)'}
  preview cost per throw: median ${q(out.previewMs,.5).toFixed(1)}ms  p90 ${q(out.previewMs,.9).toFixed(1)}ms
`);
await browser.close(); server.close();
