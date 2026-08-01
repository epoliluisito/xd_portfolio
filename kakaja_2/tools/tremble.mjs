/* Measures the "trembling" tail of a throw.
 *
 * A throw has three phases: dice clearly flying, dice creeping, dice at rest.
 * The complaint was about the middle one - dice that have visibly stopped
 * bouncing but keep shuffling before the game accepts a result. This measures
 * how long that lasts, and separates jitter (dice never falling below the sleep
 * threshold) from nudges (the game deliberately re-throwing a cocked die).
 *
 * Runs in plain Node against build/src/sim.mjs, the same module the page
 * imports, so there is no second copy of the physics and no renderer in the way.
 *
 * Run: node tremble.mjs [rolls] [dice] ['{"nudge":{"reach":4}}']
 */
import { createDiceWorld, beginThrow, stepThrow, readBody } from '../src/sim.mjs';
import { TABLE } from '../src/table.mjs';
import { rng, randomSeed } from '../src/rng.mjs';

const ROLLS = +(process.argv[2] || 200);
const NDICE = +(process.argv[3] || 6);
const PATCH = process.argv[4] ? JSON.parse(process.argv[4]) : null;

const CFG = structuredClone(TABLE);
if (PATCH) for (const [grp, vals] of Object.entries(PATCH)) Object.assign(CFG[grp], vals);

const sim = createDiceWorld(CFG);
const { PLAY } = sim;
const S = CFG.physics.step;
const SLEEP = CFG.physics.sleepSpeed;
const FAST = 4.0;                        // clearly still flying
const flat = CFG.die.size * 1.15;
const speedOf = b => b.velocity.length() + b.angularVelocity.length() * 0.55;

const tails = [], totals = [], creepFrac = [], nudgeCounts = [];
let neverQuiet = 0;
const causes = { stacked: 0, wall: 0, tilted: 0 };

const r0 = rng(0x5EED17);
for (let i = 0; i < ROLLS; i++){
  const t = beginThrow(sim, {
    seed: randomSeed(), n: NDICE,
    power: 0.75 + r0() * 0.7, skew: (r0() - .5) * 0.7,
  });
  let lastFast = 0, creep = 0, guard = 0, seenNudges = 0;

  while (!t.done && guard++ < 4000){
    const vmax = Math.max(...t.bodies.map(speedOf));
    if (vmax > FAST) lastFast = t.step;
    if (vmax <= FAST && vmax > SLEEP * 0.5) creep++;

    // Attribute a nudge before stepThrow performs it: the die about to be
    // nudged is the first one that reads badly while everything is quiet.
    if (t.quiet >= 9 && vmax <= SLEEP){
      const reads = t.bodies.map(readBody);
      const bad = reads.findIndex((x, k) => x.confidence < 0.94 || t.bodies[k].position.y > flat);
      if (bad >= 0){
        const b = t.bodies[bad];
        if (b.position.y > flat) causes.stacked++;
        else if (Math.abs(b.position.x) > CFG.tray.w / 2 - CFG.die.size * 1.1
              || b.position.z > PLAY.zNear - CFG.die.size * 1.1
              || b.position.z < PLAY.zFar + CFG.die.size * 1.1) causes.wall++;
        else causes.tilted++;
      }
    }
    stepThrow(sim, t);
  }
  if (!t.done) neverQuiet++;
  totals.push(t.step * S);
  tails.push((t.step - lastFast) * S);    // time between the last real motion and rest
  creepFrac.push(creep * S);
  nudgeCounts.push(t.nudges);
}

const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)];
const f = v => v.toFixed(2) + 's';
const total = { p50: q(totals,.5), p90: q(totals,.9), max: Math.max(...totals) };
const tail  = { p50: q(tails,.5),  p90: q(tails,.9),  max: Math.max(...tails) };
const creep = { p50: q(creepFrac,.5), p90: q(creepFrac,.9), max: Math.max(...creepFrac) };
const nudged = nudgeCounts.filter(n => n > 0).length;

console.log(`
${ROLLS} throws of ${NDICE} dice${PATCH ? '   patch ' + JSON.stringify(PATCH) : ''}
  total roll        p50 ${f(total.p50)}  p90 ${f(total.p90)}  max ${f(total.max)}
  settling tail     p50 ${f(tail.p50)}  p90 ${f(tail.p90)}  max ${f(tail.max)}   <- time after the last real motion
  creeping          p50 ${f(creep.p50)}  p90 ${f(creep.p90)}  max ${f(creep.max)}   <- slow-but-moving, this is the tremble
  nudged            ${nudged}/${ROLLS} throws (${(100*nudged/ROLLS).toFixed(1)}%), ${nudgeCounts.reduce((a,b)=>a+b,0)} nudges total
  never settled     ${neverQuiet}
  why cocked        stacked on another ${causes.stacked}   against a wall ${causes.wall}   just tilted ${causes.tilted}
`);
