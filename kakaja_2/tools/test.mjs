/* UI + interaction test for Kakaja. Drives a real human turn by tapping dice,
   then stages specific throws to capture the states that are hard to hit by
   chance (Kakaja, Tutto, an illegal selection). Run: node test.mjs */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';

const ROOT = new URL('../', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = join(ROOT, normalize(p)); await stat(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'text/javascript' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(''); }
});
const PORT = 8500 + (process.pid % 400);
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const logs = [];
page.on('console', m => { if (m.type() === 'error') logs.push(`[error] ${m.text()}`); });
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}\n${e.stack}`));

const t0 = Date.now();
await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.KAKAJA, { timeout: 20000 });
console.log(`boot to interactive: ${Date.now() - t0}ms`);
await page.waitForFunction(() => window.KAKAJA.AI.ready, { timeout: 30000 });
console.log('AI solve:', await page.evaluate(() => `${window.KAKAJA.AI.buildMs.toFixed(0)}ms, E[turn]=${window.KAKAJA.AI.f[6][0].toFixed(0)}`));
await page.waitForTimeout(1200);

await page.screenshot({ path: 'shots/01-title.png' });
await page.click('#scr-title [data-go="setup"]');
await page.waitForTimeout(600);
await page.click('.seat[data-n="4"]');
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/02-setup.png' });
await page.click('#scr-title [data-go="how"]').catch(() => {});
await page.click('#scr-setup [data-go="title"]');
await page.waitForTimeout(400);
await page.click('#scr-title [data-go="how"]');
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/03-howto.png' });
await page.click('#scr-how [data-go="title"]');
await page.waitForTimeout(400);
await page.click('#scr-title [data-go="setup"]');
await page.waitForTimeout(400);
await page.click('#scr-setup [data-go="start"]');
await page.waitForTimeout(600);

// ---- helper: put a specific throw on the table and enter SELECT
async function stage(values){
  await page.evaluate((values) => {
    const K = window.KAKAJA, G = K.Game, T = K.THREE;
    G.busy = false; G.rolling = false;
    K.__clear();
    G.saved = G.saved || 0;
    G.stowed = [];
    G.inHand = K.__ensure(6).slice(0, values.length);
    const cols = 3;
    // Lay each die flat (identity orientation, so local +Y is the face that is
    // up — axis index 2) and PRINT the wanted value onto that face. Same trick
    // the real throw uses, so what the game reads back is what a real landing
    // would have produced.
    const UP_AXIS = 2;
    G.inHand.forEach((d, i) => {
      const x = -3.2 + (i % cols) * 3.2;
      const z = K.PLAY.zNear - 5.5 - ((i / cols) | 0) * 3.2;
      d.unstow();
      d.body.type = K.CANNON.Body.STATIC;
      d.body.collisionResponse = false;
      d.body.position.set(x, K.CFG.die.size / 2, z);
      d.body.quaternion.set(0, 0, 0, 1);
      d.body.velocity.setZero(); d.body.angularVelocity.setZero();
      d.body.sleep();
      d.group.visible = true;
      d.setLabel(K.__sim.labelFor(UP_AXIS, values[i], Math.random), values[i]);
      d.sync();
      d.setLook();
    });
    G.onSettled();
  }, values);
  await page.waitForTimeout(700);
}
const read = () => page.evaluate(() => ({
  phase: window.KAKAJA.Game.phase,
  saved: window.KAKAJA.Game.saved,
  sel: window.KAKAJA.Game.selValue,
  selN: window.KAKAJA.Game.selection.length,
  aside: window.KAKAJA.Game.stowed.map(d => d.value),
  hand: window.KAKAJA.Game.inHand.map(d => d.value),
  dead: window.KAKAJA.Game.inHand.filter(d => d.dead).map(d => d.value),
  ledger: document.getElementById('l-saved').textContent + ' | ' + document.getElementById('l-sel').textContent,
  rollBtn: [document.getElementById('roll').textContent, document.getElementById('roll').disabled],
  bankBtn: [document.getElementById('bank').textContent, document.getElementById('bank').disabled],
  turn: document.getElementById('turnbar').textContent,
}));
// tap a die by its value (first match in hand)
async function tapValue(v){
  const pt = await page.evaluate((v) => {
    const K = window.KAKAJA;
    const d = K.Game.inHand.find(x => x.value === v && !x.selected);
    if (!d) return null;
    const p = d.group.position.clone().project(K.camera);
    return { x: (p.x * .5 + .5) * innerWidth, y: (-p.y * .5 + .5) * innerHeight };
  }, v);
  if (!pt) return false;
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(160);
  return true;
}

let pass = 0, fail = 0;
const check = (name, cond, got) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL ${name}: ${JSON.stringify(got)}`); }
};

