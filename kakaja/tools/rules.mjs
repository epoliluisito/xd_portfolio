/* Correctness tests for the shipped Kakaja rules, run against the real
   index.html in a browser so there is no second copy of the logic to drift.
   Also plays out full matches to exercise Tutto / hot dice / the overtake rule.
   Run: node rules.mjs */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

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
const PORT = 8700 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message, e.stack));
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 20000 });

// ---------------------------------------------------------------- unit tests
// [dice…, expected score using ALL of them] — -1 means "not a legal set-aside"
const CASES = [
  [[1], 100],                       [[5], 50],
  [[2], -1],                        [[3], -1],
  [[2, 2], -1],                     [[6, 6], -1],
  [[1, 1], 200],                    [[1, 5], 150],
  [[1, 1, 1], 1000],                [[1, 1, 1, 1], 2000],
  [[1, 1, 1, 1, 1], 3000],          [[1, 1, 1, 1, 1, 1], 4000],
  [[2, 2, 2], 200],                 [[2, 2, 2, 2], 400],
  [[2, 2, 2, 2, 2], 600],           [[2, 2, 2, 2, 2, 2], 800],
  [[3, 3, 3], 300],                 [[4, 4, 4], 400],
  [[5, 5, 5], 500],                 [[5, 5, 5, 5], 1000],
  [[5, 5, 5, 5, 5, 5], 2000],       [[6, 6, 6], 600],
  [[6, 6, 6, 6, 6, 6], 2400],
  [[1, 2, 3, 4, 5, 6], 1650],       // Kakaja
  // Kakaja must beat taking the 1 and the 5 as singles, and the alternative is
  // illegal anyway because 2/3/4/6 would be stranded.
  [[1, 1, 1, 5, 5, 5], 1500],
  [[1, 1, 1, 2, 2, 2], 1200],
  [[2, 2, 2, 3, 3, 3], 500],
  [[1, 1, 1, 1, 5, 5], 2100],       // four 1s doubled, plus two 5s
  [[1, 1, 1, 1, 1, 5], 3050],       // five 1s tripled, plus a 5
  [[4, 4, 4, 4, 1, 1], 1000],       // four 4s doubled + two 1s
  [[3, 3, 3, 3, 3, 1], 1000],       // five 3s tripled + a 1
  [[1, 2, 2, 2, 2, 2], 700],        // five 2s tripled + a 1
  [[1, 1, 2, 2, 2, 5], 450],        // two 1s + three 2s + a 5
  [[1, 5, 2], -1],                  // the 2 is stranded
  [[2, 3, 4, 5, 6, 6], -1],         // only the 5 scores, so not all six are usable
  [[3, 3, 3, 3], -1],               // four 3s is legal…
];
// four 3s IS legal (300 x2 = 600); fix that expectation explicitly
CASES[CASES.length - 1] = [[3, 3, 3, 3], 600];

const ANY = [
  [[2, 2, 3, 3, 4, 4], false],      // classic Tutto
  [[2, 3, 4, 6, 6, 2], false],
  [[2, 2, 3, 3, 4, 5], true],       // the 5 saves it
  [[2, 2, 2, 3, 3, 4], true],       // the triple saves it
  [[3, 3, 4, 4, 6, 6], false],
  [[1, 2, 3, 4, 5, 6], true],
];

const res = await page.evaluate(({ CASES, ANY }) => {
  const R = window.KAKAJA.RULES;
  const toCounts = a => { const c = [0,0,0,0,0,0,0]; for (const v of a) c[v]++; return c; };
  const fails = [];
  for (const [dice, want] of CASES){
    const got = R.score(toCounts(dice));
    if (got !== want) fails.push({ dice, want, got, what: 'score' });
  }
  for (const [dice, want] of ANY){
    const got = R.anyScore(toCounts(dice));
    if (got !== want) fails.push({ dice, want, got, what: 'anyScore' });
  }
  // A selection is legal exactly when score >= 0, and every keepOption must be legal.
  for (let t = 0; t < 4000; t++){
    const c = [0,0,0,0,0,0,0];
    const n = 1 + (Math.random() * 6 | 0);
    for (let i = 0; i < n; i++) c[1 + (Math.random() * 6 | 0)]++;
    for (const o of R.keepOptions(c)){
      if (R.score(o.counts) !== o.score)
        fails.push({ dice: c.slice(), what: 'keepOption score mismatch', want: o.score, got: R.score(o.counts) });
      let sz = 0; for (let v = 1; v <= 6; v++) sz += o.counts[v];
      if (sz !== o.n) fails.push({ dice: c.slice(), what: 'keepOption size mismatch' });
      for (let v = 1; v <= 6; v++) if (o.counts[v] > c[v])
        fails.push({ dice: c.slice(), what: 'keepOption uses dice not thrown' });
    }
    // anyScore must agree with there being at least one keep option
    if (R.anyScore(c) !== (R.keepOptions(c).length > 0))
      fails.push({ dice: c.slice(), what: 'anyScore disagrees with keepOptions' });
  }
  return { fails, describe: [
    R.describe(toCounts([1,1,1,1,5,5])),
    R.describe(toCounts([1,2,3,4,5,6])),
    R.describe(toCounts([6,6,6,6,6,6])),
    R.describe(toCounts([1,1,2,2,2,5])),
  ]};
}, { CASES, ANY });

