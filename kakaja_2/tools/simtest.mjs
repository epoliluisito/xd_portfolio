/* Proves the two properties the online version depends on, in plain Node with
   no browser involved:

   1. A throw is reproducible from its seed.
   2. Given values chosen by someone else (the server), the client can show
      exactly those values while simulating an honest throw.

   Run: node simtest.mjs [trials]
*/
import { createDiceWorld, previewThrow, labelFor, valueOnAxis, CUBE_ROTATIONS } from '../src/sim.mjs';
import { TABLE } from '../src/table.mjs';
import { rng, randomSeed } from '../src/rng.mjs';

const TRIALS = +(process.argv[2] || 400);
const sim = createDiceWorld(TABLE);

// ---- 1. determinism --------------------------------------------------------
let mismatches = 0;
for (let i = 0; i < 60; i++){
  const seed = randomSeed();
  const a = previewThrow(sim, { seed, n: 6, power: 1.1, skew: 0.2 });
  const b = previewThrow(sim, { seed, n: 6, power: 1.1, skew: 0.2 });
  if (a.axes.join() !== b.axes.join() || a.steps !== b.steps) mismatches++;
}
console.log(`determinism:     ${mismatches === 0 ? 'PASS' : '** FAIL **'} — ${60 - mismatches}/60 identical replays`);

// a different seed must actually give a different throw
const s0 = randomSeed();
const distinct = new Set();
for (let i = 0; i < 40; i++) distinct.add(previewThrow(sim, { seed: s0 + i, n: 6 }).axes.join());
console.log(`seed sensitivity: ${distinct.size} distinct outcomes from 40 seeds`);

// ---- 2. the server decides, the client shows -------------------------------
const serverRng = rng(20260731);
const rollValue = () => 1 + Math.floor(serverRng() * 6);
const counts = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
let wrong = 0, totalSteps = 0, totalNudges = 0;
const times = [];

for (let t = 0; t < TRIALS; t++){
  const n = 1 + Math.floor(serverRng() * 6);
  const wanted = Array.from({ length: n }, rollValue);      // the server's dice

  const t0 = process.hrtime.bigint();
  const seed = randomSeed();
  const pre = previewThrow(sim, { seed, n, power: 0.8 + serverRng() * 0.6 });
  // choose what is printed on each die so the landed face reads the server's value
  const labels = pre.axes.map((axis, i) => labelFor(axis, wanted[i], serverRng));
  times.push(Number(process.hrtime.bigint() - t0) / 1e6);

  // what the player would actually see
  const shown = pre.axes.map((axis, i) => valueOnAxis(axis, labels[i]));
  if (shown.join() !== wanted.join()) wrong++;
  for (const v of shown) counts[v]++;
  totalSteps += pre.steps; totalNudges += pre.nudges;
}

const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(a.length * p)];
console.log(`server values shown: ${wrong === 0 ? 'PASS' : '** FAIL **'} — ${TRIALS - wrong}/${TRIALS} throws displayed exactly the requested dice`);
console.log(`cost per throw:  median ${q(times,.5).toFixed(1)}ms  p90 ${q(times,.9).toFixed(1)}ms  max ${Math.max(...times).toFixed(1)}ms`);
console.log(`                 (this is the whole preview: ${(totalSteps/TRIALS).toFixed(0)} physics steps, ${(totalNudges/TRIALS).toFixed(2)} nudges per throw)`);

// The displayed distribution is now the SERVER's RNG, not the physics. Any
// residual bias in the tumble can no longer reach the result at all.
const n = Object.values(counts).reduce((a,b)=>a+b,0), exp = n/6;
const chi = Object.values(counts).reduce((a,o)=>a+(o-exp)**2/exp, 0);
console.log(`faces shown:     ${JSON.stringify(counts)}`);
console.log(`                 chi2 ${chi.toFixed(2)} (df 5) over ${n} dice — this is the server RNG's fairness, not the physics'`);

// ---- 3. the printing must not be guessable ---------------------------------
const used = new Map();
for (let i = 0; i < 4000; i++){
  const L = labelFor(i % 6, 1 + (i % 6), serverRng);
  used.set(L, (used.get(L) || 0) + 1);
}
console.log(`printings used:  ${used.size} of ${CUBE_ROTATIONS.length} cube orientations across 4000 draws`);
