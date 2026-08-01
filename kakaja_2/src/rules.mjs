/* ==========================================================================
   Kakaja — the rules.

   Pure functions over a dice-count vector: counts[v] = how many dice show v.
   Nothing here touches the DOM, the scene, the physics or the turn state, so
   this exact file is what a server imports to act as referee. Never let a
   client tell the server what a selection scored — re-run it through here.
   ========================================================================== */

export const RULES = {
  id: 'kakaja',
  name: 'Kakaja',
  diceCount: 6,

  // --- the one number that is still an open question -----------------------
  // A single 1. The rules as written said 10; every other single/triple pair in
  // the game is a 10x ratio (5 -> 50, three 5s -> 500) which makes 100 the
  // consistent reading, and solving the game exactly showed 10 pushes the share
  // of turns that end in Tutto from 21% to 32% because banking a 10 is never
  // worth it. Set this back to 10 to play it as first written.
  ONE: 100,

  FIVE: 50,                              // a single 5
  TRIPLE: [0, 1000, 200, 300, 400, 500, 600],
  KAKAJA: 1650,                          // 1-2-3-4-5-6 in a single throw of six
  targets: [3000, 6000, 11000],
  target: 11000,

  // 4th / 5th / 6th die matching a three-of-a-kind doubles / triples / quadruples
  mult(k){ return k <= 3 ? 1 : k - 2; },
  single(v){ return v === 1 ? this.ONE : v === 5 ? this.FIVE : 0; },

  isStraight(counts){
    for (let v = 1; v <= 6; v++) if (counts[v] !== 1) return false;
    return true;
  },

  // Best score that uses EVERY die in `counts`, with the partition that got
  // there. null when some die cannot be placed, which is what makes a selection
  // illegal — you may not set aside a lone 3.
  solve(counts){
    if (this.isStraight(counts))
      return { score: this.KAKAJA, parts: [{ kind: 'kakaja', pts: this.KAKAJA }] };
    return this._rec(counts, 1);
  },
  _rec(counts, v){
    if (v > 6) return { score: 0, parts: [] };
    const rest = this._rec(counts, v + 1);
    if (!rest) return null;
    const c = counts[v], sg = this.single(v);
    let best = null;
    const take = (score, parts) => {
      if (!best || score > best.score) best = { score, parts };
    };
    // no set of this value: leftovers are only allowed if they score as singles
    if (sg > 0 || c === 0){
      const parts = c > 0 ? [{ kind: 'single', v, k: c, pts: c * sg }] : [];
      take(c * sg + rest.score, [...parts, ...rest.parts]);
    }
    for (let k = 3; k <= c; k++){
      const rem = c - k;
      if (rem > 0 && sg === 0) continue;          // stranded dice: illegal
      const setPts = this.TRIPLE[v] * this.mult(k);
      const parts = [{ kind: 'set', v, k, pts: setPts, mult: this.mult(k) }];
      if (rem > 0) parts.push({ kind: 'single', v, k: rem, pts: rem * sg });
      take(setPts + rem * sg + rest.score, [...parts, ...rest.parts]);
    }
    return best;
  },

  // Convenience: score of a selection, or -1 if the selection is illegal.
  score(counts){ const s = this.solve(counts); return s ? s.score : -1; },

  // Best score per subset size. Keeping FEWER dice for fewer points is often
  // right, because it leaves more dice to re-roll — so every size is kept, not
  // just the highest-scoring one.
  keepOptions(counts){
    const bySize = new Map();
    const sub = [0, 0, 0, 0, 0, 0, 0];
    const go = (v) => {
      if (v > 6){
        let n = 0;
        for (let i = 1; i <= 6; i++) n += sub[i];
        if (n === 0) return;
        const s = this.solve(sub);
        if (s && (!bySize.has(n) || bySize.get(n).score < s.score))
          bySize.set(n, { n, score: s.score, counts: sub.slice() });
        return;
      }
      for (let k = 0; k <= counts[v]; k++){ sub[v] = k; go(v + 1); }
      sub[v] = 0;
    };
    go(1);
    return [...bySize.values()];
  },

  // Is there anything at all to set aside? If not, the turn is a Tutto.
  anyScore(counts){
    if (this.isStraight(counts)) return true;
    for (let v = 1; v <= 6; v++)
      if ((this.single(v) > 0 && counts[v] > 0) || counts[v] >= 3) return true;
    return false;
  },

  // Which values could be part of some legal keep — drives the dimming of dead
  // dice on the table.
  liveValues(counts){
    const out = new Set();
    if (this.isStraight(counts)){ for (let v = 1; v <= 6; v++) out.add(v); return out; }
    for (let v = 1; v <= 6; v++)
      if ((this.single(v) > 0 && counts[v] > 0) || counts[v] >= 3) out.add(v);
    return out;
  },

  // Highest-scoring legal keep, for the "best" hint and as an AI fallback.
  bestKeep(counts){
    let best = null;
    for (const o of this.keepOptions(counts))
      if (!best || o.score > best.score) best = o;
    return best;
  },

  // Plain-language description of a partition, e.g. "three 6s x2 + 5".
  describe(counts){
    const s = this.solve(counts);
    if (!s) return null;
    if (s.parts.some(p => p.kind === 'kakaja')) return 'Kakaja!';
    const bits = [];
    for (const p of s.parts){
      if (p.kind === 'set'){
        const names = ['', 'three', 'four', 'five', 'six'];
        bits.push(`${names[p.k - 2]} ${p.v}s${p.mult > 1 ? ` ×${p.mult}` : ''}`);
      } else if (p.kind === 'single'){
        bits.push(p.k > 1 ? `${p.k}× ${p.v}` : `${p.v}`);
      }
    }
    return bits.join(' + ');
  },
};

/** Format a score the way the UI and the server logs both should. */
export const fmt = n => n.toLocaleString('en-US');
