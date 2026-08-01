/* ==========================================================================
   Kakaja — the physical constants of the table.

   Only the values the SIMULATION needs live here, so a server can import this
   without dragging in anything about cameras, colours or timings. The client
   merges its presentation settings on top.

   These numbers are tuned, not arbitrary. The comments say why; changing one
   without re-running tools/tune.mjs and tools/tremble.mjs is how the dice start
   escaping the tray or trembling again.
   ========================================================================== */
export const TABLE = {
  diceCount: 6,

  // `saved` is a strip along the near edge, walled off from the physics, where
  // dice you set aside are parked. The playable area is the rest.
  // Wide and shallow: the tray has to fit between the HUD bands rather than
  // fill the screen, and width is what six dice need to settle apart.
  tray: { w: 11.6, d: 19.6, rim: 0.95, wall: 0.58, saved: 2.7 },

  // Sized so a die reads ~45px on a 390pt phone. Below about 40px the pips stop
  // being legible at a glance, which is the whole point of a top view.
  die: { size: 1.62, round: 0.23, mass: 1.0, stowScale: 0.76 },

  physics: {
    // Physically consistent scale chosen for watchability: 1 unit ~= 3cm, so
    // these are chunky 4cm casino dice on a ~35cm tray and g works out near
    // -330. Higher g is "more realistic" for 16mm dice and makes the throw a
    // slam you can't read on a phone.
    gravity: -330,
    step: 1 / 180, subSteps: 8,
    restitution: 0.30, friction: 0.34,
    linDamp: 0.02, angDamp: 0.06,
    sleepSpeed: 0.85, sleepTime: 0.10,
  },

  throw: {
    // Dice come to rest in the upper-middle of the tray rather than piling
    // against the far rim under the HUD. The lateral spread is wider than feels
    // necessary on purpose: it fans six dice out on the way down instead of
    // letting them arrive in formation and bunch, which is where cocked dice
    // come from.
    speed: 21, spread: 0.55, spin: 38,
    apex: 3.0,              // arc height in units, independent of gravity
    // Entry point, strictly INSIDE the tray footprint — spawning a body
    // overlapping a static wall makes cannon eject it across the table.
    fromY: 6.4, inset: 2.2,
  },

  // A cocked die is tossed clear rather than jiggled; `reach` is how far it may
  // travel looking for open table.
  nudge: { hop: 2.6, spin: 30, reach: 3.4 },
};
