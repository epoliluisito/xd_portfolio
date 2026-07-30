/* Headless physics validation: settle time, stray escapes, cocked rate and
   face uniformity over many rolls. Run: node tune.mjs [rolls] [dice] */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROLLS = +(process.argv[2] || 600);
const NDICE = +(process.argv[3] || 2);
const ROOT = new URL('../', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8100 + (process.pid % 400);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForTimeout(2500);

const PATCH = process.argv[4] ? JSON.parse(process.argv[4]) : null;

const out = await page.evaluate(({ ROLLS, NDICE, PATCH }) => {
  const K = window.KAKAJA;
  if (PATCH){
    for (const [grp, vals] of Object.entries(PATCH))
      for (const [k, v] of Object.entries(vals)) K.CFG[grp][k] = v;
    if (PATCH.physics){
      const p = K.CFG.physics;
      K.world.gravity.set(0, p.gravity, 0);
      for (const d of K.dice){
        d.body.linearDamping = p.linDamp; d.body.angularDamping = p.angDamp;
        d.body.sleepSpeedLimit = p.sleepSpeed; d.body.sleepTimeLimit = p.sleepTime;
      }
      for (const cm of K.world.contactmaterials){
        if (cm.materials.some(m => m.name === 'table') && cm.materials.some(m => m.name === 'die')){
          cm.friction = p.friction; cm.restitution = p.restitution;
        }
      }
    }
    if (PATCH.solver){
      const s = PATCH.solver;
      if (s.iterations) K.world.solver.iterations = s.iterations;
      const apply = cm => {
        if (s.stiffness){ cm.contactEquationStiffness = s.stiffness; cm.frictionEquationStiffness = s.stiffness; }
        if (s.relax){ cm.contactEquationRelaxation = s.relax; cm.frictionEquationRelaxation = s.relax; }
      };
      apply(K.world.defaultContactMaterial);
      K.world.contactmaterials.forEach(apply);
    }
  }
  const S = K.CFG.physics.step;
  const flat = K.CFG.die.size * 1.15;
  const counts = {1:0,2:0,3:0,4:0,5:0,6:0};
  const times = [];
  let escapes = 0, nudged = 0, failed = 0, restX = [], restZ = [], restY = [], restZs = [];

  for (let r = 0; r < ROLLS; r++){
    const set = K.__throw(NDICE, { power: 0.75 + Math.random() * 0.7, dx: (Math.random() - .5) * 0.7 });
    let steps = 0, quiet = 0, nudges = 0, ok = false, thisEscape = false;

    while (steps < 3600){                        // 20s of sim, hard ceiling
      K.world.step(S); steps++;
      if (K.__rescue(set)){ thisEscape = true; quiet = 0; continue; }
      if (set.some(d => d.speed > K.CFG.physics.sleepSpeed)){ quiet = 0; continue; }
      if (++quiet < 10) continue;
      set.forEach(d => d.sync());
      const reads = set.map(d => d.read());
      const bad = reads.findIndex((x, i) => x.confidence < 0.94 || set[i].body.position.y > flat);
      if (bad >= 0){
        if (nudges++ < 8){ K.__nudge(set[bad]); quiet = 0; continue; }
        break;
      }
      ok = true;
      reads.forEach(x => counts[x.value]++);
      set.forEach(d => {
        restX.push(Math.abs(d.body.position.x)); restZ.push(d.body.position.z);
        restY.push(d.body.position.y); restZs.push(d.body.position.z);
      });
      break;
    }
    if (thisEscape) escapes++;
    if (nudges) nudged++;
    if (!ok) failed++; else times.push(steps * S);
  }
  return { counts, times, escapes, nudged, failed, restX, restZ, restY, restZs, dieSize: K.CFG.die.size, rolls: ROLLS, ndice: NDICE, limX: K.CFG.tray.w/2 - K.CFG.die.size/2*0.97, limZ: null, zNear: K.PLAY.zNear, zFar: K.PLAY.zFar };
}, { ROLLS, NDICE, PATCH });

const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const n = Object.values(out.counts).reduce((a, b) => a + b, 0);
const exp = n / 6;
const chi = Object.values(out.counts).reduce((a, o) => a + (o - exp) ** 2 / exp, 0);
// p-value for chi-square, df=5, via the regularised upper incomplete gamma
const pval = (() => { // df=5 → Q(5/2, chi/2), series is fine for our range
  const k = 2.5, x = chi / 2;
  let sum = 0, term = 1;
  for (let i = 0; i < 400; i++){ sum += term; term *= x / (k + i + 1); if (term < 1e-14) break; }
  const lg = (z) => { // Lanczos
    const g = [676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,
               12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lg(1 - z);
    z -= 1; let a = 0.99999999999980993, t = z + 7.5;
    for (let i = 0; i < 8; i++) a += g[i] / (z + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
  };
  const P = Math.exp(-x + k * Math.log(x) - lg(k + 1)) * sum;
  return Math.max(0, Math.min(1, 1 - P));
})();

const penX = out.restX.filter(v => v > out.limX + 0.02);
const halfDie = 1.55/2*0.97;
const penZ = out.restZ.filter(v => v > out.zNear - halfDie + 0.05 || v < out.zFar + halfDie - 0.05);
const rest = out.dieSize/2; const penY = out.restY.filter(v => Math.abs(v - rest) > 0.06);
const maxPen = Math.max(0, ...penX.map(v => v - out.limX), ...penZ.map(v => Math.abs(v) - (out.zNear - halfDie)));

console.log(`
rolls          ${out.rolls} × ${out.ndice} dice   (${n} face readings)
settle time    p10 ${pct(out.times,.10).toFixed(2)}s   median ${pct(out.times,.50).toFixed(2)}s   p90 ${pct(out.times,.90).toFixed(2)}s   max ${Math.max(...out.times).toFixed(2)}s
strays         ${out.escapes} rolls needed a rescue  (${(100*out.escapes/out.rolls).toFixed(1)}%)
cocked         ${out.nudged} rolls needed a nudge   (${(100*out.nudged/out.rolls).toFixed(1)}%)
unresolved     ${out.failed}
faces          ${JSON.stringify(out.counts)}
uniformity     chi2 ${chi.toFixed(2)} (df 5)   p ${pval.toFixed(3)}   ${pval > 0.05 ? 'OK — indistinguishable from fair' : '** BIASED **'}
penetration    ${penX.length+penZ.length}/${out.restX.length} rest positions inside a wall   worst ${maxPen.toFixed(3)}u
rest height    ${penY.length}/${out.restY.length} off the table plane
rest depth z   p10 ${pct(out.restZs,.10).toFixed(1)}  median ${pct(out.restZs,.50).toFixed(1)}  p90 ${pct(out.restZs,.90).toFixed(1)}   (play area ${out.zFar.toFixed(1)} … ${out.zNear.toFixed(1)}, negative = away from player)
`);

await browser.close(); server.close();
