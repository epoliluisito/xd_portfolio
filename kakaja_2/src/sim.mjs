/* ==========================================================================
   Kakaja — the dice simulation.

   Depends on cannon-es and nothing else: no three.js, no DOM. That means the
   identical simulation can run in a browser, in a worker, or on a server.

   Two properties matter here and both are deliberate:

   1. SEED-DRIVEN. Every random draw comes from one seeded stream, so a throw is
      reproducible from one integer.

   2. STEP-DRIVEN. The settle/cocked-die logic runs once per FIXED PHYSICS STEP,
      not once per rendered frame. That is what makes a headless run and a
      rendered run produce the same sequence of events — if the nudge fired on a
      different step because a frame happened to contain three steps instead of
      one, the two runs would drift apart and the whole scheme below collapses.

   Why this file exists at all: online, a client must not decide its own dice.
   The server sends the values; the client's job is to SHOW them. See
   `labelFor` for how that is done without faking the physics.
   ========================================================================== */
import * as CANNON from 'cannon-es';
import { rng, randomQuat, spread } from './rng.mjs';

/* ---------------------------------------------------------------- the die */
// The six cube faces as local axes, and the value printed on each by a
// standard western die (opposite faces sum to 7, right-handed 1-2-3 corner).
export const FACE_AXES = [
  [ 1, 0, 0], [-1, 0, 0], [ 0, 1, 0], [ 0,-1, 0], [ 0, 0, 1], [ 0, 0,-1],
];
export const STD_VALUES = [3, 4, 1, 6, 2, 5];
export const AXIS_OF_VALUE = (() => {
  const m = []; STD_VALUES.forEach((v, i) => m[v] = i); return m;
})();

/* ------------------------------------------------- the 24 cube rotations
   A die's identity is only the printing on it. Rotating the pip pattern inside
   the cube by one of the 24 orientation-preserving cube rotations produces
   another perfectly valid die — visually indistinguishable, because the blank
   cube is symmetric under exactly this group.

   That is the trick that makes server-authoritative dice possible without
   faking anything: simulate the throw honestly, see which face lands up, and
   only THEN choose which value is printed on it.

   The alternative — searching random seeds until the throw happens to produce
   the required values — was measured and rejected: 462 attempts on average for
   six dice at ~6ms each is a 2.8 second stall, and the worst case is 46,656
   attempts, about five minutes. */
function quatMulAxis(q, v){                       // rotate a vector by a quaternion
  const [x, y, z] = v, { x: qx, y: qy, z: qz, w: qw } = q;
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [
    Math.round(ix * qw + iw * -qx + iy * -qz - iz * -qy),
    Math.round(iy * qw + iw * -qy + iz * -qx - ix * -qz),
    Math.round(iz * qw + iw * -qz + ix * -qy - iy * -qx),
  ];
}
const axisIndex = v => FACE_AXES.findIndex(a => a[0] === v[0] && a[1] === v[1] && a[2] === v[2]);

export const CUBE_ROTATIONS = (() => {
  // build the group by composing quarter turns about the three axes
  const key = q => [q.x, q.y, q.z, q.w].map(n => n.toFixed(3)).join(',');
  const mul = (a, b) => ({
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  });
  const s = Math.SQRT1_2;
  const gens = [
    { x: s, y: 0, z: 0, w: s }, { x: 0, y: s, z: 0, w: s }, { x: 0, y: 0, z: s, w: s },
  ];
  const found = new Map();
  const id = { x: 0, y: 0, z: 0, w: 1 };
  const queue = [id];
  found.set(key(id), id);
  while (queue.length){
    const q = queue.shift();
    for (const g of gens){
      const n = mul(g, q);
      // normalise sign so q and -q aren't counted twice
      const c = (n.w < -1e-9 || (Math.abs(n.w) < 1e-9 && n.x < -1e-9))
        ? { x: -n.x, y: -n.y, z: -n.z, w: -n.w } : n;
      if (!found.has(key(c))){ found.set(key(c), c); queue.push(c); }
    }
  }
  // Deduplicate on the face permutation, not on the quaternion: q and -q are
  // the same rotation, and sign-normalising alone let four duplicates through.
  // Duplicates would quietly bias which printing gets chosen.
  const byPerm = new Map();
  for (const q of found.values()){
    q.perm = FACE_AXES.map(a => axisIndex(quatMulAxis(q, a)));
    const k = q.perm.join(',');
    if (!byPerm.has(k)) byPerm.set(k, q);
  }
  const list = [...byPerm.values()];
  if (list.length !== 24) throw new Error(`cube group has ${list.length} elements, expected 24`);
  return list;
})();

