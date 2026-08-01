/* ==========================================================================
   Kakaja — seeded randomness.

   Every random draw the simulation makes comes from one of these streams, so a
   throw is reproducible from a single integer. That is what lets the game
   simulate a throw ahead of time, and what will let a server replay or audit
   one later. Nothing here may call Math.random().
   ========================================================================== */

/** mulberry32 — small, fast, and good enough for dice. */
export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed drawn from the host's own entropy, for when nobody supplies one. */
export function randomSeed(){
  if (typeof crypto !== 'undefined' && crypto.getRandomValues)
    return crypto.getRandomValues(new Uint32Array(1))[0];
  return (Math.random() * 4294967296) >>> 0;
}

/**
 * Uniform random rotation (Shoemake), written into {x,y,z,w}.
 *
 * Sampling Euler angles uniformly is the obvious thing and it is WRONG — it
 * clusters orientations near the poles, and that bias survives the tumble and
 * shows up as a skewed face distribution. This cost us a measurable bias once
 * already; don't replace it.
 */
export function randomQuat(r, out){
  const u1 = r(), u2 = r() * 6.283185307179586, u3 = r() * 6.283185307179586;
  const a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
  out.x = a * Math.sin(u2); out.y = a * Math.cos(u2);
  out.z = b * Math.sin(u3); out.w = b * Math.cos(u3);
  return out;
}

/** r in [lo, hi) */
export const between = (r, lo, hi) => lo + r() * (hi - lo);
/** r in [-h, +h) */
export const spread = (r, h) => (r() - 0.5) * 2 * h;
