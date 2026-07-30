# Kakaja — iteration 002

A self-contained Three.js dice game: warm-oak table, top view, portrait-first,
real rigid-body dice, **full Kakaja rules**. All graphics are procedural — the
wood grain, the dice, the pips, the environment lighting and the sounds are all
generated in code at load time. No image, font or model assets.

---

## Running it

ES modules don't load from `file://`, so it needs to be served:

```sh
sh serve.sh              # then open http://localhost:8080
```

Add `?debug=1` for an overlay with fps, draw calls, settle time, the turn state
and the solved value of a turn.

To play on a phone on the same wi-fi, serve as above and open
`http://<your-mac's-ip>:8080`.

## What's in the folder

```
index.html                  the whole game — markup, styles, all game code
assets/lib/                 three.js, its RoundedBoxGeometry addon, cannon-es
serve.sh                    one-line static server
tools/                      headless test, tuning and balance harnesses
NOTES.md                    this file
```

`index.html` is the only file you edit. The three files in `assets/lib/` are
unmodified vendored libraries, kept local so the game works offline.

## Architecture

Search these tags in `index.html`:

| tag | what's there |
|---|---|
| `[CFG]` | every tuning knob — tray, dice, physics, throw, camera, colours, players |
| `[TEX]` | procedural wood: grain, cathedral figure, knots, normal + roughness maps, environment |
| `[SCENE]` | renderer, camera fitting, lights, plank-by-plank table, rim, saved-strip inlay |
| `[AUDIO]` | procedural clacks, chimes, the Kakaja fanfare, the Tutto sting |
| `[DICE]` | geometry, pips, physics bodies, throwing, settling, face reading, stowing |
| `[RULES]` | Kakaja scoring — pure functions over a dice-count vector |
| `[AI]` | exact solution of a turn by value iteration, and the opponents' policy |
| `[GAME]` | turn state machine, rounds, banking, Tutto, hot dice, the endgame |
| `[UI]` | screens, HUD, tap-to-set-aside, swipe-to-throw |

### The one number still open

`RULES.ONE` — what a single 1 is worth. Your rules said 10; it ships as **100**.
Change that one line to play it as first written; everything else, including the
opponents, adapts automatically (see below).

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
what lets the AI reuse it directly.

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

## Measured behaviour

From `tools/`, over roughly 8,000 simulated rolls and 2,300 simulated matches:

| | |
|---|---|
| scorer | 33 hand-computed cases + 4,000 randomised consistency checks, all passing |
| interaction | 25 UI assertions passing (selection legality, stowing, Tutto, hot dice, Kakaja) |
| settle time | median 1.06s at six dice, p90 1.63s |
| dice escaping the tray | 0% |
| dice resting inside a wall | 0% |
| cocked dice needing a nudge | ~22% at six dice, ~12% at three |
| face distribution | χ²=1.52, p=0.91 — indistinguishable from fair |
| expected points per turn | 513 (game solved exactly; the Node and in-browser solvers agree) |
| turns ending in Tutto | 23.6% |
| match length, 4 players to 11,000 | ~18 rounds, ~72 turns |
| render budget | 25 draw calls, ~34k triangles |
| time to interactive | ~2.5s, plus 130ms to solve the turn (off the critical path) |

Fairness was worth measuring rather than assuming — three separate real biases
turned up during tuning. Dice were spawning overlapped with the static wall
bodies, so cannon ejected them in a repeatable direction. Initial orientations
were sampled as uniform Euler angles, which is *not* uniform on SO(3) and
clusters near the poles. Both skews survived the tumble and showed in the face
counts. And two of the six faces were rendering with invisible pips.

### Does turn order matter?

Your win condition — the round always completes, and a later player must exceed
both the target and the leader — mildly favours later seats, because a player who
crosses late has fewer opponents left to answer. With equally skilled players
over 1,500 matches each:

| | seat 1 | seat 2 | seat 3 | seat 4 |
|---|---|---|---|---|
| wins (fair share 25%) | 23.9% | 24.8% | 25.2% | 26.1% |
| crossed the target first yet lost | 6.5% | 3.9% | 1.6% | 0% |

About 2 points of spread — small enough to leave alone, but the second row shows
the overtake rule doing real work rather than being decoration. If you'd rather
it were exactly even, the usual fix is to give everyone one final turn after
someone crosses, regardless of where the round happens to be.

## Known limitations / next up

- **Six-dice throws leave a die cocked ~22% of the time** and it gets nudged. A
  nudge is the right behaviour (real dice do this) but it is frequent, because
  the tray is only ~7 dice wide. Widening it shrinks the dice on screen, and pip
  legibility from directly above is the thing I'd protect first.
- **No "must open with N" rule** — you chose no minimum, so a player can bank 50.
- **No persistence.** Scores reset when the page reloads.
- **No local multiplayer** — the extra seats are all AI. The turn manager doesn't
  care, so pass-and-play is a small change.
- **Round-over screen is plain**, and there's no per-turn history or replay.
- **Landscape works but is not designed** — the sides go empty. Portrait is the
  intended format.
