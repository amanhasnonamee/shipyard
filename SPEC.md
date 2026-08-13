# Shipyard — Build Docs

## Data contract

`window.SHIPYARD_DATA` — generated into `data/<tech>.js`, never hand-edited.

```
meta   { tech, title, brand, tagline, accent, storageKey, legacyStorageKeys,
         stackLabel, ranks[6], grad{title,rule}, sim{prompt},
         console{cmd,line}, egg{label,color,svg}, stackSim{labels} }
parts  [{ id, num, title, tag }]
quiz   { pN: [{ q, o[], a, e }] }        options shuffled at build time
cards  [{ t, q, a }]
miles  [{ id, title, pass }]
sim    [{ t, l }]
stackInfo?  { layerKey: html }           only ships with an interactive stack
```

**The engine must contain no curriculum-specific text.** Everything that used to be
hardcoded for Docker — the rank ladder, graduation title and lines, the simulator
prompt, the console row, the easter egg — now comes from `meta`. `build/test.mjs`
asserts that `assets/shipyard.js` matches neither `/docker/i` nor `/whale/i`.

## Progress contract

State v2, stored at `meta.storageKey`:

```
{ v:2,
  done:       { pid: true },
  quiz:       { pid: { first:[1|0|null], cur:[1|0|null], best:pct } },
  milestones: { mid: true },
  nailed:     { cardIndex: true },
  graduated:  bool }
```

- `first` — the very first answer to each question. Immutable; the sole basis for XP.
- `cur` — the current attempt. Cleared by RETAKE; drives the displayed score.
- `best` — highest percentage ever reached; survives retakes.
- **XP is not stored.** It is derived from `done`/`quiz.first`/`milestones` on every render.

v1 state is migrated on load, and `legacyStorageKeys` covers docker's old un-namespaced `shipyard-v1` key.

## Build pipeline

```
content/<tech>-curriculum.md
        │
   mdparse.mjs        parse -> parts (lists buffered, headings h3+)
        │
   build.mjs  ──►  <tech>.html          page assembly (shell + sections)
        │          data/<tech>.js       SHIPYARD_DATA, quiz shuffled
        │          registry.json        counted from the data, not regexed
        │
   hub.mjs    ──►  index.html           every string from the registry
```

`build/repair.mjs` is a temporary substitute for the first stage while the source
markdown is outside the repo — it recovers part prose from the built page and hands
it to the same `renderPage()`.

## Verification

`node build/test.mjs` — static assertions across six ships. Each one maps to a
bug that shipped:

| Assertion | The bug it guards |
|---|---|
| answers are not clustered on one option | javascript/htmlcss: 100% of answers at index 0 |
| ordered lists are not fragmented | one `<ol>` per item — every list restarted at "1." |
| heading levels do not skip | part titles were `<div>`; h1 → h2 with no part heading |
| no docker leakage | engine hardcoded whale, rank and graduation copy |

These are static/regex checks against the built HTML and data modules — no
browser is booted. The suite used to also boot each page in jsdom (via a
generated `.slim.html`) to click through quizzes, milestones and reload
persistence; that layer was dropped along with slim-file generation, so those
behaviors (quiz scoring, XP-farming resistance, graduation gating, reload
persistence) are exercised by manual testing in a real browser, not this suite.

## Deferred / known

- **Distractor quality.** Option positions are shuffled, but correct answers still
  average ~101 chars against ~20 for distractors, so "pick the longest" scores
  77–100%. `QUIZ-REWRITES.md` is the queue; `lint-quiz.mjs --strict` will fail a
  build once the rewrites land.
- **Source markdown** is not in the repo; `content/` is empty and `repair.mjs`
  stands in. Restoring it retires `repair.mjs`.
- `site.json.url` is unset, so `og:image` is emitted relative and social previews
  will not show an image until it is filled in.
- `?render=img` alt-variant mechanism (contrast-tuned "poster" CSS) — reserved, not built.
- Spaced repetition on the idea cards — still a binary "NAILED" toggle with no scheduling.
