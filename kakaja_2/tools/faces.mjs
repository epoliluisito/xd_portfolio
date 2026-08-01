/* Pip legibility check: park one die in the middle of the tray showing each
   value in turn, screenshot, and measure pip-vs-face contrast from the pixels.
   A top-view dice game lives or dies on this being unambiguous. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROOT = new URL(process.env.KROOT || '../', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8900 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 20000 });
await page.waitForTimeout(2000);

// Park six dice in a 2×3 grid, each showing a different value straight up.
const boxes = await page.evaluate(() => {
  const K = window.KAKAJA, T = K.THREE;
  K.Game.seat(2); K.Game.state = 'IDLE'; K.UI.show('hud');
  // Kill the layer transitions: at ~1fps in software rendering the fade-out of
  // the title screen can still be in flight when the screenshot is taken, which
  // silently measures the blurred title overlay instead of the table.
  for (const el of document.querySelectorAll('.layer, #scrim')){
    el.style.transition = 'none';
    if (!el.classList.contains('on') && el.id !== 'hud') el.style.visibility = 'hidden';
  }
  document.getElementById('scrim').style.opacity = '0';
  K.UI.turn(''); K.UI.hint(''); K.Game.busy = true;
  const set = K.__ensure(6);
  K.dice.forEach(d => { d.body.sleep(); });
  const zc = K.camera ? 0 : 0;
  const spots = [[-2.7,-5.5],[2.7,-5.5],[-2.7,-0.8],[2.7,-0.8],[-2.7,3.9],[2.7,3.9]];
  const out = [];
  for (let v = 1; v <= 6; v++){
    const d = set[v - 1];
    const [x, z] = spots[v - 1];
    // Lay the die flat (local +Y up, axis index 2) and print `v` on that face.
    d.body.position.set(x, K.CFG.die.size / 2, z);
    d.body.quaternion.set(0, 0, 0, 1);
    d.body.velocity.setZero(); d.body.angularVelocity.setZero();
    d.body.sleep();
    d.group.visible = true;
    d.setLabel(K.__sim.labelFor(2, v, Math.random), v);
    d.sync();
    const c = new T.Vector3(x, K.CFG.die.size / 2, z);
    const p = c.clone().project(K.camera);
    const e = c.clone(); e.x += K.CFG.die.size / 2;
    const cx = (p.x * .5 + .5) * innerWidth;
    const rad = Math.abs(((e.project(K.camera).x) * .5 + .5) * innerWidth - cx);
    out.push({ v, cx, cy: (-p.y * .5 + .5) * innerHeight, rad });
  }
  return out;
});
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/08-faces.png' });

await browser.close(); server.close();

// Measure pip-vs-face contrast from the PNG. Reading the WebGL buffer in-page
// is unreliable without preserveDrawingBuffer, so decode the screenshot.
const { PNG } = await import('pngjs');
const png = PNG.sync.read(await readFile('shots/08-faces.png'));
const dpr = png.width / 390;

console.log('pip legibility (luminance 0-255, sampled over each die top face):');
let worst = 999;
for (const b of boxes){
  // sample a square inside the die's top face, sized from its real on-screen radius
  const s = Math.max(10, Math.round(b.rad * 1.15 * dpr));
  const x0 = Math.max(0, Math.round(b.cx * dpr - s / 2));
  const y0 = Math.max(0, Math.round(b.cy * dpr - s / 2));
  const lum = [];
  for (let y = y0; y < Math.min(png.height, y0 + s); y++)
    for (let x = x0; x < Math.min(png.width, x0 + s); x++){
      const i = (png.width * y + x) << 2;
      lum.push(0.299 * png.data[i] + 0.587 * png.data[i+1] + 0.114 * png.data[i+2]);
    }
  lum.sort((a, c) => a - c);
  const p5 = lum[Math.floor(lum.length * .05)], p50 = lum[Math.floor(lum.length * .5)],
        p95 = lum[Math.floor(lum.length * .95)];
  worst = Math.min(worst, p95 - p5);
  console.log(`  face ${b.v} (${(b.rad*2).toFixed(0)}px wide): dark ${p5.toFixed(0)}  mid ${p50.toFixed(0)}  light ${p95.toFixed(0)}  ->  contrast ${(p95-p5).toFixed(0)}`);
}
console.log(`worst-case pip contrast: ${worst.toFixed(0)} / 255  ${worst > 60 ? 'OK' : '** too low **'}`);
