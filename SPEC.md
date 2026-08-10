# Shipyard — Image Contract & Build Docs

`docker.slim.html` is the **image-source contract** for the Docker curriculum: one self-contained file that any renderer (headless Chrome, screenshot service, LLM image pipeline) can open and turn into a faithful image of the shipped UI.

## Contract checklist — what a Shipyard file must satisfy

1. **Zero external assets.** All CSS inline in the head. No images, no icon fonts, no CDN JS. Google Fonts URLs kept (renderer fetches them); a `--sansfallback` stack covers offline renders, so images never degrade.
2. **No network JS dependencies.** Engine + data inline; boot on `load`; runs identically from `file://`.
3. **Deterministic boot paint.** All interactive chrome (stack, nav, quizzes, deck, miles, voyage) renders from data on `load` — the painted surface IS the final state; no contentful paint after interaction.
4. **`data-render="img"` on `<html>`** + `<meta name="contract" content="shipyard-docker@1">` — marks the file as an image-source contract; versioned for renderer-side logic.
5. **UTF-8, `<html lang="en">`, no BOM; total single-file size ≤ 160 KB** (current: 158,549 B).
6. Regression rule: rebuilding the file must not change rendered pixels. Verified by pixel-distribution diff (dark % / accent % / avg RGB) against the source of truth.

## Verification — session record

| Check | Source | Result |
|---|---|---|
| Data integrity (15 parts / 47 Qs / 18 cards / 6 miles / 8 sim steps) | node eval of `data/docker.js` | pass |
| Engine genericization seams (no leftover raw data literal) | grep `assets/shipyard.js` | pass |
| Slim page engine boot (15 stack strips / 188 quiz buttons / 18 cards / 6 miles / 15 waypoints) | headless dump-dom | pass |
| Console errors on slim page | `--enable-logging=stderr` | 0 (after applyMeta fix) |
| Render parity slim vs source: 92% dark / 1% amber / avgRGB [19,24] both | 1280×910 headless screenshots | identical |

## Build pipeline

```
docker-curriculum.html  (source of truth — single file, older)
        │
extract.mjs (in temp)   ──►  shipyard/docker.html  (page assembly)
        │                      ├─ assets/shipyard.css  (from build #3)
        │                      ├─ assets/shipyard.js   (generic engine)
        │                      └─ data/docker.js       (SHIPYARD_DATA)
contractor.mjs (temp)   ──►  shipyard/docker.slim.html (image contract)
        │
renderer (headless edge) ──►  image
```

`extract.mjs` regenerates `docker.html` from source; `contractor.mjs` regenerates the slim contract from `docker.html`. Both live in the session temp dir, referenced from this doc. **Do not hand-edit `shipyard.js` or `data/docker.js`** — they are derived artifacts.

## Effort estimate (honest)

| Item | State | Effort so far |
|---|---|---|
| Design/build #1–#3 (port, rewrite, polish) | done | ~90 min session-equivalent |
| Extract → slim page + engine genericization | done | ~35 min (incl. one debug loop on `applyMeta`) |
| Contract + render-parity verification | done | ~15 min |
| **Next .md → shipyard file** (given the pipeline) | **~45–75 min** | docker.hmtl2 → `data/<tech>.js` + copy chrome, e.g. `kubernetes` |
| Optional: hub registry (index.html + one-command builder for N curricula) | not started | ~60–90 min |
| Optional: opencode hooks (daemon auto-links new .md => page + contract) | not started | ~30–45 min |

Note: the option I deliberately did NOT take — each new curriculum regenerating its own chrome page from scratch, ~1.5–2 hrs each — is no longer the default path. Data-driven pipeline wins by ~3x on repeat builds.

## Deferred / known

- `?render=img` alt-variant mechanism (projected contrast-tuned "poster" CSS) — reserved; not built. Current contract = plain `data-render` flag + single stylesheet.
- Simulator/stack paint under `?render=img` — not applicable (no such mode yet).
- Favorites ("SAVE") not ported from build #2 — superseded by memorized-state design.
## Build Run Record — 2026-08-11 (pipeline v1)
- uild.mjs <tech>: md -> chrome page + data js + slim; hub.mjs: registry.json -> hub/index.html.
- Bugs found and fixed: (1) inline-code path emitted unescaped HTML tags (<template> in js md line 501 swallowed the script tags -> blank engine); (2) registry regexes missed JSON.stringify spacing/quoting, and naive || [] truthiness; (3) em-dash --- part headings; (4) pathToFileURL for ESM dynamic import on Windows.
- Verified (headless Edge dump-dom): python 15 strips / 196 quiz btns (49 Qs) / 36 cards / 6 miles / 15 waypoints / 22 terms; javascript 15 / 192 (48) / 36 / 6 / 15 / 21; htmlcss 15 / 192 (48) / 36 / 6 / 15 / 17. All pages: 0 console errors.
- Pixel sanity (@1280x910): 85% dark, avgRGB ~[20,24,30] per page; accent painted per brand (python #16b981, javascript #a78bfa, htmlcss #ff6b6b each ~0.5% of pixels). Hub: 4 cards, 0.9% light pixels (text on canvas).
- Registry (auto): docker 15p/65q, python 15p/67q, javascript 15p/66q, htmlcss 15p/66q (quiz counts include card prompts).
