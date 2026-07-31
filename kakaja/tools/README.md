# Headless harnesses

These drove the tuning and the rules decisions. They run the real `index.html`
in headless Chromium and call the game's own functions, so they can't drift from
what ships.

    npm install                # playwright + pngjs
    node rules.mjs             # scorer unit tests + full-match simulation
    node test.mjs              # UI/interaction assertions, writes ../shots/*.png
    node tune.mjs 250 6        # 250 throws of 6 dice: settle, strays, fairness
    node faces.mjs             # all six values face-up, measures pip contrast
    node seats.mjs             # is the win condition fair by turn order?
    node balance.mjs           # solves the game for single-1 = 10 / 50 / 100
    node diagnose.mjs          # UI footprint + whether dice can land under the HUD

`balance.mjs` needs no browser — it is a standalone re-implementation used to
cross-check the in-game solver (both give E[turn] = 513).

`tune.mjs` takes an optional 3rd argument: a JSON patch applied to `CFG` before
the run, for sweeping values without editing the game.

    node tune.mjs 250 6 '{"throw":{"speed":26},"physics":{"gravity":-400}}'

Note: these expect a Chromium binary. If Playwright's bundled one isn't where the
scripts point, drop the `executablePath` line and run `npx playwright install`.
