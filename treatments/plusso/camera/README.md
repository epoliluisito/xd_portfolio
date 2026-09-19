# Plusso — house & street camera

A three.js page for placing Plusso in his house and on his street and taking pictures of him at real scale.
The house is the greybox from `10_house.blend` — V03, the 'stage' plan: a Victorian London terrace,
ground floor, with the rooms enlarged (living room 11.23 × 12.80 m, ceiling 3.20) so a camera can get
away from him. Every object in it — doors, stairs, sofa, worktop — is still true size; Plusso is the same rigged model as the playground, with the calibrated
expression library.

The street is the same world as the 40 context plates (`renders/context_40`): a 2 m pavement, a 7.5 m
bus-route carriageway one kerb (125 mm) down, terraces of real 5 m frontages both sides (36 of them, plus a
corner shop, a pub and a four-storey mansion block), two bus stops, a zebra with belisha beacons, a pillar
box, a K6 phone box, street trees, and real-size traffic — hatchbacks, an SUV, an estate, a black cab, a
van, two double-deckers, a bike — and ten people from a 1.10 m child to a 1.80 m man, all placed so he can
stand beside them.

## Run it

Open `index.html` directly in a browser — it works from `file://` because both models are
embedded as base64 (`assets/plusso-glb.js`, `assets/house-glb.js`). three.js loads from a CDN,
so you need to be online the first time.

Or serve it:    python3 -m http.server 8000     then open http://localhost:8000

## The menu bar

Everything is in six dropdowns along the top — Mode, Move him, Camera, Look, Light, Picture — plus the
Take picture button and `?` for the full key list. Each menu item shows its key. The HUD at the bottom left
shows mode, lens, frame, time, the camera position and his position.

## Three modes — Tab cycles, or 1 / 2 / 3

**Play** — move him like a game. W A S D walk (camera-relative), Shift run, Space jump.
Click the scene for mouse look, Esc releases; drag orbits, wheel zooms. Walls, furniture, stairs,
railings, cars, posts and people are solid; he can climb the stairs and step off the kerb. The front door
stands open, so he can walk out through the hall, down the path and through the gate to the pavement.
The follow camera roams freely — it will pass through a wall rather than fight you. B turns on
wall-avoidance (it eases in, never closer than 0.9 m) if you want it.

**U** jumps him to the next place — living room, hall, front garden, the gate, the road, the west bus stop,
the zebra, the corner shop, the mansion block (Shift U goes back); the Place menu does the same.

**Orbit** — he stays still, the mouse swings round him. O is a shortcut. The wheel zooms 18 % per notch,
from 0.7 m to 80 m, and the camera follows at once.

**Camera** — a free camera with a real lens; he stays put. W A S D fly, E / Q up and down
(Space / Ctrl also work), Shift fast, Alt fine. The wheel dollies along the view in steps that grow with
the distance to him (fine when close, quick when far; Shift triples it). `[` `]` step the lens
(18 · 24 · 28 · 35 · 50 · 85 mm on a 36 mm gauge; 28 mm is the default). Y snaps the camera to 1.60 m — adult eye
height, the project's rule for in-context shots. T jumps to a top view with the ceilings hidden;
fly down from there. H toggles the ceilings. The free camera passes through walls on purpose.

## Light

The slider (or J / K, half an hour at a time) sets the time of day. The sun is real: it rises on the
east side, passes over the front of the house at midday so the bay gets the afternoon, and sets in
the west, casting shadows through the windows. The sky and ambient follow it, and the pendants come
on as it gets dark, and so do the street lamps. L (or the checkbox) adds a flat work light for when you
just need to see. Pictures are taken with whatever light is set. The sun's shadow box travels with him,
so shadows stay sharp in the house and anywhere down the street.

## Moving and placing him

- **Double-click** the floor or the street: he walks there in a straight line. If a doorway stops him he
  turns sideways by himself and tries again; if he is still stuck after a second he gives up and says so.
  Esc, or any move key, stops him.
- **Shift-click** anywhere on the ground: he is put there at once. This is the way to cross a room or a
  wall he cannot walk through.
- **U** cycles the places (living room → hall → garden → gate → road → bus stop → zebra → shop → flats),
  Shift-U goes back; the Place menu does the same.
- **X** held while walking: he turns 90° and walks sideways. His footprint is his real plan — 1.15 m across
  the arms, 0.48 m deep, checked as three circles — so a 762 mm internal door or the 838 mm front door
  stops him head-on and lets him through sideways, which is what the character bible says he does.
- In orbit or camera mode: G grabs him — he follows the mouse across the floor he is standing on,
  click drops him. Arrow keys nudge him 5 cm (Shift: 25 cm), relative to the camera. `,` and `.`
  turn him 15°. The HUD shows his position, facing, and whether he is sideways or walking somewhere.

## Fur

V, or the checkbox under Expression, hides the fur and shows the smooth body underneath — useful for
checking his silhouette and the reach of his arms against furniture and door frames.

## Pictures

P, or the button, saves a PNG to your Downloads folder — exactly what is inside the frame guide,
at the size shown. F cycles the aspect (16:9 · 9:16 · 4:5 · 1:1 · 3:2), N the size (up to
3840 × 2160 / 2160 × 3840). R toggles the thirds grid. Files are named
`plusso_house_35mm_16x9_1920x1080_<date>_<time>.png`, so the lens and frame travel with the image.

## Notes

- Coordinates: Blender (x, y, z) arrive here as (x, z, −y). The front of the house is +z.
- Rebuild `assets/house-glb.js` from Blender after changing the house or the street: select the meshes in
  HOUSE_SHELL, HOUSE_CEILING, FURNITURE and CITY (not G_world), export glTF Binary with +Y up, apply
  modifiers, Draco compression on, then base64 it into `window.HOUSE_GLB_B64`. `assets/house_city_draco.glb`
  is that export (3.9 MB; the page embeds it as 5.2 MB of base64 and decodes it with three's DRACOLoader).
- Object names drive the colliders. In the house anything named Floor_, Ceil_, Rug, Skirt_, PicRail_,
  Arch_, Switch_, Socket_, Pendant_, Handrail or glass is walk-through. On the street only what you would
  walk into is solid — building bodies, railings and plinths, gate posts, bays, shop fronts, trunks, posts,
  bollards, boxes, bins, benches, shelters, wheels and car bodies, people's legs and torsos; the road, kerbs,
  markings, paths, steps, roofs, canopies, lamp arms and hats are not. Anything named G_ … sets the ground
  height (pavement 0, road −0.125).
- Blender's procedural brick / slate / paving / grass materials export as plain grey; `MAT_COLOURS` in
  `index.html` gives them their colours back by material name.
- Collision: the footprint is three 0.242 m circles along his width axis (offsets 0 and ±0.335 m), rotated with
  his facing, so head-on he is 1.15 m wide and sideways 0.48 m. Kerbs and stair treads (≤ 0.30 m) are steps, not walls.
- `?shadow=2048` in the URL lowers the shadow map on a slow machine (default 4096).
- S is walk-backwards in play mode, so orbit lives on O / 2 rather than S.
