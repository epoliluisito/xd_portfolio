# Kakaja — iteration 007

A self-contained Three.js dice game: warm-oak table, top view, portrait-first,
real rigid-body dice, **full Kakaja rules**. All graphics are procedural — the
wood grain, the dice, the pips, the environment lighting and the sounds are all
generated in code at load time. No image, font or model assets.

## What changed in 007

**The black disc on the board at start-up.** Two bugs, one visible symptom.

Dice waiting to be thrown are parked below the table at y=-60, where the table
hides them. The low tier's fake contact shadow, though, is drawn *on* the table
— so six parked dice each painted a near-opaque blob at the origin, stacked.
The real shadow map never had this problem, because nothing below the floor can
be lit from above; the stand-in had no such rule until now. A die only casts a
contact shadow if it is actually above the table.

Underneath that: **starting a game did not cancel the title screen's idle
throw.** Those three dice kept tumbling into the new game, and because the game
had already parked them below the floor, the simulation's stray-rescue kept
hauling them back onto the table. `clearTable()` now cancels any throw in
flight.

A resting die's blob was also nearly opaque (0.95). Fine while hidden under a
die, far too heavy anywhere it isn't — now 0.78, falling off with height.

`tools/quality.mjs` grew a check that walks the title screen, a started game, a
throw in flight and a settled throw, and fails if any shadow belongs to a die
that is not on the table.

## What changed in 006 — the 005 regressions

Iteration 005 shipped broken. Everything below was caused by the refactor in
005, and the honest lesson is at the bottom.

### The bug behind almost all of it

`beginThrow` threw *the first n bodies*. That is correct only for the first
throw of a turn. After a set-aside the dice still in hand are an arbitrary
subset — dice 1, 3, 4 and 5, say — so throwing bodies 0 to 3 meant:

- two dice sitting safely in the saved row were teleported into the air and
  frozen there, because a set-aside die is a static body,
- two dice that were still in play were parked under the floor, out of sight,
- and the value each die was *printed* with no longer matched the face it
  landed on, because the printing was chosen from a preview of a different die.

That last one is what produced "it says I have two 2s and there's only one":
the game was counting dice the player could not see, with values that were
never on the table. Measured before the fix, over 804 dice: **32% read wrong,
113 dice fell out of the world, 144 set-aside dice were disturbed.** After:
zero on all three, over 1,231 dice.

### The score can no longer disagree with the pips

Beyond fixing the cause, the game now **reads the value off the die at settle**
rather than trusting what it planned to print. If the preview and the visible
throw ever diverge again for any reason, the player still sees a coherent game —
the score always matches what is showing — and the divergence becomes a
separate, visible bug rather than a scoring one. In `?debug=1` it logs.

### Sound

The dice clacks came from cannon `collide` listeners on the dice bodies. When
body creation moved into `src/sim.mjs` in 005, nothing re-attached them, and the
game shipped silent. The listeners now live in the `Die` class — sound is a
client concern and `src/` has to stay runnable on a server.

Also fixed while in there: on iOS the audio context is handed back *suspended*
when created outside a user gesture, and 005 only ever called `init()` once. It
now resumes on every init, and unlocks on the first touch anywhere rather than
on the first roll — by the time the dice are in the air it is too late for that
roll's sounds.

### Lag

I could not reproduce a frame-rate problem in the container — it renders in
software at 1–2fps, so it cannot measure this at all, and I stopped pretending
otherwise. What I did find and fix:

- **The visible symptom.** Dice frozen in mid-air that never come down, and
  dice missing from the table, are what the bug above produced. That reads as
  "stuck" long before it reads as "wrong".
- **The watchdog was measuring the wrong number.** It sampled the *clamped*
  frame delta, so every frame slower than 20fps looked identical to exactly
  20fps and it could not see how bad things were. It now judges the raw frame
  time.
- **The watchdog was far too slow.** It needed 90 frames of tumbling dice before
  reacting — but a throw only lasts about a second, so that was four or five
  separate bad rolls. Now 36 frames, which fills inside a single bad roll.
