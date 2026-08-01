/* THE check that was missing.
 *
 * Plays real turns through the real game — real throws, real set-asides, real
 * physics — and after every throw asserts the only invariant that actually
 * matters to a player:
 *
 *     the number the game counts == the number physically showing on the die
 *
 * Nothing else in the suite tested this. `simtest.mjs` proved the physics
 * module can do it in isolation; `test.mjs` staged dice by hand and never
 * threw. The gap between them is exactly where the bug lived.
 *
 * It also reports, separately, whether the preview correctly PREDICTED each
 * landing. That is the online-readiness question: if the prediction is wrong,
 * the dice still read correctly (the game reads the table), but the values
 * shown would not be the ones a server asked for.
 *
 * Run: node truth.mjs [turns]
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const TURNS = +(process.argv[2] || 120);
const ROOT = new URL(process.env.KROOT || '../', import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': extname(f) === '.html' ? 'text/html' : 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8600 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/?q=low`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 30000 });

const out = await page.evaluate(async ({ TURNS }) => {
  const K = window.KAKAJA, G = K.Game, R = K.RULES;
  if (!K.AI.ready) K.AI.build();

  // Drive the throw ourselves and step the physics to completion, so a whole
  // turn resolves in milliseconds instead of waiting on the render loop.
  const settle = () => {
    const t = K.__throwState;
    let guard = 0;
    while (t && !t.done && guard++ < 5000) K.__sim.stepThrow(K.sim, t);
    K.dice.forEach(d => d.sync());
    return t;
  };
  // What is REALLY showing on this die, from its body orientation and the
  // pattern printed on it. This is what the player sees.
  const shown = d => K.__sim.valueOnAxis(d.upAxis(), d.label);

  const bad = [], mispredict = [], vanished = [], intruder = [], dimming = [];
  let throws = 0, diceRead = 0, turns = 0;

  // Seat a real match so the game's own settle handler has players to talk
  // about; then drive the turns ourselves.
  G.seat(2);
  G.state = 'PLAY';
  G.turn = 0;
  for (let turn = 0; turn < TURNS; turn++){
    // fresh turn
    G.stowed.forEach(d => d.unstow());
    G.stowed = [];
    G.saved = 0;
    G.inHand = K.__ensure(6).slice();
    turns++;

    for (let step = 0; step < 12; step++){
      const hand = G.inHand.slice();
      if (!hand.length) break;
      const values = K.localValues(hand.length);
      // where the set-aside dice are BEFORE the throw — they must not move
      const before = G.stowed.map(d => [d.body.position.x, d.body.position.y, d.body.position.z]);
      G.rolling = true; G.phase = 'ROLL'; G.active = hand;
      const info = K.__throwValues(hand, values, null);
      const t = settle();
      throws++;

      // 1. does every die in hand read the value the game recorded?
      for (let i = 0; i < hand.length; i++){
        const d = hand[i];
        diceRead++;
        const s = shown(d);
        if (s !== d.value)
          bad.push({ turn, step, n: hand.length, i, counted: d.value, showing: s });
        if (info && info.pre && K.__sim.valueOnAxis(info.pre.axes[i], d.label) !== d.value)
          mispredict.push({ turn, step, n: hand.length, i,
                            predicted: K.__sim.valueOnAxis(info.pre.axes[i], d.label), got: s });
        // 2. is it still on the table?
        const p = d.body.position;
        if (p.y < -1 || p.y > 18 || Math.abs(p.x) > K.CFG.tray.w) vanished.push({ turn, step, i, y: +p.y.toFixed(1) });
      }
      // 3. did anything that was set aside get moved by the throw?
      G.stowed.forEach((d, j) => {
        const p = d.body.position, b0 = before[j];
        const moved = Math.hypot(p.x - b0[0], p.y - b0[1], p.z - b0[2]);
        if (moved > 0.01) intruder.push({ turn, step, moved: +moved.toFixed(2) });
      });

      // 4. run the game's own settle handler and check the dimming: a die is
      //    dimmed exactly when it cannot be part of any legal keep. Getting
      //    this wrong is invisible to a scorer test but obvious to a player.
      G.onThrowSettled();
      const cc = [0,0,0,0,0,0,0];
      for (const d of hand) cc[d.value]++;
      const liveSet = R.liveValues(cc);
      for (const d of hand)
        if (d.dead === liveSet.has(d.value))
          dimming.push({ turn, step, value: d.value, dead: d.dead, live: [...liveSet] });

      // now play the turn on: keep the best legal set, roll on if the AI would
      const c = [0,0,0,0,0,0,0];
      for (const d of hand) c[d.value]++;
      const dec = K.AI.decide(c, hand.length, G.saved, {});
      if (!dec) break;                                   // Tutto
      const keep = dec.keep.counts.slice();
      const kept = [];
      for (const d of hand) if (keep[d.value] > 0){ keep[d.value]--; kept.push(d); }
      for (const d of kept){
        G.stowed.push(d);
        G.inHand.splice(G.inHand.indexOf(d), 1);
        d.stow(G.stowed.length - 1);
        // the slide into the saved row is a tween the render loop drives; run
        // it to completion here so the board state is what a player would see
        for (let f = 0; f < 20; f++) d.stepTween(0.05);
      }
      G.saved += dec.keep.score;
      if (!dec.roll) break;
      if (!G.inHand.length){ G.stowed.forEach(d => d.unstow()); G.stowed = []; G.inHand = K.__ensure(6).slice(); }
    }
  }
  return { bad, mispredict, vanished, intruder, dimming, throws, diceRead, turns };
}, { TURNS });

const pc = (n, d) => `${n}/${d} (${(100 * n / d).toFixed(1)}%)`;
console.log(`
${out.turns} turns, ${out.throws} real throws, ${out.diceRead} dice read

  score matches the pips     ${out.bad.length === 0 ? 'PASS' : '** FAIL **'}   wrong: ${pc(out.bad.length, out.diceRead)}
  dice stayed on the table   ${out.vanished.length === 0 ? 'PASS' : '** FAIL **'}   lost: ${out.vanished.length}
  set-aside dice undisturbed ${out.intruder.length === 0 ? 'PASS' : '** FAIL **'}   disturbed: ${out.intruder.length}
  preview predicted the roll ${out.mispredict.length === 0 ? 'PASS' : '** FAIL **'}   missed: ${pc(out.mispredict.length, out.diceRead)}
  dead dice dimmed correctly ${out.dimming.length === 0 ? 'PASS' : '** FAIL **'}   wrong: ${pc(out.dimming.length, out.diceRead)}
`);
for (const f of out.bad.slice(0, 8))       console.log('  wrong value  ', JSON.stringify(f));
for (const f of out.vanished.slice(0, 5))  console.log('  off table    ', JSON.stringify(f));
for (const f of out.intruder.slice(0, 5))  console.log('  aside moved  ', JSON.stringify(f));
for (const f of out.mispredict.slice(0, 5))console.log('  mispredicted ', JSON.stringify(f));
for (const f of out.dimming.slice(0, 5))   console.log('  bad dimming  ', JSON.stringify(f));

await browser.close(); server.close();
