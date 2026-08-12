# Shipyard — Handoff

Status snapshot for picking this project back up. Written after a long session of
bug-fixing, a full UI redesign for one ship, and a mobile-responsiveness pass.

## What this project is

A fleet of six first-principles programming curricula (docker, python, javascript,
htmlcss, sql, rest-api), each shipped as **one portable HTML file** — no build step
needed to read it, progress lives in `localStorage`, runs fully offline. A shared
JS/CSS engine renders parts, checkpoint quizzes, idea-card decks and milestones from
a per-ship data module. A hub page (`index.html`) links to all six, generated from
`registry.json`.

Live at **https://amanhasnonamee.github.io/shipyard/** (GitHub Pages, auto-deploys
from `main` on push — already configured, nothing to set up there).

## Current repo state

- **Pushed and live.** `origin/main` is up to date as of this doc — includes the
  fleet-wide v2 migration below. Working tree is clean.
- `git log --oneline -6`:
  ```
  f3ea3f3 Migrate docker, javascript, htmlcss, sql, rest-api to v2 chrome; rewrite all quiz distractors fleet-wide
  46bdd72 Add HANDOFF.md for Claude Code project handoff
  7b8ee23 Fix hub.mjs template drift: grid safety fix and absolute OG tags
  50ba49d Redesign Python as the v2 reference ship; harden mobile responsiveness fleet-wide
  b3f2d89 Fix engine bugs across the fleet, rebuild pipeline, add regression tests
  1abc202 rest-api ship: full pedagogy (...)   <- last commit before the prior session
  ```
- Full regression suite passes: **150/150** (`node build/test.mjs --dom`).
- Quiz-quality linter: **all six ships are clean, 0/319 flagged fleet-wide**
  (`node build/lint-quiz.mjs`). `QUIZ-REWRITES.md` is regenerated and currently
  empty — regenerate with `node build/lint-quiz.mjs --report` if it goes stale again.

## Architecture

### Two chrome versions, one engine contract

- **v1** (`assets/shipyard.js` + `assets/shipyard.css`) — the original chrome.
  Single long scrolling page per ship, sidebar nav list + "voyage" waypoint grid,
  CRT scanline toggle. No ship uses this as its live chrome anymore, but the
  engine/CSS and the `shell()`/`section()` build path stay in the codebase — nothing
  currently deletes them, and `build/repair.mjs` still emits through v1 shape before
  `--v2` re-lifts the prose (see gotcha #1 and the `--v2` migration step in
  `build/build.mjs`).
- **v2** (`assets/shipyard-v2.js` + `assets/shipyard-v2.css`) — the chrome every ship
  now ships with. One-part-at-a-time layout: a consolidated sidebar path + milestone
  tracker, sticky-on-desktop topbar with an in-part table of contents and
  reading-progress bar, big prev/next footer nav, hash routing. No CRT effect. New
  type (JetBrains Mono, Source Serif 4) vs v1's (VT323, Space Mono, IBM Plex Mono).
- Both engines expose the same `window.SHIPYARD_DATA` contract and the same
  `window.__SHIPYARD_ENGINE__` test seam, so `build/test.mjs` runs unmodified logic
  against either — see gotcha #6 for how it tells them apart.