console.log(`scorer: ${res.fails.length ? '** ' + res.fails.length + ' FAILURES **' : 'all cases pass'}`);
for (const f of res.fails.slice(0, 12)) console.log('  ', JSON.stringify(f));
console.log('descriptions:', res.describe.map(s => `"${s}"`).join(', '));

// ------------------------------------------------- full matches, all AI seats
const sim = await page.evaluate(async () => {
  const K = window.KAKAJA, G = K.Game, R = K.RULES;
  if (!K.AI.ready) K.AI.build();
  // Play the rules headlessly: same RULES + AI, without the physics or the
  // animation timers, so a whole match resolves in milliseconds.
  const roll = n => { const c=[0,0,0,0,0,0,0]; for(let i=0;i<n;i++) c[1+(Math.random()*6|0)]++; return c; };

  function playTurn(player, need, bold){
    let n = 6, s = 0, throws = 0, hot = 0;
    for (;;){
      const c = roll(n); throws++;
      const d = K.AI.decide(c, n, s, { need, bold });
      if (!d) return { got: 0, tutto: true, throws, hot };
      s += d.keep.score;
      const left = n - d.keep.n;
      if (left === 0) hot++;
      if (!d.roll) return { got: s, tutto: false, throws, hot };
      n = left === 0 ? 6 : left;
      if (throws > 60) return { got: s, tutto: false, throws, hot };
    }
  }

  const out = { matches: 0, rounds: [], winners: {}, tutto: 0, turns: 0, hot: 0,
                overtakes: 0, maxTurn: 0, scores: [] };
  const NP = 4;
  for (let m = 0; m < 400; m++){
    const P = Array.from({ length: NP }, (_, i) => ({ i, score: 0, bold: [1, .9, 1, 1.14][i] }));
    let round = 0, winner = null;
    while (!winner && round < 200){
      round++;
      for (let i = 0; i < NP; i++){
        // needToWin: target, or one past the best total already there
        let need = R.target;
        for (const q of P) if (q.score >= R.target && q.score + 1 > need) need = q.score + 1;
        const anyDone = P.some(q => q.score >= R.target);
        const r = playTurn(P[i], anyDone ? need - P[i].score : null, P[i].bold);
        P[i].score += r.got;
        out.turns++; out.hot += r.hot;
        if (r.tutto) out.tutto++;
        if (r.got > out.maxTurn) out.maxTurn = r.got;
      }
      const done = P.filter(q => q.score >= R.target);
      if (done.length){
        winner = done.reduce((a, b) => (b.score > a.score ? b : a));
        if (done.length > 1) out.overtakes++;
      }
    }
    out.matches++;
    out.rounds.push(round);
    out.winners[winner.i] = (out.winners[winner.i] || 0) + 1;
    out.scores.push(P.map(q => q.score));
  }
  return out;
});

const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`\nfull matches: ${sim.matches} x 4 players to ${await page.evaluate(() => window.KAKAJA.RULES.target)}`);
console.log(`  rounds per match      mean ${avg(sim.rounds).toFixed(1)}   min ${Math.min(...sim.rounds)}   max ${Math.max(...sim.rounds)}`);
console.log(`  turns per match       ${(sim.turns / sim.matches).toFixed(1)}`);
console.log(`  turns ending Tutto    ${(100 * sim.tutto / sim.turns).toFixed(1)}%`);
console.log(`  hot dice per turn     ${(sim.hot / sim.turns).toFixed(3)}`);
console.log(`  biggest single turn   ${sim.maxTurn}`);
console.log(`  rounds where a later player overtook: ${sim.overtakes} of ${sim.matches} matches`);
console.log(`  wins by seat          ${[0,1,2,3].map(i => `P${i} ${((sim.winners[i]||0)/sim.matches*100).toFixed(0)}%`).join('   ')}`);

await browser.close(); server.close();
