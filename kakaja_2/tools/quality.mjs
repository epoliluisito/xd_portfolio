/* Checks the quality-tier machinery itself:
 *   - each tier actually reaches the renderer (dpr, shadow map, texture size)
 *   - the boot-time guess is sane
 *   - the adaptive step-down fires on slow frames, is one-way, and stops at low
 *   - ?q= pins a tier and disables the adaptive path
 *
 * Run: node quality.mjs
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
const PORT = 8880 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

let pass = 0, fail = 0;
const check = (name, cond, got) => {
  if (cond) pass++;
  else { fail++; console.log(`  FAIL ${name}: ${JSON.stringify(got)}`); }
};

async function open(q){
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(`http://localhost:${PORT}/${q ? '?debug=1&q=' + q : '?debug=1'}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.KAKAJA, { timeout: 30000 });
  await page.waitForTimeout(600);
  return page;
}
const state = page => page.evaluate(() => {
  const K = window.KAKAJA;
  // the largest oak plank map, as actually uploaded
  let texW = 0;
  K.scene.traverse(o => {
    const m = o.material;
    if (m && m.map && m.map.image && m.map.image.width > texW) texW = m.map.image.width;
  });
  return {
    name: K.QUALITY.name, forced: K.QUALITY.forced,
    dpr: K.renderer.getPixelRatio(),
    shadowOn: K.renderer.shadowMap.enabled,
    shadowSize: K.QUALITY.shadow,
    aa: K.renderer.capabilities.isWebGL2 ? K.QUALITY.aa : K.QUALITY.aa,
    texW,
  };
});

console.log('tier settings reach the renderer:');
const texW = {};
for (const [q, want] of [['high', 2], ['mid', 1.5], ['low', 1]]){
  const page = await open(q);
  const s = await state(page);
  texW[q] = s.texW;
  console.log(`  ${q.padEnd(5)} dpr ${String(s.dpr).padEnd(4)} shadow ${String(s.shadowSize || 'off').padEnd(4)} largest plank map ${s.texW}px`);
  check(`${q}: tier applied`, s.name === q, s);
  // deviceScaleFactor is 3, so the cap is what decides
  check(`${q}: dpr capped at ${want}`, s.dpr === want, s.dpr);
  check(`${q}: shadow ${q === 'low' ? 'off' : 'on'}`, s.shadowOn === (q !== 'low'), s);
  check(`${q}: ?q= pins the tier`, s.forced === true, s.forced);
  await page.close();
}

// texture scaling must actually differ between tiers
check('low draws smaller plank maps than high', texW.low < texW.mid && texW.mid < texW.high, texW);
console.log(`  plank map: high ${texW.high}px -> low ${texW.low}px  (${((texW.low/texW.high)**2*100).toFixed(0)}% of the pixels)`);

// boot-time guess: this container is SwiftShader, which must be detected
{
  const page = await open(null);
  const s = await state(page);
  check('software renderer detected as low', s.name === 'low' && !s.forced, s);
  await page.close();
}

// adaptive step-down
console.log('\nadaptive step-down:');
{
  const page = await open('high');
  const r = await page.evaluate(async () => {
    const K = window.KAKAJA;
    K.QUALITY.forced = false;                 // pretend it was auto-detected
    const seen = [K.QUALITY.name];
    const slow = 1000 / 20;                   // 20fps: clearly over budget
    // feed three windows' worth of slow frames, clearing the cooldown between
    for (let w = 0; w < 3; w++){
      K.PERF.cooldown = 0;
      for (let i = 0; i < 95; i++) K.PERF.sample(slow);
      seen.push(K.QUALITY.name);
    }
    // and a fourth, to prove it stops at low
    K.PERF.cooldown = 0;
    for (let i = 0; i < 95; i++) K.PERF.sample(slow);
    seen.push(K.QUALITY.name);
    return { seen, dpr: K.renderer.getPixelRatio(), shadowOn: K.renderer.shadowMap.enabled };
  });
  console.log(`  tier path under sustained 20fps: ${r.seen.join(' -> ')}`);
  check('steps down high -> mid -> low', r.seen[0] === 'high' && r.seen[1] === 'mid' && r.seen[2] === 'low', r.seen);
  check('stops at low, does not go further', r.seen[3] === 'low', r.seen);
  check('renderer followed the step-down', r.dpr === 1 && r.shadowOn === false, r);
  await page.close();
}
{
  const page = await open('high');
  const r = await page.evaluate(async () => {
    const K = window.KAKAJA;
    for (let i = 0; i < 400; i++) K.PERF.sample(1000 / 20);   // forced: must ignore
    const a = K.QUALITY.name;
    K.QUALITY.forced = false;
    for (let i = 0; i < 400; i++) K.PERF.sample(1000 / 120);  // fast: must not drop
    return { forcedStayed: a, fastStayed: K.QUALITY.name };
  });
  check('?q= disables the adaptive path', r.forcedStayed === 'high', r);
  check('fast frames never drop the tier', r.fastStayed === 'high', r);
  await page.close();
}

console.log(`\nchecks: ${pass} passed, ${fail} failed`);
await browser.close(); server.close();