- **All six ships are on v2 as of the fleet migration** (python was the original
  reference ship; docker, javascript, htmlcss, sql, rest-api followed in one
  session — see "What's been done" Phase 4 below). Migrating *content* is now a
  solved, repeatable one-command operation (`node build/build.mjs <tech> --v2`,
  see cheat sheet); the only per-ship judgment call left is the quiz-distractor
  quality pass (gotcha #7), and even that's done fleet-wide now.

### Build pipeline

```
content/<tech>-curriculum.md  (does NOT exist for any ship — see gotcha #1)
        + build/pedagogy/<tech>.mjs  (ranks, quiz, cards, miles, sim script, chrome strings)
        ↓  build/mdparse.mjs (markdown -> parts) — unused in practice, see gotcha #1
        ↓  build/build.mjs  (shell()/section() for v1, shellV2()/sectionV2() for v2)
        ↓  build/shuffle.mjs (deterministic per-question option shuffle)
        →  <tech>.html, <tech>.slim.html (fully inlined/offline), data/<tech>.js
        →  registry.json (aggregated stats, read by build/hub.mjs)
        →  index.html  (via build/hub.mjs, NOT automatic — separate command)
```

`data/<tech>.js` is a generated file assigning `window.SHIPYARD_DATA = {...}` —
`meta`, `parts` (id/num/title/tag only, no body — body lives baked into the HTML),
`quiz`, `cards`, `miles`, `sim`.

### State model (both engines)

`localStorage[meta.storageKey]`, shape `{v:2, done:{}, quiz:{pid:{first,cur,best}},
milestones:{}, nailed:{}, graduated:bool}`. XP is **derived, never stored** — it's a
pure function of `done`/`quiz.first`/`milestones` so it can't drift or be farmed by
toggling things on and off. `first[]` is the immutable first-attempt record (earns
XP once); `cur[]` is the current attempt, cleared by retake.

## What's been done this session (chronological, grouped)

**Phase 1 — engine bug fixes, all six ships (v1 chrome throughout)**
Quiz scoring bug (first-click-in-part vs first-time-answering-this-question
conflation), XP farming via toggle, derived-XP rewrite, `simRun` double-fire,
seeded quiz-option shuffle + `build/lint-quiz.mjs` distractor-quality linter,
markdown list/heading rendering fixes, embedded+subsetted fonts with verified AA
contrast, accessibility pass (skip link, ARIA roles/live-regions, keyboard
activation, heading hierarchy, hash routing), progress export/import/reset, docker
pedagogy recovery, registry/hub regeneration, `build/test.mjs` (150 regression
tests), scrollbar/centering fix, sidebar milestone tracker.

**Phase 2 — Python v2 redesign (reference-ship sign-off, "one ship fully" plan)**
Built a standalone mockup (`design/ui-overhaul-mockup.html`) for review before
touching production files. Once approved: subsetted+embedded new type, rebuilt
`shipyard-v2.css` to the new visual language, reworked `shipyard-v2.js` for
one-part-at-a-time nav (`showPart`/`nextPart`/`prevPart`, `renderPath`,
`renderTopbar`, `renderTOC`, `renderFootnav`, hash routing), added the `--v2` build
path to `build/build.mjs`, rewrote all 49 of python's flagged quiz questions
(0/49 flagged now — see gotcha #8 for the 3 answer-key bugs found in the process),
built and verified python end-to-end (150/150 tests, byte-diffed the other five
ships to confirm zero collateral changes).

**Phase 3 — mobile responsiveness, all six ships + hub**
Fixed a CSS Grid "blowout" risk on ~320px phones (`minmax(300px,1fr)` →
`minmax(min(300px,100%),1fr)`) in three places: v1's `.deck`, v2's `.deck`, and the
hub's `.grid` — **fixed in both the generated file and, where applicable, the
generator template** (see gotcha #3). Fixed the v2 topbar sitting directly under
the fixed mobile burger button once scrolled (dropped `position:sticky` on mobile
instead of chasing a pixel offset). Enlarged v2's prev/next buttons for a real
touch target on mobile. Set `site.json`'s `url` to the live Pages URL and repaired
all six ships' OG tags to be absolute.

**Phase 4 — fleet-wide v2 migration + quiz rewrite (docker, javascript, htmlcss,
sql, rest-api), pushed as `f3ea3f3`**
User explicitly approved migrating the rest of the fleet (the thing Phase 2/3
deferred pending sign-off). Confirmed the `--v2` build path was already fully
generic (no python-specific hardcoding in `build/build.mjs`, `build/repair.mjs`,
or `assets/shipyard-v2.js`/`.css`) by dry-running `node build/build.mjs docker --v2`
before committing to the full fleet. Ran five parallel background agents, one per
ship, each doing: `build.mjs <tech> --v2` → rewrite every flagged quiz distractor
in `build/pedagogy/<tech>.mjs` into substantive, plausible wrong answers (not
placeholder text) → rebuild → `lint-quiz.mjs <tech>` until 0 flagged → full
regression suite → file-scope check. Result: **all six ships clean, 0/319 flagged
fleet-wide** (was 277/271 flagged pre-session across the five non-python ships).
Along the way, 11 more genuine answer-key bugs were found and fixed the same way
as python's 3 (gotcha #7's `q.o[q.a]` vs `q.e` cross-check) — 3 in sql, 8 in
rest-api, 0 in docker/javascript/htmlcss. 150/150 regression tests pass;
`registry.json`/hub regenerated (byte-identical — stats didn't change, only quiz
text did).

## Known-pending work (not started, or intentionally deferred)

- **Task queue #13–16** (predates the whole UI-redesign detour, never resumed):
  - #13 *(was in_progress)* — make the test suite runnable on a clean clone. Right
    now `jsdom` is **not a declared dependency anywhere** — there is no
    `package.json` in this repo at all. See gotcha #4.
  - #14 — add doc-assertion checks so `SPEC.md`/`README.md` can't drift into fiction
    (nothing enforces that documented behavior matches actual behavior).
  - #15 — make verification unskippable: git pre-commit hook + CI workflow.
  - #16 — prove the harness actually catches the original bugs, by deliberately
    reintroducing each one and confirming `build/test.mjs` fails.
- **No real-browser visual verification of the v2 layout was ever done, for ANY
  ship, including python.** No headless browser has been available in any agent
  sandbox this project has run in so far. All responsive/layout fixes across all
  six ships were verified by careful CSS/DOM reasoning and `build/test.mjs`'s DOM
  assertions, not pixels. **Recommend an actual device/browser pass before calling
  the v2 rollout fully done** — this is now a fleet-wide gap, not just python's.
- **`design/ui-overhaul-mockup.html` is now stale.** It captured the v2 visual
  language pre-sign-off for python only; harmless to leave as a historical
  artifact, but don't treat it as representative of the other five ships' actual
  content/layout.
- `.duel` / `.bcontainer` / `.anode` diagram classes exist in both CSS files but
  turned out **not to be used by any ship's actual content**, javascript included
  (confirmed when javascript migrated to v2 in Phase 4) — they're dead CSS at
  present, not a live risk. Leave them; they may be intended for content that
  hasn't been authored yet. If you ever see them rendered, they still haven't had
  a real-browser check (see the visual-verification gap above).

## Gotchas / tribal knowledge (read before touching the build pipeline)

1. **There is no markdown source for any ship's content.** `content/` contains only
   a `README.md` explaining this. `build/build.mjs`'s normal
   parse-markdown-then-render path (`haveMd && !reslim`) never actually runs in
   practice. All content lives baked into the already-built `<tech>.html` files, and
   gets *recovered* from there via `build/repair.mjs`'s `extractParts()` (regex-based
   extraction of each `.part` section's prose) rather than parsed fresh. If real
   markdown source ever gets added to `content/`, the normal path will "just work" —
   until then, use `repair.mjs`/the `--v2` path, not a bare `build.mjs <tech>` call.

2. **`repair.mjs` had no entry-point guard until this session.** Its `main()` used
   to run unconditionally at import time. Since `build.mjs`'s `--v2` path imports
   `extractParts` from `repair.mjs`, merely importing it triggered repair's own CLI
   logic against `build.mjs`'s argv — silently running a full v1-chrome repair pass
   and overwriting whatever ship was named on the command line. **Fixed** — see the
   `if (process.argv[1] && process.argv[1].endsWith('repair.mjs'))` guard at the
   bottom of `build/repair.mjs`. Don't remove it, and apply the same pattern to any
   new script that gets imported for its exports elsewhere.

3. **Hand-editing a generated output file is a trap.** `index.html` is generated by
   `build/hub.mjs` from a template string in that same file. Earlier in this session
   a responsive fix was applied directly to `index.html` and *not* to the
   `.grid{...}` string inside `hub.mjs` — the next `node build/hub.mjs` run would
   have silently reverted it. Caught and fixed at the very end of the session (see
   the "Fix hub.mjs template drift" commit). **Rule of thumb: if a file has a
   `// generated by ...` comment or a known generator script, edit the generator,
   then regenerate — never hand-edit the output and call it done.**

4. **`jsdom` is not an installed/declared dependency.** There's no `package.json` in
   this repo. Prior sessions installed `jsdom` into `/tmp/node_modules` (outside the
   repo) and either relied on Node's directory-walk-up module resolution (works only
   if the CWD is under the same tree as that `node_modules`) or symlinked it in.
   **On this Windows/Git-Bash environment specifically, `ln -s /tmp/.../node_modules
   node_modules` does NOT create a real symlink** — it silently produces a plain
   directory with `Directory` attributes and no reparse point (confirmed via
   PowerShell `Get-Item ... | Select LinkType,Target` — both empty), meaning it's a
   full ~26MB copy, not a link. `rm node_modules` then fails with "Is a directory"
   and `rmdir` fails with "Directory not empty" — use `rm -rf node_modules` to clean
   it up, and don't rely on the symlink actually being lightweight/shared. This is
   exactly what task #13 is for: add a real `package.json` with `jsdom` as a
   devDependency so `node build/test.mjs --dom` works out of the box on a clean
   clone, without this workaround at all.

5. **`--reslim` does not regenerate page-level `<head>` meta.** It only rewrites
   `data/<tech>.js` and `<tech>.slim.html` from whatever `<tech>.html` already says —
   it does not re-run `shell()`. To pick up a `site.json`/meta-level change on a v1
   ship, run `node build/repair.mjs <tech>` first (re-emits through the real
   `shell()`), *then* `--reslim` to refresh the embedded slim copy. (v2's `--v2`
   path always fully regenerates the shell, so this doesn't apply to python.)

6. **The v2 build path is opt-in only, by design.** `node build/build.mjs <tech>
   --v2`. It is explicitly rejected in combination with `--all`
   (`build.mjs`'s `main()` exits with an error if both flags are present), so no
   future "rebuild everything" pass can silently flip a ship to v2. `build/test.mjs`
   tells v1 and v2 pages apart via the page's own
   `<meta name="contract" content="shipyard-<tech>@3">` tag (`@2` = v1, `@3` = v2) —
   see `isV2()` near the top of that file — rather than hardcoding a ship name, so
   it keeps working as more ships migrate.

7. **Before hand-editing any `build/pedagogy/<tech>.mjs` quiz array, cross-check
   `q.o[q.a]` against `q.e`.** Three genuine answer-key bugs were found in
   `python.mjs` this way — the option marked correct (`a:`) directly contradicted
   its own explanation (`e:`). Found at p5 Q1, p6 Q3, p9 Q2; all three fixed. The
   other five ships have **not** been audited this way — do it if/when they get
   their distractor-rewrite pass.

8. **`build/lint-quiz.mjs` thresholds**: `MAX_LENGTH_RATIO` 1.6 (correct answer vs.
   mean distractor length), `MIN_DISTRACTOR` 40 chars, `MAX_POSITION_RATE` 0.45
   (can't pass by always pressing the same letter). Position bias is fixed
   automatically at build time by `build/shuffle.mjs`, seeded on
   `tech:part:index:question-text` — editing distractor *text* doesn't reshuffle
   position (only editing `q.q` or `q.a` does), so after a distractor rewrite you
   may need to nudge one or two questions' *array order* (not wording) back under
   the position threshold. See how this was done for python: the fix is to find,
   for a given question, which original array index the shuffle maps to which final
   letter (`build/shuffle.mjs`'s `hash()`/`rng()` are exported for exactly this),
   then reorder the `o` array (and update `a`) so the correct answer lands somewhere
   else — no wording changes needed.

9. **GitHub push access depends entirely on the environment the agent is running
   in, not on the repo.** An earlier session ran in a sandbox with no SSH key, no
   stored token, and no `gh` CLI, and genuinely could not push — commits piled up
   locally until the user pushed manually. A later session ran directly on the
   user's machine (this doc's "Current repo state" reflects that) and `git push
   origin main` worked immediately, no extra setup needed. **Don't assume either
   way — just try `git push` and see**, and if it fails, fall back to asking the
   user to push, same as before.

10. **`--reslim` without `--v2` is now a landmine — every ship is v2, and
    `--reslim` alone still calls the v1 `slimify()`.** `buildTech()` in
    `build/build.mjs` picks the slim function purely off the `v2` flag:
    `v2 ? slimifyV2(page, tech) : slimify(page, tech)`. `slimify()` (v1) looks for
    the literal `<link rel="stylesheet" href="assets/shipyard.css">` and
    `<script src="assets/shipyard.js"></script>` tags to inline — a v2 page has
    `shipyard-v2.css`/`shipyard-v2.js` instead, so neither regex matches, and you
    get a `.slim.html` that silently fails to inline the CSS/engine (data/<tech>.js
    still gets embedded fine, since that replace targets `data/<tech>.js` which is
    unchanged between v1/v2). **Now that no ship uses v1 chrome, always pass `--v2`
    — `node build/build.mjs <tech> --v2` is the correct command for any content or
    quiz edit on any ship, full stop.** There's no v2 equivalent of the old
    "reslim-only, skip chrome regen" fast path; `--v2` always fully re-emits, and
    it's fast enough that this hasn't mattered in practice.

## Command cheat sheet

```bash
# Rebuild any ship after ANY change — pedagogy edit, quiz rewrite, content tweak.
# Every ship is on v2 now (see gotcha #10) — always pass --v2, there is no other
# correct invocation. Re-extracts prose from the existing page, regenerates
# data/<tech>.js from the pedagogy module, and fully re-emits the v2 chrome.
node build/build.mjs <tech> --v2

# Regenerate registry.json (happens automatically at the end of any build.mjs run)
# Regenerate the hub page from registry.json + site.json (NOT automatic — separate step)
node build/hub.mjs

# Lint quiz quality
node build/lint-quiz.mjs [tech...] [--list] [--report] [--strict]

# Full regression suite (static checks only, no deps needed)
node build/test.mjs
# ... with jsdom DOM/interaction tests (needs jsdom on the module path — see gotcha #4)
node build/test.mjs --dom
```

## File map (non-obvious ones)

| Path | What |
|---|---|
| `build/build.mjs` | Main pipeline: v1 `shell()`/`section()`, v2 `shellV2()`/`sectionV2()`, `--v2` flag, `renderPage`/`renderPageV2` exports, `dataModule()`, `registry()` |
| `build/repair.mjs` | Recovers prose from an already-built page (no markdown source exists — gotcha #1); exports `extractParts` for `build.mjs`'s `--v2` reuse |
| `build/shuffle.mjs` | Deterministic per-question quiz-option shuffle; exports `hash`/`rng` for manual position-letter prediction (gotcha #8) |
| `build/lint-quiz.mjs` | Distractor-quality + position-bias linter; `--report` writes `QUIZ-REWRITES.md` |
| `build/test.mjs` | 150 regression tests; `isV2()` helper branches v1/v2-specific assertions |
| `build/mdparse.mjs` | Markdown → parts parser — exists but effectively unused (gotcha #1) |
| `build/hub.mjs` | Generates `index.html` from `registry.json` + `site.json`; run manually |
| `assets/shipyard.js` / `.css` | v1 engine/chrome — unused by any ship now, kept in-tree (see Architecture section) |
| `assets/shipyard-v2.js` / `.css` | v2 engine/chrome — all six ships |
| `design/ui-overhaul-mockup.html` | Standalone (non-production), now-historical mockup used to get sign-off on the v2 visual language before touching real files; python-specific and stale |
| `site.json` | `{"url": "..."}` — absolute base URL for OG tags |
| `registry.json` | Generated aggregate stats per ship, drives the hub |
| `QUIZ-REWRITES.md` | Generated report of quiz questions still failing the linter — currently empty, all six ships clean |
