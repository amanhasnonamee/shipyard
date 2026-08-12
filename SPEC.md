# Shipyard — Image Contract & Build Docs

A `<tech>.slim.html` is the **image-source contract** for its curriculum: one self-contained file that any renderer (headless Chrome, screenshot service, LLM image pipeline) can open and turn into a faithful image of the shipped UI.

## Contract checklist — what a Shipyard slim file must satisfy

1. **Zero external assets.** All CSS inline in the head. No images, no icon fonts, no CDN JS. Type is embedded as base64 woff2 subsets — no Google Fonts request, so the render is identical online and off. (Before v2 the fonts were merely *named*: nothing loaded them and every page silently fell back to Courier New.)
2. **No network JS dependencies.** Engine + data inline; boot on `load`; runs identically from `file://`.
3. **Deterministic boot paint.** All interactive chrome (stack, nav, quizzes, deck, miles, voyage) renders from data on `load` — the painted surface IS the final state; no contentful paint after interaction.
4. **`data-render="img"` on `<html>`** + `<meta name="contract" content="shipyard-<tech>@2">` — marks the file as an image-source contract; versioned for renderer-side logic.
5. **UTF-8, `<html lang="en">`, no BOM.** Size budget: **≤ 260 KB** per slim file. The old ≤160 KB budget predated SQL and REST (which exceeded it at 192 KB and 201 KB while the doc still claimed compliance) and predated embedded fonts, which add ~39 KB.
6. **Deterministic rebuild.** Rebuilding must not change rendered pixels. Quiz option order is permuted by `build/shuffle.mjs` from a seed of `tech:part:index:question`, so it is stable across builds.

### Current sizes

| File | Size | Budget |
|---|---|---|
| `javascript.slim.html` | 199.5 KB | ok |
| `python.slim.html` | 200.4 KB | ok |
| `htmlcss.slim.html` | 203.0 KB | ok |
| `docker.slim.html` | 215.7 KB | ok |
| `sql.slim.html` | 244.0 KB | ok |
| `rest-api.slim.html` | 252.5 KB | ok |

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
        │          <tech>.slim.html     css + data + engine inlined
        │          registry.json        counted from the data, not regexed
        │
   hub.mjs    ──►  index.html           every string from the registry
```

`build/repair.mjs` is a temporary substitute for the first stage while the source
markdown is outside the repo — it recovers part prose from the built page and hands
it to the same `renderPage()`.

## Verification

`node build/test.mjs --dom` — 131 assertions across six ships. Each one maps to a
bug that shipped:

| Assertion | The bug it guards |
|---|---|
| a perfect quiz scores 100% | scored 25%: only Q1 of each part was ever recorded |
| a wrong answer is scored as wrong | — |
| answered questions survive a reload | restore compared stored `1`/`0` against `true`/`false` |
| retake keeps best and XP | there was no retake, though the UI told you to re-run |
| XP cannot be farmed by toggling | untoggling never refunded, so 20 clicks = max rank |
| graduation is not reachable by checking boxes | six self-checked boxes graduated you |
| rank ladder tops out within reach | fixed thresholds vs per-ship XP ceilings (551 vs 614) |
| answers are not clustered on one option | javascript/htmlcss: 100% of answers at index 0 |
| simulator prompt is this ship's | every ship reset to `docker run -d -p 8080:80` |
| ordered lists are not fragmented | one `<ol>` per item — every list restarted at "1." |
| heading levels do not skip | part titles were `<div>`; h1 → h2 with no part heading |
| no docker leakage | engine hardcoded whale, rank and graduation copy |

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
