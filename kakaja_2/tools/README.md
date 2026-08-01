# Headless harnesses

These drove the tuning and the rules decisions. None of them contains a second
copy of the game's logic: the browser ones drive the real `index.html`, and the
pure-Node ones import the shipped modules from `../src/`.

    npm install                # playwright + pngjs

## No browser needed — imports ../src directly

    node simtest.mjs 500       # determinism, and that server-chosen values are shown
    node tune.mjs 600 6        # 600 throws of 6 dice: settle, strays, mixing, penetration
    node tremble.mjs 500 6     # settling tail, and why dice end up cocked
    node balance.mjs           # solves the game for single-1 = 10 / 50 / 100

`tune.mjs` and `tremble.mjs` take an optional 3rd argument: a JSON patch applied
to the table constants before the run, for sweeping values without editing
anything.

    node tune.mjs 250 6 '{"throw":{"speed":26},"physics":{"gravity":-400}}'

`balance.mjs` is a standalone re-implementation used to cross-check the in-game
solver (both give E[turn] = 513).

## Drive the real page in headless Chromium

    node truth.mjs 120         # START HERE. Plays real turns and checks that the
                               # number the game counts is the number showing on
                               # the die. This is the one that would have caught
                               # the 005 regressions.
    node sound.mjs             # are the dice actually making a noise?
    node lagcheck.mjs 150      # steps-to-settle by hand size; catches throws
                               # that run to the 10s failsafe
    node frames.mjs            # frame times under CPU throttling (see caveat)
    node rules.mjs             # scorer unit tests + full-match simulation
    node test.mjs              # UI/interaction assertions, writes shots/*.png
    node quality.mjs           # quality tiers and the adaptive step-down
    node perf.mjs              # cold start and frame cost, per tier
    node faces.mjs             # all six values face-up, measures pip contrast
    node seats.mjs             # is the win condition fair by turn order?
    node diagnose.mjs          # UI footprint + whether dice can land under the HUD
    node tiershots.mjs         # screenshots of the table at high vs low

Set `KROOT` to point them at a different copy of the game — useful for
measuring a change against the previous build rather than arguing about it.

`frames.mjs` caveat: this container renders in software at 1-2fps, so it cannot
measure frame rate. It is kept because it still shows whether the quality
watchdog reacts, and because it runs correctly on a real machine.

Note: these expect a Chromium binary. If Playwright's bundled one isn't where the
scripts point, drop the `executablePath` line and run `npx playwright install`.
