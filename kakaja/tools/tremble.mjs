/* Measures the "trembling" tail of a throw.
 *
 * A throw has three phases: dice clearly flying, dice creeping, dice at rest.
 * The complaint is about the middle one — dice that have visibly stopped
 * bouncing but keep shuffling before the game accepts a result. This measures
 * how long that lasts, and separates jitter (dice never falling below the sleep
 * threshold) from nudges (the game deliberately re-throwing a cocked die).
 *
 * Run: node tremble.mjs [rolls] [dice]
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROLLS = +(process.argv[2] || 200);
const NDICE = +(process.argv[3] || 6);
const PATCH = process.argv[4] ? JSON.parse(process.argv[4]) : null;
const ROOT = new URL(process.env.KROOT || '../', import.meta.url).pathname;

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': extname(f) === '.html' ? 'text/html' : 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8750 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 20000 });
await page.waitForTimeout(1200);

const out = await page.evaluate(({ ROLLS, NDICE, PATCH }) => {
  const K = window.KAKAJA;
  if (PATCH){
    if (PATCH.stiffness != null){
      const apply = cm => {
        cm.contactEquationStiffness = PATCH.stiffness;
        cm.frictionEquationStiffness = PATCH.stiffness;
        if (PATCH.relax != null){ cm.contactEquationRelaxation = PATCH.relax; cm.frictionEquationRelaxation = PATCH.relax; }
      };
      apply(K.world.defaultContactMaterial);
      K.world.contactmaterials.forEach(apply);
    }
    if (PATCH.iterations) K.world.solver.iterations = PATCH.iterations;
    if (PATCH.dieRest != null)
      K.world.contactmaterials.forEach(cm => {
        if (cm.materials.every(m => m.name === 'die')) cm.restitution = PATCH.dieRest;
      });
    if (PATCH.sleepSpeed != null) K.dice.forEach(d => d.body.sleepSpeedLimit = PATCH.sleepSpeed);
    if (PATCH.sleepTime != null) K.dice.forEach(d => d.body.sleepTimeLimit = PATCH.sleepTime);
    if (PATCH.linDamp != null) K.dice.forEach(d => d.body.linearDamping = PATCH.linDamp);
    if (PATCH.angDamp != null) K.dice.forEach(d => d.body.angularDamping = PATCH.angDamp);
    if (PATCH.nudge) Object.assign(K.CFG.nudge, PATCH.nudge);
  }

  const S = K.CFG.physics.step, SLEEP = K.CFG.physics.sleepSpeed;
  const FAST = 4.0;              // clearly still flying
  const flat = K.CFG.die.size * 1.15;
  const tails = [], totals = [], nudgeCounts = [], creepFrac = [];
  let neverQuiet = 0;
  const causes = { stacked: 0, wall: 0, tilted: 0 };

  for (let r = 0; r < ROLLS; r++){
    const set = K.__throwSet(K.__ensure(6).slice(0, NDICE),
      { power: 0.75 + Math.random() * 0.7, dx: (Math.random() - .5) * 0.7 });
    let steps = 0, quiet = 0, nudges = 0, lastFast = 0, creep = 0, done = false;

    while (steps < 3600){
      K.world.step(S); steps++;
      if (K.__rescue(set)) { quiet = 0; continue; }
      const vmax = Math.max(...set.map(d => d.speed));
      if (vmax > FAST) lastFast = steps;
      // "creeping": slower than a real tumble but not yet asleep
      if (vmax <= FAST && vmax > SLEEP * 0.5) creep++;
      if (vmax > SLEEP) { quiet = 0; continue; }
      if (++quiet < 10) continue;
      set.forEach(d => d.sync());
      const reads = set.map(d => d.read());
      const bad = reads.findIndex((x, i) => x.confidence < 0.94 || set[i].body.position.y > flat);
      if (bad >= 0){
        // why is it cocked? stacked on another die, or just tilted?
        if (set[bad].body.position.y > flat) causes.stacked++;
        else if (Math.abs(set[bad].body.position.x) > K.CFG.tray.w/2 - K.CFG.die.size*1.1
              || set[bad].body.position.z > K.PLAY.zNear - K.CFG.die.size*1.1
              || set[bad].body.position.z < K.PLAY.zFar + K.CFG.die.size*1.1) causes.wall++;
        else causes.tilted++;
        if (nudges++ < 8){ K.__nudge(set[bad]); quiet = 0; continue; }
        break;
      }
      done = true; break;
    }
    if (!done) neverQuiet++;
    totals.push(steps * S);
    tails.push((steps - lastFast) * S);     // time between the last real motion and rest
    creepFrac.push(creep * S);
    nudgeCounts.push(nudges);
  }
  const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)];
  return {
    total:  { p50: q(totals, .5), p90: q(totals, .9), max: Math.max(...totals) },
    tail:   { p50: q(tails, .5), p90: q(tails, .9), max: Math.max(...tails) },
    creep:  { p50: q(creepFrac, .5), p90: q(creepFrac, .9), max: Math.max(...creepFrac) },
    nudged: nudgeCounts.filter(n => n > 0).length,
    nudgesTotal: nudgeCounts.reduce((a, b) => a + b, 0),
    neverQuiet, causes, rolls: ROLLS, ndice: NDICE,
  };
}, { ROLLS, NDICE, PATCH });

const f = v => v.toFixed(2) + 's';
console.log(`
${out.rolls} throws of ${out.ndice} dice${PATCH ? '   patch ' + JSON.stringify(PATCH) : ''}
  total roll        p50 ${f(out.total.p50)}  p90 ${f(out.total.p90)}  max ${f(out.total.max)}
  settling tail     p50 ${f(out.tail.p50)}  p90 ${f(out.tail.p90)}  max ${f(out.tail.max)}   <- time after the last real motion
  creeping          p50 ${f(out.creep.p50)}  p90 ${f(out.creep.p90)}  max ${f(out.creep.max)}   <- slow-but-moving, this is the tremble
  nudged            ${out.nudged}/${out.rolls} throws (${(100*out.nudged/out.rolls).toFixed(1)}%), ${out.nudgesTotal} nudges total
  never settled     ${out.neverQuiet}
  why cocked        stacked on another ${out.causes.stacked}   against a wall ${out.causes.wall}   just tilted ${out.causes.tilted}
`);

await browser.close(); server.close();
