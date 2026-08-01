/* Physics health check: settle time, stray escapes, cocked rate, resting
   positions and face uniformity.

   This now runs in plain Node against build/src/sim.mjs — the SAME module the
   page imports — instead of driving a browser. No renderer means ~200x more
   throws per second, and there is still only one copy of the physics.

   Note on uniformity: since the labelling trick landed, the face a die shows is
   chosen by the server's RNG, not by the tumble (see simtest.mjs). The chi2
   below is therefore no longer a fairness test — it is a check that the tumble
   is still well mixed, which matters because a biased tumble would make the
   printing choice correlate with position on the table.

   Run: node tune.mjs [rolls] [dice] ['{"physics":{"friction":0.4}}']
*/
import { createDiceWorld, beginThrow, stepThrow, readBody } from '../src/sim.mjs';
import { TABLE } from '../src/table.mjs';
import { rng, randomSeed } from '../src/rng.mjs';

const ROLLS = +(process.argv[2] || 600);
const NDICE = +(process.argv[3] || 2);
const PATCH = process.argv[4] ? JSON.parse(process.argv[4]) : null;

const CFG = structuredClone(TABLE);
if (PATCH) for (const [grp, vals] of Object.entries(PATCH)) Object.assign(CFG[grp], vals);

const sim = createDiceWorld(CFG);
const { PLAY } = sim;
const S = CFG.physics.step;
const flat = CFG.die.size * 1.15;

const counts = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
const times = [], restX = [], restZ = [], restY = [];
let escapes = 0, nudged = 0, failed = 0;

const r0 = rng(0xC0FFEE);
for (let i = 0; i < ROLLS; i++){
  const t = beginThrow(sim, {
    seed: randomSeed(), n: NDICE,
    power: 0.75 + r0() * 0.7, skew: (r0() - .5) * 0.7,
  });
  const before = { rescues: 0 };
  let guard = 0;
  // stepThrow rescues silently; detect it by watching for a body that was out
  let sawEscape = false;
  while (!t.done && guard++ < 4000){
    for (const b of t.bodies){
      const p = b.position;
      if (Math.abs(p.x) > CFG.tray.w / 2 + 0.3 || p.z > PLAY.zNear + 0.3
       || p.z < PLAY.zFar - 0.3 || p.y < -1.5 || p.y > 18) sawEscape = true;
    }
    stepThrow(sim, t);
  }
  if (!t.done){ failed++; continue; }
  if (sawEscape) escapes++;
  if (t.nudges) nudged++;
  times.push(t.step * S);
  for (let k = 0; k < t.bodies.length; k++){
    const b = t.bodies[k], rd = readBody(b);
    // count the STANDARD value on the landed axis; with no labelling applied
    // this is the raw physical outcome, which is what we want to measure here
    counts[[3, 4, 1, 6, 2, 5][rd.axis]]++;
    restX.push(Math.abs(b.position.x)); restZ.push(b.position.z); restY.push(b.position.y);
  }
}

/* ------------------------------------------------------------- statistics */
const pct = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const n = Object.values(counts).reduce((a, b) => a + b, 0);
const exp = n / 6;
const chi = Object.values(counts).reduce((a, o) => a + (o - exp) ** 2 / exp, 0);
const pval = (() => {                       // Q(5/2, chi/2), df = 5
  const k = 2.5, x = chi / 2;
  let sum = 0, term = 1;
  for (let i = 0; i < 400; i++){ sum += term; term *= x / (k + i + 1); if (term < 1e-14) break; }
  const lg = z => {                          // Lanczos
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

const halfDie = CFG.die.size / 2 * 0.97;
const limX = CFG.tray.w / 2 - halfDie;
const penX = restX.filter(v => v > limX + 0.02);
const penZ = restZ.filter(v => v > PLAY.zNear - halfDie + 0.05 || v < PLAY.zFar + halfDie - 0.05);
const penY = restY.filter(v => Math.abs(v - CFG.die.size / 2) > 0.06);
const maxPen = Math.max(0, ...penX.map(v => v - limX),
                           ...penZ.map(v => Math.abs(v) - (PLAY.zNear - halfDie)));

console.log(`
rolls          ${ROLLS} x ${NDICE} dice   (${n} face readings)${PATCH ? '   patch ' + JSON.stringify(PATCH) : ''}
settle time    p10 ${pct(times,.10).toFixed(2)}s   median ${pct(times,.50).toFixed(2)}s   p90 ${pct(times,.90).toFixed(2)}s   max ${Math.max(...times).toFixed(2)}s
strays         ${escapes} rolls needed a rescue  (${(100*escapes/ROLLS).toFixed(1)}%)
cocked         ${nudged} rolls needed a nudge   (${(100*nudged/ROLLS).toFixed(1)}%)
unresolved     ${failed}
faces          ${JSON.stringify(counts)}
mixing         chi2 ${chi.toFixed(2)} (df 5)   p ${pval.toFixed(3)}   ${pval > 0.05 ? 'OK - tumble is well mixed' : '** tumble is lopsided **'}
               (the value SHOWN is the server RNG's, not this - see simtest.mjs)
penetration    ${penX.length+penZ.length}/${restX.length} rest positions inside a wall   worst ${maxPen.toFixed(3)}u
rest height    ${penY.length}/${restY.length} off the table plane
rest depth z   p10 ${pct(restZ,.10).toFixed(1)}  median ${pct(restZ,.50).toFixed(1)}  p90 ${pct(restZ,.90).toFixed(1)}   (play area ${PLAY.zFar.toFixed(1)} .. ${PLAY.zNear.toFixed(1)}, negative = away from player)
`);
