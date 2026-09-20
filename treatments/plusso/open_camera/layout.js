/* ===========================================================================
   THE MASK — layout data.  ALL COORDINATES ARE BLENDER COORDINATES, in metres:
   x = room width (0 .. 5.60), y = depth away from camera 1 (0 .. 10.00), z = up.
   Origin is the front-left inside corner of the room, on the floor.
   This file is what the studio page edits and what it exports, so the numbers
   here go straight back into Blender.
   =========================================================================== */
window.MASK_LAYOUT = {
  meta: { name: "The Mask — shot 1", version: "V02", fps: 24, frames: 192 },

  /* A knocked-through double reception in a Victorian terrace — which is the
     only kind of room that is honestly 10 m deep.  That means a PERIOD ceiling:
     3.05, not the 2.60 it was.  At 2.60 the room read like a warehouse, the
     window head sat 15 cm under the ceiling, and the picture rail ran straight
     through the window, which cannot happen in a real house. */
  room: {
    w: 5.60, d: 10.00, h: 3.05,
    // A terrace has two thicknesses: 9 inch solid brick outside and at the party
    // wall, a stud partition to the hall.  At 0.10 everywhere the openings had
    // no reveal, which is the single biggest tell that a room is cardboard.
    wall: 0.10, wallExt: 0.23,
    /* French doors to the garden, not a sash.  The back reception of a terrace
       opens to the garden through a glazed pair, and that is the honest way to
       have glass at floor level — which is what lays the moon along the boards
       and puts the glow behind his whole figure, remote included.  A sash would
       start at waist height and cut him in half. */
    window: { x0: 1.70, x1: 3.90, sill: 0.04, head: 2.30, side: 0.26, meet: 0.06 },
    // the curtains are heavy panels bunched either side; `open` is the clear gap
    curtain: { open0: 1.90, open1: 3.70, bunch: 0.60, top: 2.40, pole: 2.46 },
    door: { y0: 2.90, y1: 3.72, h: 2.05, swing: 28 },   // left wall, x 0
    skirt: 0.20, rail: 2.68,        // deep Victorian skirting; rail ABOVE every head
    pendant: { x: 2.80, y: 5.00 },
  },

  /* Plusso's mark. yaw is Blender world rotation Z in degrees, with 0 = facing
     +y (away from camera 1).  He turns clockwise seen from above: 0 -> -180. */
  plusso: { x: 2.80, y: 8.00, yaw: 0 },

  /* Camera 1 is a MOVE, not a position.  Every parameter has a start and an end
     and they all run on the same eased ramp from pushStart to pushEnd, so the
     shot can push in while it rises, levels its tilt, straightens the dutch or
     ramps the lens.  Set start = end and that parameter simply holds. */
  cam1: {
    x0: 2.80, x1: 2.80,
    y0: 3.30, y1: 5.30,
    z0: 0.45, z1: 0.45,
    lens0: 18, lens1: 18,
    tilt0: 7,  tilt1: 7,
    pan0: 0,   pan1: 0,          // swing about the room's vertical — the phone drives this
    dutch0: 4, dutch1: 4,
    pushStart: 1, pushEnd: 150,
  },

  cam2: { x: 0.85, y: 4.25, z: 0.95, lookX: 2.55, lookY: 1.75, lookZ: 0.95, lens: 35 },

  light: {
    moonElev: 21.8, moonAz: 0,          // azimuth 0 = straight through the window
    moon: 2.0, fill: 70, world: 0.015,
    maskRed: 2.6, volumetric: 0.35,
  },

  /* Every object is a box-ish thing with a real footprint and a real height.
     zone "far"  = y > 4.30, what shot 1 sees
     zone "near" = y < 3.30, behind camera 1 — the whole seating zone
     collide: true means Plusso cannot walk through it.                        */
  objects: [
    // ---- far zone -------------------------------------------------------
    { id: "bookcaseA",  label: "Bookcase A",     type: "bookcase",  x: 0.19, y: 9.40, yaw: 90,  w: 1.00, d: 0.34, h: 1.95, zone: "far", collide: true },
    { id: "armchair",   label: "Armchair",       type: "armchair",  x: 1.35, y: 8.80, yaw: -95, w: 0.85, d: 0.85, h: 0.85, zone: "far", collide: true },
    { id: "floorlamp",  label: "Floor lamp",     type: "floorlamp", x: 2.10, y: 9.35, yaw: 0,   w: 0.30, d: 0.30, h: 1.58, zone: "far", collide: true },
    { id: "rugA",       label: "Rug A",          type: "rug",       x: 2.80, y: 8.45, yaw: 0,   w: 3.20, d: 2.30, h: 0.012, zone: "far", collide: false },
    { id: "bookstack",  label: "Books on floor", type: "bookstack", x: 1.60, y: 7.30, yaw: -12, w: 0.30, d: 0.24, h: 0.14, zone: "far", collide: false },
    { id: "plant",      label: "Corner plant",   type: "plant",     x: 5.15, y: 9.60, yaw: 0,   w: 0.55, d: 0.55, h: 1.10, zone: "far", collide: true },
    { id: "radiator",   label: "Radiator",       type: "radiator",  x: 0.09, y: 7.35, yaw: 90,  w: 1.90, d: 0.08, h: 0.62, z: 0.12, zone: "far", collide: true },
    { id: "shoes",      label: "Kicked-off shoes", type: "shoes",   x: 0.68, y: 4.12, yaw: 20,  w: 0.45, d: 0.30, h: 0.09, zone: "far", collide: false },
    { id: "pictureA",   label: "Picture (large)", type: "picture",  x: 5.57, y: 7.75, yaw: 0,   w: 0.42, d: 0.03, h: 0.52, z: 1.35, zone: "far", collide: false },
    { id: "pictureB",   label: "Picture (small)", type: "picture",  x: 5.57, y: 7.28, yaw: 0,   w: 0.34, d: 0.03, h: 0.44, z: 1.44, zone: "far", collide: false },

    // ---- near zone — every one of these sits at y < 3.30 ------------------
    { id: "sofa",       label: "Sofa",           type: "sofa",      x: 2.85, y: 1.70, yaw: 0,   w: 2.00, d: 0.90, h: 0.85, zone: "near", collide: true },
    { id: "tv",         label: "TV (55\")",      type: "tv",        x: 0.09, y: 1.61, yaw: 0,   w: 1.22, d: 0.06, h: 0.69, z: 0.705, zone: "near", collide: false },
    { id: "mediaunit",  label: "Media unit",     type: "cabinet",   x: 0.26, y: 1.625, yaw: 180, w: 1.55, d: 0.40, h: 0.45, zone: "near", collide: true },
    // a long low table, parallel to the sofa, sitting between the sofa and the telly
    { id: "coffeetable",label: "Coffee table",   type: "coffee",    x: 1.68, y: 1.70, yaw: 0,   w: 0.55, d: 1.30, h: 0.42, zone: "near", collide: true },
    { id: "routertable",label: "Router table",   type: "sidetable", x: 2.65, y: 3.02, yaw: 0,   w: 0.60, d: 0.45, h: 0.55, zone: "near", collide: true },
    { id: "shelves",    label: "Shelves + candles", type: "shelves",x: 2.90, y: 0.13, yaw: 180, w: 2.20, d: 0.22, h: 1.75, zone: "near", collide: false },
    { id: "bookcaseB",  label: "Bookcase B",     type: "bookcase",  x: 1.00, y: 0.26, yaw: 180, w: 1.20, d: 0.32, h: 1.95, zone: "near", collide: true },
    { id: "trolley",    label: "Hostess trolley",type: "trolley",   x: 3.83, y: 0.83, yaw: 0,   w: 0.45, d: 0.45, h: 0.70, zone: "near", collide: true },
    { id: "rugB",       label: "Rug B",          type: "rug",       x: 2.25, y: 1.75, yaw: 0,   w: 2.70, d: 2.30, h: 0.012, zone: "near", collide: false },
  ],

  /* The performance. Frame numbers, 24 fps. The acting never changes — it is
     played relative to Plusso's mark, so moving the mark moves the whole thing. */
  beats: [
    { f: 1,   to: 46,  name: "Stand",          note: "back to camera, remote hanging in his right mitt" },
    { f: 47,  to: 104, name: "The turn",       note: "four steps, 180 -> 0, clockwise from above" },
    { f: 105, to: 124, name: "The look",       note: "settled, facing camera, nothing moves" },
    { f: 125, to: 138, name: "Mitt rises",     note: "his LEFT mitt goes to the mask" },
    { f: 139, to: 140, name: "Contact",        note: "press on the temple" },
    { f: 141, to: 143, name: "THE SWITCH",     note: "15% / 60% / full" },
    { f: 144, to: 172, name: "Hold",           note: "red on his fur and on the curtains" },
    { f: 173, to: 180, name: "Mitt lowers",    note: "" },
    { f: 181, to: 188, name: "Quarter turn",   note: "0 -> -90, now in profile" },
    { f: 189, to: 192, name: "Walks off left", note: "the edit cuts here" },
  ],
};
