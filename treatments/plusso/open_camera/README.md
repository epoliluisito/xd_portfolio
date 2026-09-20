# The Mask — shot studio

An open camera system for shot 1. The room, the furniture, Plusso, the mask and
the remote are all real objects at real sizes, the acting is fixed, and you move
everything else: his mark, the furniture, the camera, the lens, the light.

## Run it

Open `index.html`. It works from a double-click — Plusso is embedded as base64 —
but three.js comes from a CDN, so you need to be online the first time.

## The three things it is for

1. **Set the shot.** Camera menu: lens, where the push starts and ends, height,
   tilt, dutch. The frame guide is 16:9 with the 9:16 social column dashed on it.
2. **Fix the room.** Click anything, drag it on the floor, nudge it with the
   arrows, rotate with `[` `]`. Everything that should be solid is solid —
   Plusso cannot walk through the sofa, the armchair, the bookcases or the walls.
3. **Send it back.** `Export layout` writes `mask_layout.json`. Hand me that file
   and I put those exact numbers into Blender and render.

## Coordinates

Blender's, unchanged: x across the room 0…5.60, y away from camera 1 0…10.00,
z up, origin at the front-left inside corner on the floor. Every number you see
in the panels is a number you can type into Blender.

## The one rule the page enforces

The whole seating zone lives at y &lt; 3.30, behind camera 1. Push something past
that line, or pull the camera's start position back past it, and a red warning
appears — that is the guarantee that shot 1 cannot see the sofa.

## What the browser cannot do

- **Fur.** It is Blender particle hair and does not travel through glTF, so the
  web Plusso is the smooth body. Silhouette, height and proportion are exact;
  texture is not. `Show the fur shell` turns on the low-poly stand-in.
- **The volumetric shaft** is a cheap additive wedge, not EEVEE's volume.
- Soft shadows and bounce are approximations. Use it to decide, not to judge the
  final look.

## Keys

`1` `2` `3` shot / free / plan · `Tab` cycles · `Space` play · `,` `.` step one
frame · click to select · drag to move · arrows nudge (`Shift` ×5) · `[` `]`
rotate · `PgUp`/`PgDn` height · `0` selects Plusso · `Esc` deselects ·
`L` work light · `G` frame guide · `C` collider boxes · `P` picture · `X` export
