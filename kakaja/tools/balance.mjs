/* Exact solution of a Kakaja turn, used to settle how much a single 1 is worth.
 *
 * A turn is a Markov decision process: roll n dice, see the outcome, choose a
 * legal subset to set aside, then choose to bank or roll on. Because n <= 6 the
 * whole thing is small enough to solve exactly by value iteration rather than
 * estimated by simulation, so the numbers below are the value of OPTIMAL play,
 * not of some heuristic that might flatter one variant over another.
 *
 * Run: node balance.mjs
 */

const TRIPLE = [0, 1000, 200, 300, 400, 500, 600];
const KAKAJA = 1650;
const mult = k => (k === 3 ? 1 : k === 4 ? 2 : k === 5 ? 3 : 4);
const FACT = [1, 1, 2, 6, 24, 120, 720];

// ---------------------------------------------------------------- the scorer
function makeScorer(ONE){
  const single = [0, ONE, 0, 0, 0, 50, 0];

  // Max score using EVERY die in `counts`; -1 if some die cannot be used.
  function scoreAll(counts){
    let straight = true;
    for (let v = 1; v <= 6; v++) if (counts[v] !== 1){ straight = false; break; }
    if (straight) return KAKAJA;
    return rec(counts, 1);
  }
  function rec(counts, v){
    if (v > 6) return 0;
    const c = counts[v], sg = single[v];
    const rest = rec(counts, v + 1);
    if (rest < 0) return -1;
    let best = -1;
    if (sg > 0 || c === 0) best = Math.max(best, c * sg + rest);
    for (let k = 3; k <= c; k++){
      const rem = c - k;
      if (rem > 0 && sg === 0) continue;
      best = Math.max(best, TRIPLE[v] * mult(k) + rem * sg + rest);
    }
    return best;
  }
  return scoreAll;
}

// Every legal set-aside from a throw, reduced to the best score per subset size.
// Keeping FEWER dice for fewer points is often correct (more dice to re-roll),
// so all sizes are retained, not just the highest-scoring one.
function keepOptions(counts, scoreAll){
  const bySize = new Map();
  const sub = [0, 0, 0, 0, 0, 0, 0];
  (function go(v){
    if (v > 6){
      let n = 0;
      for (let i = 1; i <= 6; i++) n += sub[i];
      if (n === 0) return;
      const sc = scoreAll(sub);
      if (sc >= 0 && (!bySize.has(n) || bySize.get(n) < sc)) bySize.set(n, sc);
      return;
    }
    for (let k = 0; k <= counts[v]; k++){ sub[v] = k; go(v + 1); }
    sub[v] = 0;
  })(1);
  return [...bySize.entries()].map(([n, sc]) => ({ n, sc }));
}

// All distinct outcomes of n dice as count-vectors, with multinomial weights
// summing to 6^n. 462 of them at n=6, so exact expectations are cheap.
function outcomes(n){
  const res = [], c = [0, 0, 0, 0, 0, 0, 0];
  (function go(v, left){
    if (v === 6){
      c[6] = left;
      let w = FACT[n];
      for (let i = 1; i <= 6; i++) w /= FACT[c[i]];
      res.push({ c: c.slice(), w });
      return;
    }
    for (let k = 0; k <= left; k++){ c[v] = k; go(v + 1, left - k); }
    c[v] = 0;
  })(1, n);
  return res;
}

// ------------------------------------------------------- solve one variant
function solve(ONE, { STEP = 10, CAP = 5000, ITERS = 80 } = {}){
  const scoreAll = makeScorer(ONE);
  const OUT = [];
  for (let n = 1; n <= 6; n++)
    OUT[n] = outcomes(n).map(o => ({ w: o.w, opts: keepOptions(o.c, scoreAll), c: o.c }));

  const NS = Math.floor(CAP / STEP) + 1;
  // f[n][si] = expected banked points from here, given you are about to roll n
  // dice with si*STEP already accumulated but not yet safe.
  const f = [];
  for (let n = 0; n <= 6; n++) f[n] = new Float64Array(NS);

  for (let it = 0; it < ITERS; it++){
    let delta = 0;
    for (let n = 1; n <= 6; n++){
      const pow = 6 ** n;
      for (let si = 0; si < NS; si++){
        const s = si * STEP;
        let acc = 0;
        for (const o of OUT[n]){
          let best = 0;                                    // no legal keep = Tutto = 0
          for (const opt of o.opts){
            const ns = s + opt.sc;
            const rollN = (n - opt.n) === 0 ? 6 : n - opt.n;   // all six used = hot dice
            const nsi = Math.min(NS - 1, Math.round(ns / STEP));
            const v = Math.max(ns, f[rollN][nsi]);          // bank vs roll on
            if (v > best) best = v;
          }
          acc += o.w * best;
        }
        const nv = acc / pow;
        if (Math.abs(nv - f[n][si]) > delta) delta = Math.abs(nv - f[n][si]);
        f[n][si] = nv;
      }
    }
    if (delta < 0.005) break;
  }

  // Highest accumulated score at which optimal play still rolls n dice.
  const rollCeiling = [];
  for (let n = 1; n <= 6; n++){
    let hi = 0;
    for (let si = 0; si < NS; si++) if (f[n][si] > si * STEP) hi = si * STEP;
    rollCeiling[n] = hi;
  }

  // Tutto probability per number of dice — identical across variants, since
  // whether a die scores does not depend on how much it scores.
  const bust = [];
  for (let n = 1; n <= 6; n++){
    let bad = 0;
    for (const o of OUT[n]) if (o.opts.length === 0) bad += o.w;
    bust[n] = bad / 6 ** n;
  }

  return { ONE, f, OUT, scoreAll, STEP, NS, rollCeiling, bust, perTurn: f[6][0] };
}

