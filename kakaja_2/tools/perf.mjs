/* Cold start and per-tier cost.
 *
 * Boots the real shipped file once per quality tier, times the phases of boot,
 * and measures what a frame actually costs. The container renders in software
 * (SwiftShader), so absolute fps here means nothing — the numbers that transfer
 * to a real phone are the RATIOS between tiers, plus the CPU-side costs (AI
 * solve, texture drawing, physics steps) which are not GPU-bound at all.
 *
 * Run: node perf.mjs
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
const PORT = 8820 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function measure(q){
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  const t0 = Date.now();
  await page.goto(`http://localhost:${PORT}/${q ? '?q=' + q : ''}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.KAKAJA, { timeout: 30000 });
  const toInteractive = Date.now() - t0;
  await page.waitForTimeout(1200);

  const r = await page.evaluate(async () => {
    const K = window.KAKAJA;
    const out = {};
    out.tier = K.QUALITY.name;
    out.dpr = K.renderer.getPixelRatio();
    out.shadow = K.renderer.shadowMap.enabled ? K.QUALITY.shadow : 0;
    out.draws = K.renderer.info.render.calls;
    out.tris = K.renderer.info.render.triangles;
    out.textures = K.renderer.info.memory.textures;
    out.programs = K.renderer.info.programs.length;
    out.aiSolveMs = +K.AI.buildMs.toFixed(0);

    // CPU: physics throughput, independent of the GPU
    const N = 3000, p0 = performance.now();
    for (let i = 0; i < N; i++) K.world.step(K.CFG.physics.step);
    const stepMs = (performance.now() - p0) / N;
    out.physicsStepUs = +(stepMs * 1000).toFixed(1);
    out.simRealtime = +(K.CFG.physics.step / (stepMs / 1000)).toFixed(0) + 'x';

    // GPU: draw the scene as fast as it will go, with dice mid-air so the
    // shadow pass has real work
    K.showValues([1, 2, 3, 4, 5, 6]);
    await new Promise(r => setTimeout(r, 150));
    const times = [];
    for (let i = 0; i < 40; i++){
      const a = performance.now();
      K.renderer.render(K.scene, K.camera);
      await new Promise(r => requestAnimationFrame(r));
      times.push(performance.now() - a);
    }
    times.sort((a, b) => a - b);
    out.frameMs = +times[20].toFixed(1);
    return out;
  });
  r.bootMs = toInteractive;
  await page.close();
  return r;
}

const rows = [];
for (const q of ['high', 'mid', 'low']) rows.push(await measure(q));
const auto = await measure(null);

const pad = (s, n) => String(s).padEnd(n);
console.log(`
cold start and per-tier cost  (SwiftShader — compare tiers, not absolutes)

  ${pad('tier',6)} ${pad('boot',7)} ${pad('dpr',5)} ${pad('shadow',7)} ${pad('frame',8)} ${pad('draws',6)} ${pad('tris',7)} ${pad('tex',4)}`);
for (const r of rows)
  console.log(`  ${pad(r.tier,6)} ${pad(r.bootMs+'ms',7)} ${pad(r.dpr,5)} ${pad(r.shadow||'off',7)} ${pad(r.frameMs+'ms',8)} ${pad(r.draws,6)} ${pad(r.tris,7)} ${pad(r.textures,4)}`);
console.log(`
  auto-detected here: ${auto.tier}   (software renderer, so 'low' is correct)
  CPU-side, tier-independent:
    AI solve            ${rows[0].aiSolveMs}ms   (once, at boot, then cached)
    physics step        ${rows[0].physicsStepUs}us  = ${rows[0].simRealtime} realtime
    a full 1s throw     ${(rows[0].physicsStepUs * 180 / 1000).toFixed(0)}ms of CPU spread over the roll
  relative frame cost:  high ${(rows[0].frameMs/rows[2].frameMs).toFixed(2)}x low   mid ${(rows[1].frameMs/rows[2].frameMs).toFixed(2)}x low
`);

await browser.close(); server.close();