// rotations[from][to] = every rotation carrying face `from` onto face `to`
const ROT_INDEX = (() => {
  const t = FACE_AXES.map(() => FACE_AXES.map(() => []));
  for (const q of CUBE_ROTATIONS)
    q.perm.forEach((to, from) => t[from][to].push(q));
  return t;
})();

/**
 * Choose how to print a die so that face `landedAxis` reads `value`.
 * Returns a quaternion to apply to the pip mesh inside the die body.
 * There are always four valid answers; pick one at random so the printing
 * can't be reverse-engineered from a sequence of throws.
 */
export function labelFor(landedAxis, value, r = Math.random){
  const from = AXIS_OF_VALUE[value];              // where the value sits as standard
  const opts = ROT_INDEX[from][landedAxis];
  return opts[Math.min(opts.length - 1, (r() * opts.length) | 0)];
}

/** What value a labelled die shows on a given local face. */
export function valueOnAxis(axis, label){
  return STD_VALUES[label ? label.perm.indexOf(axis) : axis];
}

/* ------------------------------------------------------------- the world */
export function createDiceWorld(CFG){
  const PLAY = {
    zNear: CFG.tray.d / 2 - CFG.tray.saved,
    zFar: -CFG.tray.d / 2,
  };
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, CFG.physics.gravity, 0) });
  // Naive (O(n^2)) on purpose: ~11 bodies, and sweep-and-prune was
  // intermittently missing die-wall pairs, letting dice escape the tray.
  world.broadphase = new CANNON.NaiveBroadphase();
  world.allowSleep = true;
  world.solver.iterations = 20;
  const stiff = { contactEquationStiffness: 1e9, contactEquationRelaxation: 3,
                  frictionEquationStiffness: 1e9, frictionEquationRelaxation: 3 };
  Object.assign(world.defaultContactMaterial, stiff);

  const matDie = new CANNON.Material('die');
  const matTable = new CANNON.Material('table');
  // Walls have their own material. A die can only rest leaning on a wall if the
  // wall grips it — with the floor's friction on the walls that was 85% of all
  // cocked dice. Near-frictionless walls let a leaning die slide back flat.
  const matWall = new CANNON.Material('wall');
  world.addContactMaterial(new CANNON.ContactMaterial(matDie, matTable, {
    friction: CFG.physics.friction, restitution: CFG.physics.restitution, ...stiff }));
  world.addContactMaterial(new CANNON.ContactMaterial(matDie, matWall, {
    friction: 0.0, restitution: 0.42, ...stiff }));
  // Dice bounce off each other and barely grip: nestling into a leaning pile is
  // the other source of cocked dice.
  world.addContactMaterial(new CANNON.ContactMaterial(matDie, matDie, {
    friction: 0.04, restitution: 0.58, ...stiff }));

  const { w, d, rim } = CFG.tray;
  const floor = new CANNON.Body({ mass: 0, material: matTable, shape: new CANNON.Plane() });
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floor);

  const th = 4, H = 14;                    // thick and tall so nothing escapes
  const wall = (hx, hy, hz, x, y, z) => {
    const b = new CANNON.Body({ mass: 0, material: matWall,
      shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)) });
    b.position.set(x, y, z); world.addBody(b);
  };
  // Flaring these outward like a real dice tray was tried and is WORSE: a
  // sloped wall gives a die a stable tilted surface to sit on (25% -> 39%).
  wall(w / 2 + th, H / 2, th / 2, 0, H / 2 - rim * .1, -d / 2 - th / 2);
  wall(th / 2, H / 2, d / 2 + th, -w / 2 - th / 2, H / 2 - rim * .1, 0);
  wall(th / 2, H / 2, d / 2 + th,  w / 2 + th / 2, H / 2 - rim * .1, 0);
  wall(w / 2 + th, th / 2, d / 2 + th, 0, H + th / 2, 0);                 // ceiling
  // near wall at the edge of the saved strip, so a throw can't disturb dice
  // already set aside
  wall(w / 2 + th, H / 2, th / 2, 0, H / 2 - rim * .1, PLAY.zNear + th / 2);

  const half = CFG.die.size / 2 * 0.97;
  const bodies = [];
  for (let i = 0; i < CFG.diceCount; i++){
    const b = new CANNON.Body({
      mass: CFG.die.mass, material: matDie,
      shape: new CANNON.Box(new CANNON.Vec3(half, half, half)),
      linearDamping: CFG.physics.linDamp, angularDamping: CFG.physics.angDamp,
      sleepSpeedLimit: CFG.physics.sleepSpeed, sleepTimeLimit: CFG.physics.sleepTime,
      allowSleep: true,
    });
    b.sleep();
    world.addBody(b);
    bodies.push(b);
  }
  return { world, bodies, PLAY, CFG };
}

