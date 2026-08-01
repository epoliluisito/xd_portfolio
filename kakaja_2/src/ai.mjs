/* ==========================================================================
   Kakaja — the opponents.

   A turn is a Markov decision process: roll n dice, pick a legal keep, then
   bank or roll on. With at most six dice it is small enough to solve EXACTLY by
   value iteration rather than approximate with a hand-tuned heuristic, which is
   what this does — in about 150ms, at runtime, from the rules.

   Because it is derived from RULES rather than hard-coded, changing the scoring
   (including what a single 1 is worth) re-derives correct opponents with no
   other work. The same file can run on a server to play a disconnected seat.
   ========================================================================== */
import { RULES } from './rules.mjs';

export const AI = {
  ready: false, f: null, STEP: 50, CAP: 6000, NS: 0, OUT: null,

  gcdStep(){
    const g = (a, b) => b ? g(b, a % b) : a;
    let s = RULES.KAKAJA;
    s = g(s, RULES.ONE); s = g(s, RULES.FIVE);
    for (let v = 1; v <= 6; v++)
      for (let k = 3; k <= 6; k++) s = g(s, RULES.TRIPLE[v] * RULES.mult(k));
    return Math.max(10, s);
  },

  // Every distinct outcome of n dice, with multinomial weights summing to 6^n.
  outcomes(n){
    const F = [1, 1, 2, 6, 24, 120, 720];
    const res = [], c = [0, 0, 0, 0, 0, 0, 0];
    const go = (v, left) => {
      if (v === 6){
        c[6] = left;
        let w = F[n];
        for (let i = 1; i <= 6; i++) w /= F[c[i]];
        res.push({ w, opts: RULES.keepOptions(c) });
        return;
      }
      for (let k = 0; k <= left; k++){ c[v] = k; go(v + 1, left - k); }
      c[v] = 0;
    };
    go(1, n);
    return res;
  },

  build(){
    const t0 = performance.now();
    this.STEP = this.gcdStep();
    this.NS = Math.floor(this.CAP / this.STEP) + 1;
    this.OUT = [null];
    for (let n = 1; n <= 6; n++) this.OUT[n] = this.outcomes(n);

    const f = [];
    for (let n = 0; n <= 6; n++) f[n] = new Float64Array(this.NS);
    for (let it = 0; it < 80; it++){
      let delta = 0;
      for (let n = 1; n <= 6; n++){
        const pow = 6 ** n;
        for (let si = 0; si < this.NS; si++){
          const s = si * this.STEP;
          let acc = 0;
          for (const o of this.OUT[n]){
            let best = 0;                                  // no legal keep = Tutto = 0
            for (const opt of o.opts){
              const ns = s + opt.score;
              const rollN = (n - opt.n) === 0 ? 6 : n - opt.n;   // all six used = hot dice
              const v = Math.max(ns, f[rollN][Math.min(this.NS - 1, Math.round(ns / this.STEP))]);
              if (v > best) best = v;
            }
            acc += o.w * best;
          }
          const nv = acc / pow;
          const dd = Math.abs(nv - f[n][si]);
          if (dd > delta) delta = dd;
          f[n][si] = nv;
        }
      }
      if (delta < 0.01) break;
    }
    this.f = f;
    this.ready = true;
    this.buildMs = performance.now() - t0;
    if (AI.verbose) console.log(`[KAKAJA] AI solved in ${this.buildMs.toFixed(0)}ms, step ${this.STEP}, E[turn] = ${f[6][0].toFixed(0)}`);
  },

  val(n, s){
    if (!this.ready) this.build();
    return this.f[n][Math.min(this.NS - 1, Math.round(s / this.STEP))];
  },

  // What should this player do with this throw?
  //   need  — points still required to win outright, or null if not in the endgame
  //   bold  — 1.0 is optimal; lower banks sooner, higher pushes harder
  decide(counts, nInHand, accumulated, { need = null, bold = 1 } = {}){
    if (!this.ready) this.build();
    const opts = RULES.keepOptions(counts);
    if (!opts.length) return null;                          // Tutto

    let pick = null, bestV = -Infinity;
    for (const o of opts){
      const ns = accumulated + o.score;
      const rollN = (nInHand - o.n) === 0 ? 6 : nInHand - o.n;
      const v = Math.max(ns, this.val(rollN, ns));
      if (v > bestV){ bestV = v; pick = o; }
    }
    const ns = accumulated + pick.score;
    const rollN = (nInHand - pick.n) === 0 ? 6 : nInHand - pick.n;

    let roll = this.val(rollN, ns) * bold > ns;
    // Endgame override: banking a total that still can't win is pointless, so
    // keep throwing while short of what it takes.
    if (need != null && ns < need) roll = true;
    if (need != null && ns >= need) roll = false;
    return { keep: pick, roll, hot: (nInHand - pick.n) === 0 };
  },
};

/** Set true to log the solve time and the expected value of a turn. */
AI.verbose = false;