- **Phones no longer boot into `high`.** `high` means DPR 2 and a 1024 shadow
  map, and a phone reporting eight cores may still be a mid-range Android
  throttling in a warm hand. On a phone screen `mid` is very hard to tell apart
  — the dice are ~45px either way — and costs about 40% less. `high` is now
  desktop-only.

### The real lesson

Every suite passed on the broken build. `simtest.mjs` proved the physics module
could do the trick *in isolation*; `test.mjs` staged dice by hand and never
threw one. Neither one ever played a turn and then asked the only question a
player cares about:

> is the number the game is counting the number that is actually showing?

`tools/truth.mjs` now asks exactly that, over a thousand dice per run, through
the real game — real throws, real set-asides, real physics — along with: did any
die leave the table, did a set-aside die move, did the preview predict the
landing, and is every dead die dimmed. It would have caught this in seconds.

The gap was not a missing test case. It was a missing *seam*: two things were
each tested alone and the handoff between them was tested by nobody.

## What changed in 005

This iteration is groundwork for putting the game online, plus a performance
pass. Nothing about how it plays has changed.

- **The game is split into a client and a set of shared modules.** Everything a
  server would also have to run — the rules, the opponents, the RNG, the dice
  physics — now lives in `src/*.mjs` and is imported by `index.html`. There is
  one copy of each, so the referee a server runs and the referee your phone runs
  cannot drift apart. `src/` has no reference to three.js, the DOM or a camera,
  and `node tools/simtest.mjs` exercises the whole physics module in plain Node
  with no browser at all.

- **A throw is now reproducible from a seed, and can be made to show values
  chosen by someone else — without faking the physics.** This is the part that
  makes online play possible, and it is worth understanding:

  A die's identity is *only the printing on it*. A blank cube is symmetric under
  exactly 24 rotations, so rotating the pip pattern inside the cube gives another
  perfectly valid, visually identical die. So: simulate the tumble honestly,
  watch which face lands up, and only then decide which value is printed on it.
  The dice you watch are really rolling — nothing is scripted, nothing is
  snapped at the end — and they land showing exactly what the server said.

  The obvious alternative was to search random seeds until a throw happens to
  produce the required values. That was measured before it was built, and
  rejected: **462 attempts on average** for six dice at ~6ms each is a 2.8s
  stall, and the worst case is 46,656 attempts — about five minutes.

  Verified over 500 throws: 500/500 displayed exactly the requested dice, and 60
  of 60 replays from the same seed were identical. Cost is **6.9ms median,
  13.5ms p90** per throw, paid once before the dice are released.

- **Quality tiers, with adaptive fallback.** The two things that actually cost
  money are pixel count and the shadow pass, so those are what the tiers move.
  The tier is guessed at boot from cheap signals (software renderer, max texture
  size, cores, device memory) and then *corrected from measured frame time* once
  the dice are actually tumbling. Guessing alone is unreliable — `deviceMemory`
  doesn't exist on iOS and GPU strings are generic. Measuring alone means the
  first seconds look bad on a weak phone. Doing both means the worst case is a
  couple of seconds of stutter before it settles.

  | tier | DPR cap | shadow map | plank texture | boot | frame cost |
  |---|---|---|---|---|---|
  | high | 2.0 | 1024 | 320px | 3.8s | 4.45× |
  | mid | 1.5 | 512 | 240px | 2.4s | 2.65× |
  | low | 1.0 | off + fake contact shadows | 160px | 1.4s | 1.00× |

  (Boot and frame cost are from software rendering in a container, so read the
  *ratios*, not the absolutes.) The step-down is deliberately one-way: quality
  that oscillates is far more noticeable than quality that is merely lower.
  `?q=low|mid|high` pins a tier for testing and disables the adaptive path.

- **Fake contact shadows for the low tier.** Dropping the shadow map made the
  dice read as stickers — in a top view the shadow *is* the depth cue. Each die
  now gets one soft blob projected from the lamp position exactly as the real
  shadow map would project it. Guessing a fixed offset instead puts the blob on
  the wrong side for half the tray, which is worse than no shadow at all: it
  reads as a second, floating die.