const speedOf = b => b.velocity.length() + b.angularVelocity.length() * 0.55;
const vForApex = (CFG, h) => Math.sqrt(2 * Math.abs(CFG.physics.gravity) * h);

/* --------------------------------------------------------------- a throw */
/**
 * Start a throw.
 *
 * `indices` says WHICH bodies to throw, and defaults to the first n. It matters
 * because after a set-aside the dice still in hand are an arbitrary subset —
 * dice 1, 3, 4 and 5, say — and throwing bodies 0..3 instead would fling two
 * dice that are sitting safely in the saved row back across the table while two
 * dice that are still in play get parked under the floor. That is not
 * hypothetical; it shipped, and it is what `tools/truth.mjs` now guards.
 *
 * Every per-die parameter is derived from the loop counter k, never from the
 * body index, so the k-th die of a throw gets the same treatment no matter
 * which body it happens to be. That is what lets the preview reproduce the
 * visible throw exactly.
 *
 * Bodies not being thrown are LEFT ALONE. The caller owns them (they are the
 * dice you set aside), and moving them here is how the above happened.
 */
export function beginThrow(sim, { seed, n, power = 1, skew = 0, indices = null }){
  const { bodies, CFG, PLAY } = sim;
  const idx = indices || Array.from({ length: n }, (_, k) => k);
  if (idx.length !== n) throw new Error(`beginThrow: ${idx.length} indices for n=${n}`);
  const r = rng(seed);
  const T = CFG.throw;
  const halfW = CFG.tray.w / 2 - CFG.die.size * 0.75;
  // Spawn on a grid at most three across, so neighbouring lanes are always
  // wider than a die; fanning all six across a fixed span made the lanes
  // narrower than the dice and a third of throws landed one on top of another.
  const cols = Math.min(3, n), laneX = cols > 1 ? (halfW * 2) / (cols - 1) : 0;
  const order = [];
  for (let k = 0; k < n; k += 2) order.push(k);
  for (let k = 1; k < n; k += 2) order.push(k);

  const thrown = [];
  for (let k = 0; k < n; k++){
    const b = bodies[idx[k]];
    // A die that was set aside is a STATIC body with collisions off; it has to
    // come back to life before it can be thrown.
    b.type = CANNON.Body.DYNAMIC;
    b.collisionResponse = true;
    b.velocity.setZero(); b.angularVelocity.setZero();
    b.force.setZero(); b.torque.setZero();

    const slot = order[k], col = slot % cols, row = (slot / cols) | 0;
    const x = (cols > 1 ? -halfW + col * laneX : 0) + spread(r, 0.225);
    b.wakeUp();
    b.position.set(
      Math.max(-halfW, Math.min(halfW, x)),
      T.fromY + k * 0.95 + r() * 0.8,          // stack in height so they arrive apart
      PLAY.zNear - T.inset - row * (CFG.die.size + 0.5) - r() * 0.4
    );
    randomQuat(r, b.quaternion);
    const s = T.speed * power;
    b.velocity.set(
      (skew * 2.2 + spread(r, T.spread)) * s * 0.5,
      vForApex(CFG, T.apex) * (0.55 + r() * 0.75),
      -s * (0.85 + r() * 0.3)                  // away from the player
    );
    b.angularVelocity.set(spread(r, T.spin), spread(r, T.spin * 0.5), spread(r, T.spin));
    thrown.push(b);
  }
  return { r, n, step: 0, quiet: 0, nudges: 0, done: false, bodies: thrown, indices: idx };
}

/** Which face points up, and how convincingly (1 = perfectly flat). */
export function readBody(b){
  const q = b.quaternion;
  let best = -2, axis = 2;
  for (let i = 0; i < 6; i++){
    const a = FACE_AXES[i];
    // y component of the rotated axis
    const ix = q.w * a[0] + q.y * a[2] - q.z * a[1];
    const iy = q.w * a[1] + q.z * a[0] - q.x * a[2];
    const iz = q.w * a[2] + q.x * a[1] - q.y * a[0];
    const iw = -q.x * a[0] - q.y * a[1] - q.z * a[2];
    const y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
    if (y > best){ best = y; axis = i; }
  }
  return { axis, confidence: best };
}

/**
 * Advance exactly one fixed step and run the settle logic.
 * Returns 'rolling' | 'settled'. Call this from the render loop AND from the
 * headless preview — identical call sequences are the whole point.
 */
