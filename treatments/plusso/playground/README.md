# Plusso — three.js playground

A small test harness for the Plusso rig: walk, run and jump him around a pastel course.

## Run it

Open `index.html` directly in a browser — it works from `file://` because the model is
embedded as base64 in `assets/plusso-glb.js`. Three.js itself loads from a CDN, so you
need to be online the first time.

If you would rather serve it:

    python3 -m http.server 8000     # then open http://localhost:8000

## Controls

- `W A S D` or the arrow keys — walk, relative to the camera
- `Shift` — run
- `Space` — jump
- drag — orbit the camera, wheel — zoom
- the buttons top-right set his mouth live (they drive the same morph targets the rig uses)

## What is in here

    index.html              the whole scene: world, character controller, camera
    assets/plusso.glb       the rigged model with four clips: Idle, Walk, Run, Jump
    assets/plusso-glb.js    the same file as base64, so file:// works

## Notes

- He is 1.46 m tall, which is his real hero height. The blocks are 0.4, 0.8 and 1.2 m —
  the low ones are a single hop, the tall ones want a run-up.
- Fur does not survive a glTF export (it is Blender hair), so the web model is the
  smooth body. Everything else — proportions, face, mouth shape keys — is the real rig.
- The mouth exports as four morph targets: `open`, `round`, `smile`, `frown`. They are
  the same controls the Blender rig drives, so anything you can pose there you can pose here.