- **The physics harnesses no longer need a browser.** `tune.mjs` and
  `tremble.mjs` import `src/sim.mjs` directly, which is both more honest (it is
  the shipped module) and about 200× faster — 600 six-dice throws now take 8
  seconds instead of several minutes.

- **A favicon**, inline as a data URI. Browsers request `/favicon.ico` whether
  you declare one or not; without it every single load took a guaranteed 404.

### On fairness, now that the server picks the values

The face a die shows is chosen by the server's RNG, so any residual bias in the
tumble can no longer reach the result *at all*. The chi-square in `tune.mjs` is
therefore no longer a fairness test — it now only checks that the tumble stays
well mixed, which still matters, because a lopsided tumble would let the
printing choice correlate with where a die ends up on the table.

## What changed in 004

- **Dice no longer tremble into place.** 85% of "cocked" dice were leaning
  against a tray wall, held there by friction. The walls now have their own
  near-frictionless material, so a leaning die slides back flat on its own:
  cocked dice went from **25.5% of six-dice throws to 10–15%**, and from 6.4% to
  0.6% on a single die. When one is still cocked it now gets thrown clear into
  open table with a fresh orientation instead of being jiggled in place — one
  decisive toss rather than the two-or-three small hops that read as trembling.
  The settling tail is 0.09s at p90.
- **Colour now has a job.** Amber is the risky push, jade is banking safely,
  vermilion is Tutto, gold is Kakaja — and the player in play wears their own
  colour on their chip, the turn line and the rings under selected dice. Each
  chip carries a hairline of that colour filling toward the target.
- Flaring the walls like a real dice tray was tried and **made it worse** (25% →
  39%): a sloped wall gives a die a stable tilted surface to sit on.

## What changed in 003

- **The table is fitted between the HUD bands, not to the screen.** The camera
  measures the actual height of the score chips and the controls and frames the
  tray into what's left, so four players shrink the table automatically and the
  controls are never jammed against the screen edge.
- **Dice can no longer come to rest under any UI.** Measured across five
  viewports and 1,800 settled dice: 0% land where the HUD would swallow the tap,
  with 80–180px of clearance to the bottom band.
- **Result messages hold longer** (2.1–2.5s, up from 1.5–1.75s) and a tap
  anywhere skips the wait, so reading them never costs pace.
- **Fewer dice left leaning on each other** — they now bounce off one another
  instead of nestling, cutting cocked dice at six dice from 25.5% to 22.7%.
- **Brighter, warmer, more saturated**, and a genuine bug fixed with it: the fog
  was authored at fixed distances for the old framing, so pulling the camera back
  buried the whole table in haze. Pip contrast went from 103 to 167.
- **A more playful UI** — chunky buttons that press in, a tilted ribbon that
  springs in for Kakaja / Tutto / banked totals, score chips that pop when a
  number changes, and a compact layout for short screens.

---

## Running it

ES modules don't load from `file://`, so it needs to be served:

```sh
sh serve.sh              # then open http://localhost:8080
```

Add `?debug=1` for an overlay with fps, draw calls, settle time, the turn state
and the solved value of a turn. Add `?q=low`, `?q=mid` or `?q=high` to pin a
quality tier.

To play on a phone on the same wi-fi, serve as above and open
`http://<your-mac's-ip>:8080`.

## What's in the folder

```
index.html                  the client — markup, styles, rendering, UI, turn flow
src/table.mjs               physical constants of the table
src/rules.mjs               Kakaja scoring, pure functions over counts[value]
src/ai.mjs                  the opponents, solved from RULES at runtime
src/rng.mjs                 seeded PRNG, uniform random rotations
src/sim.mjs                 dice physics — deterministic, no three.js, no DOM
assets/lib/                 three.js, its RoundedBoxGeometry addon, cannon-es
serve.sh                    one-line static server
tools/                      headless test, tuning and balance harnesses
NOTES.md                    this file
```