// ---- scenario 1: mixed throw, dead dice dimmed, selection legality
await stage([1, 5, 2, 2, 3, 4]);
let s = await read();
check('enters SELECT', s.phase === 'SELECT', s.phase);
check('dead dice dimmed (2,2,3,4)', s.dead.sort().join() === '2,2,3,4', s.dead);
await page.screenshot({ path: 'shots/04-select-live.png' });

await tapValue(1);
s = await read();
check('one 1 selected = 100', s.sel === 100 && s.selN === 1, s);
check('bank offers 100', /Bank 100/.test(s.bankBtn[0]) && !s.bankBtn[1], s.bankBtn);
check('roll offers keep & roll', /Keep/.test(s.rollBtn[0]) && !s.rollBtn[1], s.rollBtn);
await tapValue(5);
s = await read();
check('1 + 5 = 150', s.sel === 150, s.sel);
await page.screenshot({ path: 'shots/05-selected.png' });

// dead dice must refuse selection
await tapValue(3);
s = await read();
check('dead die refuses selection', s.selN === 2, s);

// ---- scenario 2: keep & throw, then check the saved row
await page.click('#roll');
await page.waitForTimeout(900);
s = await read();
check('150 set aside', s.saved === 150, s.saved);
check('two dice in the saved row', s.aside.length === 2, s.aside);
check('four dice back in hand', s.hand.length === 4, s.hand);
await page.screenshot({ path: 'shots/06-stowed.png' });

// ---- scenario 3: an illegal selection is refused
await stage([2, 2, 2, 2, 3, 3]);
s = await read();
check('four 2s + two 3s: 3s are dead', s.dead.sort().join() === '3,3', s.dead);
await tapValue(2); await tapValue(2);
s = await read();
check('two 2s is not a score', s.sel === -1, s.sel);
check('roll disabled on illegal selection', s.rollBtn[1] === true, s.rollBtn);
check('ledger says so', /not a score/.test(s.ledger), s.ledger);
await page.screenshot({ path: 'shots/07-illegal.png' });
await tapValue(2);
s = await read();
check('three 2s = 200', s.sel === 200, s.sel);
await tapValue(2);
s = await read();
check('four 2s = 400 (doubled)', s.sel === 400, s.sel);
await page.screenshot({ path: 'shots/08-fourofakind.png' });

// ---- scenario 4: Kakaja
await stage([1, 2, 3, 4, 5, 6]);
s = await read();
check('Kakaja auto-selects all six', s.selN === 6 && s.sel === 1650, s);
check('nothing dead in a straight', s.dead.length === 0, s.dead);
await page.screenshot({ path: 'shots/09-kakaja.png' });

// ---- scenario 5: hot dice — keep all six, set comes back
await page.click('#roll');
await page.waitForTimeout(1900);
s = await read();
check('hot dice returns six to hand', s.hand.length === 6, s.hand);
check('points survive the reset', s.saved >= 1650, s.saved);
await page.screenshot({ path: 'shots/10-hotdice.png' });

// ---- scenario 6: Tutto
await stage([2, 2, 3, 3, 4, 6]);
await page.waitForTimeout(500);
s = await read();
check('Tutto detected', s.phase === 'TUTTO', s.phase);
check('turn points wiped', s.saved === 0, s.saved);
check('every die dimmed on a Tutto', s.dead.length === 6, s.dead);
check('ledger reset', /Turn 0/.test(s.ledger), s.ledger);
check('no stale bank label', s.bankBtn[0] === 'Bank' && s.bankBtn[1] === true, s.bankBtn);
await page.screenshot({ path: 'shots/11-tutto.png' });
await page.waitForTimeout(2200);

// ---- let the opponents play a few turns unattended
const before = await page.evaluate(() => window.KAKAJA.Game.current);
await page.waitForTimeout(14000);
const st = await page.evaluate(() => ({
  state: window.KAKAJA.Game.state, phase: window.KAKAJA.Game.phase,
  scores: window.KAKAJA.Game.players.map(p => `${p.name}:${p.score}`),
  turn: document.getElementById('turnbar').textContent,
}));
console.log('after 14s of play:', JSON.stringify(st));
await page.screenshot({ path: 'shots/12-opponents.png' });

const perf = await page.evaluate(() => ({
  draws: window.KAKAJA.renderer.info.render.calls,
  tris: window.KAKAJA.renderer.info.render.triangles,
  textures: window.KAKAJA.renderer.info.memory.textures,
}));
console.log('render budget:', JSON.stringify(perf));

for (const [name, vp] of Object.entries({
  'small-phone': { width: 320, height: 568 },
  'tall-phone':  { width: 430, height: 932 },
  'landscape':   { width: 900, height: 500 },
})){
  await page.setViewportSize(vp);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `shots/13-${name}.png` });
}

console.log(`\nchecks: ${pass} passed, ${fail} failed`);
console.log('--- console ---');
console.log(logs.length ? logs.join('\n') : '(clean)');
await browser.close(); server.close();
