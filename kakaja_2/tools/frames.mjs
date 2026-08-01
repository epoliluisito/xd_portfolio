/* What does a frame really cost, and does the quality watchdog save us?
 *
 * Runs the REAL render loop (not a synthetic render call) with dice tumbling,
 * under CPU throttling that stands in for a slower phone, and reports the frame
 * time distribution plus whether the adaptive step-down actually fired.
 *
 * Container caveat: rendering here is SwiftShader on the CPU, so throttling the
 * CPU throttles the GPU too — the absolute numbers are pessimistic. What
 * transfers is (a) the shape of the distribution, (b) whether the watchdog
 * reacts, and (c) the main-thread costs that are not GPU work at all.
 *
 * Run: node frames.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROOT = new URL(process.env.KROOT || '../', import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': extname(f) === '.html' ? 'text/html' : 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8720 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function run({ q, throttle, seconds = 6 }){
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  const cdp = await page.context().newCDPSession(page);
  await page.goto(`http://localhost:${PORT}/${q ? '?q=' + q : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.KAKAJA, { timeout: 40000 });
  await page.waitForTimeout(800);
  if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

  const r = await page.evaluate(async (seconds) => {
    const K = window.KAKAJA, G = K.Game;
    K.QUALITY.forced = false;                 // let the watchdog work even with ?q=
    const startTier = K.QUALITY.name;
    const times = [];
    let prev = performance.now(), stop = false;
    const tick = (t) => {
      times.push(t - prev); prev = t;
      if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // keep dice in the air for the whole window
    G.state = 'PLAY'; G.busy = true; G.saved = 0; G.stowed = [];
    const t0 = performance.now();
    while (performance.now() - t0 < seconds * 1000){
      G.inHand = K.__ensure(6).slice();
      G.rolling = true; G.phase = 'ROLL'; G.active = G.inHand;
      K.__throwValues(G.inHand, K.localValues(6), null);
      // let the real loop drive it
      await new Promise(res => {
        const wait = () => (K.__throwState && !K.__throwState.done && performance.now() - t0 < seconds * 1000)
          ? requestAnimationFrame(wait) : res();
        wait();
      });
    }
    stop = true;
    times.shift();
    return { startTier, endTier: K.QUALITY.name, times,
             dpr: K.renderer.getPixelRatio(), shadow: K.renderer.shadowMap.enabled };
  }, seconds);

  await page.close();
  const s = r.times.slice().sort((a, b) => a - b);
  const q50 = s[Math.floor(s.length * .5)], q90 = s[Math.floor(s.length * .9)];
  return { ...r, n: s.length, q50, q90, fps: 1000 / q50 };
}

console.log(`
frame time with dice tumbling  (SwiftShader — read the trend, not the absolutes)

  start   cpu    frames   median        p90        ended at   dpr  shadow`);
for (const [q, throttle] of [['high',1],['high',4],['high',8],['mid',4],['low',8],[null,1]]){
  const r = await run({ q, throttle });
  console.log(`  ${String(q||'auto').padEnd(7)} ${String(throttle+'x').padEnd(6)} ${String(r.n).padEnd(8)} ` +
              `${String(r.q50.toFixed(1)+'ms ('+r.fps.toFixed(0)+'fps)').padEnd(14)}${String(r.q90.toFixed(1)+'ms').padEnd(11)}` +
              `${String(r.endTier).padEnd(10)} ${String(r.dpr).padEnd(4)} ${r.shadow ? 'on' : 'off'}` +
              `${r.endTier !== r.startTier ? '   <- watchdog stepped down' : ''}`);
}
console.log();
await browser.close(); server.close();