`src/` is the half a server would also run. It imports nothing but `cannon-es`
and itself — no three.js, no DOM, no camera — so the same files can be dropped
into a Node service unchanged. `index.html` is everything else: what it looks
like, what it sounds like, and whose turn it is.

The three files in `assets/lib/` are unmodified vendored libraries, kept local so
the game works offline.

## Architecture

Search these tags in `index.html`:

| tag | what's there |
|---|---|
| `[CFG]` | every tuning knob — merges `src/table.mjs`, adds camera, colours, players |
| `[TEX]` | procedural wood: grain, cathedral figure, knots, normal + roughness maps, environment |
| `[QUALITY]` | the low/mid/high tiers and how one is picked |
| `[SCENE]` | renderer, camera fitting, lights, plank-by-plank table, rim, saved-strip inlay |
| `[AUDIO]` | procedural clacks, chimes, the Kakaja fanfare, the Tutto sting |
| `[DICE]` | meshes, pips, printing a value onto a landed face, stowing |
| `[GAME]` | turn state machine, rounds, banking, Tutto, hot dice, the endgame |
| `[UI]` | screens, HUD, tap-to-set-aside, swipe-to-throw |

### How a throw works now

```
Game.roll()
  → localValues()          decide the dice (later: the server decides)
  → throwValues()
      previewThrow(preview, {seed, n, power, skew})     ~7ms, nothing drawn
        → which face will each die land on?
      labelFor(landedAxis, wantedValue, rng)            what to print on it
      beginThrow(sim, {seed, ...})                      the SAME seed
  → render loop calls stepThrow(sim, activeThrow) once per fixed step
  → 'settled' → Game.onThrowSettled()
```

The preview and the visible throw are the same world configuration stepped with
the same call sequence from the same seed, so the visible throw lands exactly
where the preview said it would. `tools/simtest.mjs` asserts both halves of that.

To go online, `localValues()` is the only thing that has to change: the values
come from the server instead, and everything downstream is already in place.

### The one number still open

`RULES.ONE` — what a single 1 is worth. Your rules said 10; it ships as **100**.
Change that one line in `src/rules.mjs` to play it as first written; everything
else, including the opponents, adapts automatically (see below).

The reasoning, from solving the game exactly:

| single 1 | points/turn, optimal play | turns ending Tutto | turns to 11,000 |
|---|---|---|---|
| 10 | 427 | **32.4%** | 26 |
| 50 | 453 | 20.4% | 24 |
| **100** | 512 | 20.9% | 22 |

100 is only ~20% faster, because singles are a small slice of scoring next to
triples and multipliers — so it doesn't unbalance the table the way it looks
like it might. The deciding column is Tutto: at 10 a single 1 is worth so little
that correct play almost never banks on it and keeps pushing, so **a third of
all turns end in nothing**. It also keeps every score a multiple of 50, which
reads better against an 11,000 target than totals like 3,470.

### How the rules are structured

`RULES` is pure functions over `counts[v] = how many dice show v`. Nothing in it
touches the scene, the DOM or the turn state, which is what makes it testable and
what lets both the AI and a future server reuse it directly.

- `solve(counts)` — best score using **every** die, with the partition, or `null`
  if some die can't be placed. That `null` is what makes a selection illegal:
  you may not set aside a lone 3.
- `keepOptions(counts)` — best score per subset size. Keeping *fewer* dice for
  *fewer* points is often correct because it leaves more to re-roll, so every
  size is kept, not just the highest-scoring one.
- `anyScore` / `liveValues` — Tutto detection, and which dice to dim.
- `describe(counts)` — "four 1s ×2 + 2× 5", used in the opponents' commentary.

### The opponents

There is no hand-tuned heuristic. A turn is a Markov decision process (roll *n*
dice → pick a legal keep → bank or roll on) and with at most six dice it is small
enough to **solve exactly by value iteration**, which the game does at runtime in
about 130ms. `AI.f[n][s]` is the expected banked points from being about to roll
*n* dice with *s* accumulated but not yet safe.

