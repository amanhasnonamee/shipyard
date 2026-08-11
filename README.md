# THE SHIPYARD — First-Principles Curriculum Fleet

Interactive, offline, single-file programming curricula. Each ship is one portable HTML file: every part, checkpoint, idea card, and milestone runs on a shared engine. Progress lives in your browser's localStorage. Copy a file anywhere — it runs.

- **The Container Shipyard** — Docker, from first principles → [`docker.slim.html`](docker.slim.html)
- **The Python Shipyard** → [`python.slim.html`](python.slim.html)
- **The JavaScript Shipyard** → [`javascript.slim.html`](javascript.slim.html)
- **The HTML/CSS Shipyard** → [`htmlcss.slim.html`](htmlcss.slim.html)

Fleet index: [`index.html`](index.html)

## Why single files

A curriculum should be as easy to share as a screenshot. No accounts, no servers, no install — open the file, study, close it, your progress is still there next time.

## Structure of a ship

- 15 parts, tagged by depth: **DEEP** (core mental model), **RECOGNIZE**, **REFERENCE**, **ADVANCED**
- Checkpoint quizzes per part, scored, progress-gated
- Idea cards (the 18 ideas that make each topic click)
- Mile stones — proof-of-skill challenges
- A simulation block where the idea is staged live
- One rule per ship — the sentence that collapses the whole topic

## Building ships

The fleet is generated, not hand-written:

```
node build/draft.mjs <tech>   # md -> pedagogy skeleton (TBD fields, per-part hints)
node build/build.mjs <tech>   # md + build/pedagogy/<tech>.mjs -> pages + slim + registry
node build/hub.mjs            # registry.json -> index.html
```

- `build/draft.mjs` — pedagogy skeleton generator: parses the markdown, emits a fill-in-the-blank quizzes/cards/miles/sim module with per-part hints
- `build/build.mjs` — markdown→parts parser, chrome assembler, slim contractor, registry writer
- `build/mdparse.mjs` — shared markdown parser (used by draft + build)
- `build/pedagogy/<tech>.mjs` — authored quizzes, cards, miles, sim per tech
- `build/hub.mjs` — fleet index regenerated from `registry.json`
- `assets/shipyard.js` / `assets/shipyard.css` — the shared engine
- `data/<tech>.js` — generated data contracts (`window.SHIPYARD_DATA`), do not hand-edit

## License

- **Code** (engine, build pipeline, assets): MIT — see [`LICENSE`](LICENSE)
- **Curricula content** (text, quizzes, pedagogy): CC BY-NC-ND 4.0 — free to read, learn, and share the files as-is; no commercial redistribution, no derivatives, attribution required.