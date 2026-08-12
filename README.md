# THE SHIPYARD — First-Principles Curriculum Fleet

Interactive, offline, single-file programming curricula. Each ship is one portable HTML file: every part, checkpoint, idea card and milestone runs on a shared engine. Progress lives in your browser's localStorage. Copy a file anywhere — it runs.

| Ship | Parts | Questions | File |
|---|---|---|---|
| **The Container Shipyard** — Docker | 14 | 47 | [`docker.slim.html`](docker.slim.html) |
| **The Python Shipyard** | 14 | 49 | [`python.slim.html`](python.slim.html) |
| **The JavaScript Shipyard** | 14 | 48 | [`javascript.slim.html`](javascript.slim.html) |
| **The HTML/CSS Shipyard** | 14 | 48 | [`htmlcss.slim.html`](htmlcss.slim.html) |
| **The SQL Shipyard** | 14 | 68 | [`sql.slim.html`](sql.slim.html) |
| **The REST-API Shipyard** | 14 | 59 | [`rest-api.slim.html`](rest-api.slim.html) |

Fleet index: [`index.html`](index.html) — generated from `registry.json`.

## Why single files

A curriculum should be as easy to share as a screenshot. No accounts, no servers, no install — open the file, study, close it, your progress is still there next time. Type is embedded as subsetted woff2, so a `.slim.html` renders identically with no network at all.

## Structure of a ship

- 14 parts plus a briefing, tagged by depth: **DEEP** (core mental model), **RECOGNIZE**, **REFERENCE**, **ADVANCED**
- Checkpoint quizzes per part — scored, retakeable, 70% to clear
- 18 idea cards — the ideas that make the topic click
- 6 milestones — proof-of-skill challenges
- A simulation block where the idea is staged live
- One rule per ship — the sentence that collapses the whole topic

### How progress works

| Action | XP |
|---|---|
| Mark a part complete | 25 |
| Answer a question correctly **first time** | 3 |
| Cross a milestone | 10 |

XP is **derived**, never stored — it is recomputed from your progress on every render, so untoggling something gives the XP back and nothing can be farmed. Retaking a quiz updates your best score but never re-earns XP. Rank thresholds scale with each ship's own maximum, so every curriculum is equally hard to top out.

Graduation requires all three: every part complete, every checkpoint cleared at ≥70%, and every milestone crossed.

Each ship stores progress under `shipyard:<tech>:v1`. Use **EXPORT** in the sidebar to download it as JSON, **IMPORT** to restore it elsewhere, **RESET** to wipe one ship.

## Building ships

```
node build/draft.mjs <tech>          # md -> pedagogy skeleton with per-part hints
node build/build.mjs <tech>          # md + pedagogy -> page + slim + data + registry
node build/build.mjs --all           # every ship
node build/build.mjs --all --reslim  # re-emit slim + data only (prose untouched)
node build/hub.mjs                   # registry.json -> index.html
node build/lint-quiz.mjs --report    # audit quizzes, write QUIZ-REWRITES.md
node build/test.mjs --dom            # regression suite (needs `npm i jsdom`)
```

### Source content

`build.mjs` reads `content/<tech>-curriculum.md`. **These markdown files are not currently in the repo** — they live outside it, which is why a clone cannot rebuild a ship from scratch. Drop them into `content/` to restore the full pipeline.

Until then, `build/repair.mjs` covers the gap: it recovers each part's prose from the existing `<tech>.html`, applies the parser fixes, and re-emits the page through the same `section()`/`shell()` the real build uses.

```
node build/repair.mjs --all && node build/build.mjs --all --reslim
```

### Files

- `build/mdparse.mjs` — shared markdown parser (used by draft, build and repair)
- `build/build.mjs` — parts parser, chrome assembler, slim contractor, registry writer
- `build/shuffle.mjs` — seeded, deterministic quiz-option permutation
- `build/lint-quiz.mjs` — fails quizzes that can be passed without reading
- `build/repair.mjs` — one-time page recovery while the markdown is missing
- `build/test.mjs` — regression suite
- `build/pedagogy/<tech>.mjs` — the authored layer: quizzes, cards, miles, sim, per-ship chrome
- `assets/shipyard.js` / `assets/shipyard.css` — the shared engine, curriculum-neutral
- `assets/fonts/` — subsetted OFL woff2 files, embedded into the CSS
- `data/<tech>.js` — generated data contracts (`window.SHIPYARD_DATA`), do not hand-edit
- `site.json` — publish URL; set it so `og:image` resolves absolutely for link previews

## Known work

`QUIZ-REWRITES.md` lists 317 of 319 questions whose correct answer is much longer than its distractors. Option *positions* are now shuffled at build time, so "always press A" no longer works — but "always pick the longest option" still scores 77–100% per ship. Fixing that means rewriting distractors so each states a plausible wrong mental model at the same length as the truth. Run `node build/lint-quiz.mjs --report` to regenerate the queue.

## License

- **Code** (engine, build pipeline, assets): MIT — see [`LICENSE`](LICENSE)
- **Curricula content** (text, quizzes, pedagogy): CC BY-NC-ND 4.0 — free to read, learn, and share the files as-is; no commercial redistribution, no derivatives, attribution required.
- **Fonts** (VT323, Space Mono, IBM Plex Mono): SIL Open Font License 1.1 — see [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt)