// ------------------------------------------- play out turns with that policy
function simulate(sol, turns = 300000, seed = 12345){
  let st = seed >>> 0;
  const rnd = () => { st ^= st << 13; st ^= st >>> 17; st ^= st << 5; st >>>= 0; return st / 4294967296; };
  const { f, STEP, NS, scoreAll } = sol;

  const scores = [];
  let tuttos = 0, hot = 0, kakajas = 0, throwsTotal = 0;
  const src = { one: 0, five: 0, triple: 0, mult: 0, kakaja: 0 };

  for (let t = 0; t < turns; t++){
    let n = 6, s = 0, banked = 0, busted = false;
    for (;;){
      const counts = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < n; i++) counts[1 + (rnd() * 6 | 0)]++;
      throwsTotal++;
      const opts = keepOptions(counts, scoreAll);
      if (opts.length === 0){ busted = true; break; }
      let bestV = -1, pick = null;
      for (const opt of opts){
        const ns = s + opt.sc;
        const rollN = (n - opt.n) === 0 ? 6 : n - opt.n;
        const v = Math.max(ns, f[rollN][Math.min(NS - 1, Math.round(ns / STEP))]);
        if (v > bestV){ bestV = v; pick = opt; }
      }
      // attribute the points for the breakdown
      if (pick.n === 6 && pick.sc === KAKAJA && counts.slice(1).every(c => c === 1)){
        src.kakaja += pick.sc; kakajas++;
      } else {
        src.triple += pick.sc;   // coarse bucket; refined below for singles
      }
      s += pick.sc;
      const rollN = (n - pick.n) === 0 ? 6 : n - pick.n;
      if (rollN === 6 && n - pick.n === 0) hot++;
      const stopV = s, rollV = f[rollN][Math.min(NS - 1, Math.round(s / STEP))];
      if (stopV >= rollV){ banked = s; break; }
      n = rollN;
    }
    scores.push(busted ? 0 : banked);
    if (busted) tuttos++;
  }
  scores.sort((a, b) => a - b);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const pct = p => scores[Math.min(scores.length - 1, Math.floor(scores.length * p))];
  return {
    mean, median: pct(.5), p10: pct(.1), p90: pct(.9), p99: pct(.99), max: scores[scores.length - 1],
    tuttoRate: tuttos / turns, throwsPerTurn: throwsTotal / turns,
    hotPerTurn: hot / turns, kakajaRate: kakajas / turns,
    zeroRate: scores.filter(v => v === 0).length / turns,
  };
}

// -------------------------------------------------------------------- report
console.log('Tutto probability by dice in hand (variant-independent):');
{
  const s = solve(100, { ITERS: 1 });
  console.log('  ' + s.bust.map((p, i) => i ? `${i}d ${(p * 100).toFixed(1)}%` : '').filter(Boolean).join('   '));
}

const TARGET = 11000;
const rows = [];
for (const ONE of [10, 50, 100]){
  const sol = solve(ONE);
  const sim = simulate(sol);
  rows.push({ ONE, sol, sim });
  console.log(`\n=== single 1 = ${ONE} ${'='.repeat(46)}`);
  console.log(`  expected points per turn, optimal play   ${sol.perTurn.toFixed(0)}`);
  console.log(`  realised mean / median                   ${sim.mean.toFixed(0)} / ${sim.median}`);
  console.log(`  p10 / p90 / p99 / max                    ${sim.p10} / ${sim.p90} / ${sim.p99} / ${sim.max}`);
  console.log(`  turn ends in Tutto                       ${(sim.tuttoRate * 100).toFixed(1)}%`);
  console.log(`  throws per turn                          ${sim.throwsPerTurn.toFixed(2)}`);
  console.log(`  hot dice (all six scored) per turn       ${sim.hotPerTurn.toFixed(3)}`);
  console.log(`  Kakaja straight rate                     1 in ${Math.round(1 / sim.kakajaRate)} turns`);
  console.log(`  optimal play keeps rolling n dice up to  ${sol.rollCeiling.map((v, i) => i ? `${i}d<${v}` : '').filter(Boolean).join('  ')}`);
  console.log(`  turns to reach ${TARGET}                    ${(TARGET / sim.mean).toFixed(1)}`);
  console.log(`  match length, 4 players @25s/turn        ~${Math.round(TARGET / sim.mean * 4 * 25 / 60)} min`);
}

console.log('\n--- comparison -------------------------------------------------------');
const base = rows.find(r => r.ONE === 100).sim.mean;
for (const r of rows)
  console.log(`  single 1 = ${String(r.ONE).padStart(3)}: ${r.sim.mean.toFixed(0)} pts/turn` +
              `   ${(r.sim.mean / base * 100).toFixed(0)}% of the 1=100 pace` +
              `   ${(TARGET / r.sim.mean).toFixed(0)} turns to ${TARGET}`);

// A single 1 is worth keeping only if it beats re-rolling that die. Show the
// break-even so the "is 100 too much" question has a concrete anchor.
console.log('\n--- what a single die is worth ---------------------------------------');
for (const ONE of [10, 50, 100]){
  const sol = solve(ONE, { ITERS: 40 });
  console.log(`  1=${String(ONE).padStart(3)}:  value of rolling 1 die with 0 banked = ${sol.f[1][0].toFixed(0)}` +
              `   |  6 fresh dice = ${sol.f[6][0].toFixed(0)}`);
}