Because it is solved at runtime from `RULES`, changing the scoring — including
`ONE` — re-derives correct opponents with no further work.

The solved policy captures things worth knowing: it will keep rolling a **single**
die on up to 260 accumulated but only up to 220 on two dice, because scoring your
last die returns the whole set. I would have got that backwards by hand.

Each opponent has a `bold` multiplier on the roll/bank threshold — Bram 0.90
(cautious), Odile 1.00 (exactly optimal), Kes 1.14 (pushes) — enough to read as
temperament without playing badly. In the endgame they also know they have to
*exceed* the leader, and keep throwing while short of it.

### Interaction

Tap a die to set it aside; it lifts, shrinks and slides into the saved row behind
the inlaid divider at the near edge, landing with its scoring face up so the row
is readable. Tap again to release. Dice that can't be part of any legal keep are
dimmed, and tapping them does nothing. The running tally shows what's safe if you
bank and what the current selection would add; an illegal selection says "not a
score" and disables both buttons.

Swipe up to throw. In mid-turn a swipe means "keep this selection and throw on"
in one gesture, and the flick's power carries into the throw.

## Tuning notes

Numbers here that are easy to break by accident:

**Scale and gravity go together.** The world is ~3cm per unit, so a die is a
chunky 5cm and gravity works out near `-330`. Real 16mm dice would want `-900`,
which is more "correct" and looks worse — the throw becomes a slam you can't
follow on a phone. Throw impulses are expressed as *heights* (`throw.apex`,
`nudge.hop`) and converted via `vForApex()`, so gravity stays a free knob.

**Broadphase is `NaiveBroadphase` on purpose.** With ~11 bodies sweep-and-prune
buys nothing, and it was intermittently missing die↔wall pairs — dice escaped the
tray on a few percent of rolls and came to rest sunk into the rim.

**The cube rotation group must contain exactly 24 elements.** `src/sim.mjs`
throws if it doesn't. Sign-normalising quaternions naively lets four duplicates
through, and a duplicated orientation would make the printing choice non-uniform
— which is the one place a bias could still reach the player.

**Face frames derive their second axis** as `t = u × n`. Writing all three by
hand gives left-handed frames on two of the six faces, which mirrors the pip
geometry so `computeVertexNormals()` points inward — those pips render inside-out
and effectively vanish. There's a console warning guarding it.

**Pips are squashed to 26% and matte.** A rounder, glossier pip acts as a convex
mirror, catches the overhead lamp and reads as a pale ring instead of a dark dot.
Fatal in a top-view game.

**Mesh colours stay near white.** The wood colour lives in the generated texture;
tinting an already-brown material with a brown map multiplies the two and the oak
turns to dark mahogany.

**Dice spawn on a grid, at most 3 across.** An earlier version fanned all six
across a fixed span, making the lanes narrower than the dice — a third of throws
landed one die on top of another.

**Dead dice are dimmed hard** (`0x7d7466`, env 0.25). Under the lamp a subtle
change is invisible, and live-vs-dead is the whole hint.

**The saved strip is walled off in physics.** A thrown die can never barge into
dice you've already set aside.

**Fog distances are derived from the camera distance**, not fixed. They were
authored for a framing where the camera sat ~36 units out; once the tray was
fitted between the HUD bands the camera pulled back to ~52 and the fixed fog
quietly buried the table in haze. It cost about 40% of the brightness, and no
amount of extra lamp intensity could win it back — worth knowing before touching
the framing again.

**Wall friction, not wall shape, is what holds a cocked die.** The walls carry
their own near-frictionless material for exactly this reason. If you ever give
them the floor's friction back, expect the cocked rate to roughly double.

**Settled dice are never moved.** It is tempting to nudge overlapping dice apart
after they come to rest, and it is not safe: any push large enough to separate
them can tip one, which would silently change the result of the throw. Crowding
is dealt with at throw time instead — grid spawning, lateral spread, and dice
that bounce off each other rather than nestle.

**The quality step-down never promotes.** A device that recovers stays where it
landed. Quality that oscillates is far more noticeable than quality that is
merely lower, and a throw that changes resolution mid-tumble looks broken.

