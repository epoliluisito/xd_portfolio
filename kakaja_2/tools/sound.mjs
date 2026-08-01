/* Are the dice actually making a noise?
 *
 * The clacks come from cannon 'collide' events on the dice bodies. When body
 * creation moved into src/sim.mjs those listeners were lost and the game
 * shipped silent, which no existing test could have caught — none of them
 * listened. This one spies on the synthesiser and counts.
 *
 * Run: node sound.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROOT = new URL(process.env.KROOT || '../', import.meta.url).pathname;
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': extname(f) === '.html' ? 'text/html' : 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8650 + (process.pid % 90);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/?q=low`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 30000 });

let pass = 0, fail = 0;
const check = (n, c, got) => { if (c) pass++; else { fail++; console.log(`  FAIL ${n}: ${JSON.stringify(got)}`); } };

const r = await page.evaluate(async () => {
  const K = window.KAKAJA, A = K.Audio, G = K.Game;
  A.init();
  const calls = { clack: [], chime: 0, fanfare: 0, bust: 0, tick: 0, stow: 0 };
  const wrap = (name) => { const f = A[name].bind(A); A[name] = (...a) => { calls[name]++; return f(...a); }; };
  const realClack = A.clack.bind(A);
  A.clack = s => { calls.clack.push(s); return realClack(s); };
  ['chime', 'fanfare', 'bust', 'tick', 'stow'].forEach(wrap);

  // a real six-dice throw, stepped to rest
  G.state = 'PLAY'; G.saved = 0; G.stowed = []; G.inHand = K.__ensure(6).slice();
  G.rolling = true; G.phase = 'ROLL'; G.active = G.inHand;
  K.__throwValues(G.inHand, K.localValues(6), null);
  const t = K.__throwState;
  let guard = 0;
  while (t && !t.done && guard++ < 5000) K.__sim.stepThrow(K.sim, t);

  // and the event sounds
  A.chime(true); A.fanfare(); A.bust(); A.tick();
  return {
    ctxState: A.ctx ? A.ctx.state : 'no context',
    on: A.on,
    clacks: calls.clack.length,
    loudest: calls.clack.length ? Math.max(...calls.clack).toFixed(2) : 0,
    quietest: calls.clack.length ? Math.min(...calls.clack).toFixed(2) : 0,
    chime: calls.chime, fanfare: calls.fanfare, bust: calls.bust, tick: calls.tick,
  };
});

console.log(`
audio context   ${r.ctxState}      sound on: ${r.on}
dice clacks     ${r.clacks} during one six-dice throw   (strength ${r.quietest} … ${r.loudest})
event sounds    chime ${r.chime}  fanfare ${r.fanfare}  bust ${r.bust}  tick ${r.tick}
`);
check('audio context is running', r.ctxState === 'running', r.ctxState);
check('dice make a noise when they land', r.clacks >= 3, r.clacks);
check('clacks are not all the same volume', r.loudest !== r.quietest, r);
check('event sounds fire', r.chime && r.fanfare && r.bust && r.tick, r);
console.log(`checks: ${pass} passed, ${fail} failed`);

await browser.close(); server.close();
