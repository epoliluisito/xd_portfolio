# Plusso — house camera

A three.js page for placing Plusso in his house and taking pictures of him at real scale.
The house is the greybox from `10_house.blend` — V03, the 'stage' plan: a Victorian London terrace,
ground floor, with the rooms enlarged (living room 11.23 × 12.80 m, ceiling 3.20) so a camera can get
away from him. Every object in it — doors, stairs, sofa, worktop — is still true size; Plusso is the same rigged model as the playground, with the calibrated
expression library.

## Run it

Open `index.html` directly in a browser — it works from `file://` because both models are
embedded as base64 (`assets/plusso-glb.js`, `assets/house-glb.js`). three.js loads from a CDN,
so you need to be online the first time.

Or serve it:    python3 -m http.server 8000     then open http://localhost:8000

## Three modes — Tab cycles, or 1 / 2 / 3

**Play** — move him like a game. W A S D walk (camera-relative), Shift run, Space jump.
Click the scene for mouse look, Esc releases; drag orbits, wheel zooms. Walls, furniture and
stairs are solid; he can climb the stairs. The follow camera roams freely — it will pass through a wall
rather than fight you. B turns on wall-avoidance (it eases in, never closer than 0.9 m) if you want it.

**Orbit** — he stays still, the mouse swings round him. O is a shortcut.

**Camera** — a free camera with a real lens; he stays put. W A S D fly, E / Q up and down
(Space / Ctrl also work), Shift fast, Alt fine, wheel dollies. `[` `]` step the lens
(18 · 24 · 28 · 35 · 50 · 85 mm on a 36 mm gauge). Y snaps the camera to 1.60 m — adult eye
height, the project's rule for in-context shots. T jumps to a top view with the ceilings hidden;
fly down from there. H toggles the ceilings. The free camera passes through walls on purpose.

## Light

The slider (or J / K, half an hour at a time) sets the time of day. The sun is real: it rises on the
east side, passes over the front of the house at midday so the bay gets the afternoon, and sets in
the west, casting shadows through the windows. The sky and ambient follow it, and the pendants come
on as it gets dark. L (or the checkbox) adds a flat work light for when you just need to see.
Pictures are taken with whatever light is set.

## Placing him

In orbit or camera mode: G grabs him — he follows the mouse across the floor he is standing on,
click drops him. Arrow keys nudge him 5 cm (Shift: 25 cm), relative to the camera. `,` and `.`
turn him 15°. The HUD shows his position and facing.

## Pictures

P, or the button, saves a PNG to your Downloads folder — exactly what is inside the frame guide,
at the size shown. F cycles the aspect (16:9 · 9:16 · 4:5 · 1:1 · 3:2), N the size (up to
3840 × 2160 / 2160 × 3840). R toggles the thirds grid. Files are named
`plusso_house_35mm_16x9_1920x1080_<date>_<time>.png`, so the lens and frame travel with the image.

## Notes

- Coordinates: Blender (x, y, z) arrive here as (x, z, −y). The front of the house is +z.
- Rebuild `assets/house-glb.js` from Blender after changing the house (see `10_house.blend`,
  text block README.md). Object names drive the colliders: anything named Floor_, Ceil_, Rug,
  Skirt_, PicRail_, Arch_, Switch_, Socket_, Pendant_, Handrail or glass is walk-through.
- S is walk-backwards in play mode, so orbit lives on O / 2 rather than S.