## Measured behaviour

From `tools/`, over roughly 10,000 simulated rolls and 2,300 simulated matches:

| | |
|---|---|
| scorer | 33 hand-computed cases + 4,000 randomised consistency checks, all passing |
| interaction | 25 UI assertions passing (selection legality, stowing, Tutto, hot dice, Kakaja) |
| end-to-end truth | 1,231 dice over 245 real throws: score matches the pips, nothing lost, nothing disturbed, dimming correct — all 0 failures |
| sound | 4 assertions: context running, ~85 clacks per six-dice throw at varying strength, event sounds fire |
| quality tiers | 19 assertions passing (settings reach the renderer, step-down fires, one-way, `?q=` pins) |
| throw determinism | 60/60 identical replays from the same seed |
| server-chosen values shown | 500/500 throws displayed exactly the requested dice |
| preview cost per throw | 6.9ms median, 13.5ms p90 |
| settle time | median 0.99s at six dice, p90 1.61s; settling tail 0.09s at p90 |
| dice escaping the tray | 0% |
| dice resting inside a wall | 0% |
| cocked dice needing a nudge | ~14% at six dice, ~3% at three, ~0.6% at one |
| tumble mixing | χ²=3.41, p=0.64 — well mixed (the *shown* value is the server's) |
| expected points per turn | 513 (game solved exactly; the Node and in-browser solvers agree) |
| turns ending in Tutto | 23.6% |
| match length, 4 players to 11,000 | ~18 rounds, ~72 turns |
| render budget | 31 draw calls, ~34k triangles |
| dice resting under the UI | 0 of 1,800, across five viewports |
| pip contrast, worst face | 75 / 255 on the two-pip face, 155–186 on the rest |
| physics throughput | 17.6µs per fixed step = 316× realtime |
| time to interactive | 1.4s (low) to 3.8s (high), plus 130ms to solve the turn off the critical path |

Fairness was worth measuring rather than assuming — four separate real biases
turned up during tuning. Dice were spawning overlapped with the static wall
bodies, so cannon ejected them in a repeatable direction. Initial orientations
were sampled as uniform Euler angles, which is *not* uniform on SO(3) and
clusters near the poles. Two of the six faces were rendering with invisible pips.
And the cube rotation group came out with 28 members instead of 24, which would
have skewed the printing choice.

### Does turn order matter?

Your win condition — the round always completes, and a later player must exceed
both the target and the leader — mildly favours later seats, because a player who
crosses late has fewer opponents left to answer. With equally skilled players
over 1,500 matches each:

| | seat 1 | seat 2 | seat 3 | seat 4 |
|---|---|---|---|---|
| wins (fair share 25%) | 22.7% | 24.7% | 27.8% | 24.8% |
| crossed the target first yet lost | 6.1% | 3.6% | 1.5% | 0% |

A few points of spread — small enough to leave alone, but the second row shows
the overtake rule doing real work rather than being decoration. If you'd rather
it were exactly even, the usual fix is to give everyone one final turn after
someone crosses, regardless of where the round happens to be.

## Known limitations / next up

- **Six-dice throws leave a die cocked ~14% of the time** and it gets nudged. A
  nudge is the right behaviour (real dice do this) but it is frequent, because
  the tray is only ~7 dice wide. Widening it shrinks the dice on screen, and pip
  legibility from directly above is the thing I'd protect first.
- **There is no server yet.** The client is ready for one — the values come from
  `localValues()`, which is the single call a network client replaces — but
  nothing is written: no lobby, no matchmaking, no reconnect, no accounts.
- **No "must open with N" rule** — you chose no minimum, so a player can bank 50.
- **No persistence.** Scores reset when the page reloads.
- **No local multiplayer** — the extra seats are all AI. The turn manager doesn't
  care, so pass-and-play is a small change.
- **Round-over screen is plain**, and there's no per-turn history or replay.
- **Landscape works but is not designed** — the sides go empty. Portrait is the
  intended format.
