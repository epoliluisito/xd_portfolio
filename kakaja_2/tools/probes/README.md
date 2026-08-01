# One-off probes

These are not test suites — they are single-purpose diagnostics written to
answer one question each while tuning. They print raw numbers rather than
pass/fail, and several exist only because a screenshot lied to me and I needed
to read the actual DOM or GPU state instead.

Kept because each one took a while to get right, and the same question tends to
come back.

    node diag.mjs          does the page boot? console + pageerror + boot overlay
    node diag-dist.mjs     the same, against the packaged copy
    node layers.mjs        which screen layer is really on (transitions can lie)
    node ledger.mjs        the computed style + stacking chain of one HUD element
    node probe.mjs         screen-space geometry: tray corners, rim, HUD bands
    node chips.mjs         renders the HUD with real scores at 3x for inspection
    node light.mjs         dumps every light in the scene with its settings
    node bisect.mjs        one die under lighting variants, pixels read back
    node lowdice.mjs       where 1-3 dice land — the throws you have to tap

Run them from this folder. They expect `npm install` to have been run in
`tools/`, and reach the game at `../../index.html`; set `KROOT` to point
elsewhere.

## Why several of these exist

The container renders in software at roughly 1fps. At that speed CSS
transitions and `backdrop-filter` panels do not repaint before a screenshot is
taken, so the picture shows an empty ledger pill or a half-faded title overlay
that the user would never see. `layers.mjs` and `ledger.mjs` read the DOM and
computed styles instead, which is the only reliable way to tell a real bug from
a rendering artefact of the test rig.