export function stepThrow(sim, t){
  const { world, CFG, PLAY } = sim;
  if (t.done) return 'settled';
  world.step(CFG.physics.step);
  t.step++;

  // safety net: a die should never be outside the tray
  const halfW = CFG.tray.w / 2;
  let rescued = false;
  for (const b of t.bodies){
    const p = b.position;
    if (Math.abs(p.x) > halfW + 0.3 || p.z > PLAY.zNear + 0.3 || p.z < PLAY.zFar - 0.3
        || p.y < -1.5 || p.y > 18){
      b.wakeUp();
      b.position.set(spread(t.r, CFG.tray.w * 0.25), 5, PLAY.zNear - 4 - t.r() * 4);
      b.velocity.set(0, -2, 0);
      b.angularVelocity.set(spread(t.r, 6), spread(t.r, 6), spread(t.r, 6));
      rescued = true;
    }
  }
  if (rescued){ t.quiet = 0; return 'rolling'; }

  const elapsed = t.step * CFG.physics.step;
  if (elapsed > 10){                                  // failsafe: never hang
    for (const b of t.bodies){ b.velocity.setZero(); b.angularVelocity.setZero(); }
    t.quiet = 99;
  }
  if (t.quiet < 99 && t.bodies.some(b => speedOf(b) > CFG.physics.sleepSpeed)){
    t.quiet = 0; return 'rolling';
  }
  if (++t.quiet < 10) return 'rolling';

  // All quiet. A reading only counts if the die is flat AND on the table
  // rather than perched on a neighbour.
  const flat = CFG.die.size * 1.15;
  const reads = t.bodies.map(readBody);
  const bad = reads.findIndex((x, i) => x.confidence < 0.94 || t.bodies[i].position.y > flat);
  if (bad >= 0 && t.nudges < 8 && elapsed < 8){
    t.nudges++;
    nudgeBody(sim, t, bad);
    t.quiet = 0;
    return 'rolling';
  }
  t.done = true;
  t.axes = reads.map(x => x.axis);
  return 'settled';
}

/* A cocked die must not be read — the face up is ambiguous. Rather than
   jiggling it in place (which usually re-wedges it in the same gap, and reads
   to the player as the dice trembling), throw it clear into open table with a
   fresh orientation. One decisive toss beats several small ones. */
function nudgeBody(sim, t, i){
  const { CFG, PLAY } = sim, N = CFG.nudge, b = t.bodies[i];
  const halfW = CFG.tray.w / 2 - CFG.die.size;
  const zN = PLAY.zNear - CFG.die.size, zF = PLAY.zFar + CFG.die.size;
  let best = null, bestScore = -1;
  for (let k = 0; k < 40; k++){
    const a = t.r() * 6.283185307, rad = N.reach * (0.35 + t.r() * 0.65);
    const x = Math.max(-halfW, Math.min(halfW, b.position.x + Math.cos(a) * rad));
    const z = Math.max(zF, Math.min(zN, b.position.z + Math.sin(a) * rad));
    let score = Math.min(halfW - Math.abs(x), zN - z, z - zF);
    for (const o of t.bodies){
      if (o === b) continue;
      score = Math.min(score, Math.hypot(o.position.x - x, o.position.z - z) - CFG.die.size);
    }
    if (score > bestScore){ bestScore = score; best = { x, z }; }
  }
  const vy = vForApex(CFG, N.hop);
  const flight = 2 * vy / Math.abs(CFG.physics.gravity);
  b.wakeUp();
  b.velocity.set((best.x - b.position.x) / flight, vy, (best.z - b.position.z) / flight);
  // a fresh orientation keeps a re-thrown die as fair as a first throw
  randomQuat(t.r, b.quaternion);
  b.angularVelocity.set(spread(t.r, N.spin), spread(t.r, N.spin), spread(t.r, N.spin));
}

/**
 * Run a whole throw with no rendering. ~6ms for six dice — fast enough to do
 * before every visible throw, which is exactly what makes the labelling trick
 * work: simulate first, see where the dice land, then decide what is printed.
 */
export function previewThrow(sim, opts){
  // Put every body that is NOT being thrown into the same inert state the real
  // world's set-aside dice are in — static, no collision response, out of the
  // way. The two worlds then contain the same active bodies at the same
  // indices, which is what makes the preview an exact rehearsal rather than a
  // near-miss. (Same indices matters: the solver visits contacts in body-index
  // order, so a different index set is a different rounding path.)
  const idx = opts.indices || Array.from({ length: opts.n }, (_, k) => k);
  const active = new Set(idx);
  for (let i = 0; i < sim.bodies.length; i++){
    if (active.has(i)) continue;
    const b = sim.bodies[i];
    b.type = CANNON.Body.STATIC;
    b.collisionResponse = false;
    b.velocity.setZero(); b.angularVelocity.setZero();
    b.position.set(0, -60, 0);
    b.sleep();
  }
  const t = beginThrow(sim, opts);
  let guard = 0;
  while (!t.done && guard++ < 4000) stepThrow(sim, t);
  return { axes: t.axes || t.bodies.map(b => readBody(b).axis), steps: t.step, nudges: t.nudges };
}
