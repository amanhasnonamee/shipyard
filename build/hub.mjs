// hub.mjs — regenerate the fleet index from registry.json
// usage: node build/hub.mjs         -> index.html at the repo root
//        node build/hub.mjs local   -> hub/index.html, linking up one level
//
// Everything on this page comes from the registry. Nothing about the number of
// ships or their names is written by hand — the old hub hardcoded four ships in
// its footer and og:description while six were already in the grid.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const reg = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')).techs;
const site = (() => {
  try { return JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8')); } catch { return { url: '' }; }
})();

const arg = process.argv[2] || 'root';
const link = arg === 'local' ? '../' : '';
const OUT = arg === 'local' ? join(ROOT, 'hub') : ROOT;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = rel => site.url ? site.url.replace(/\/+$/, '') + '/' + rel.replace(/^\/+/, '') : rel;

const names = reg.map(e => e.id.toUpperCase());
const listed = names.length > 1
  ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
  : names[0] || '';
const totalQ = reg.reduce((s, e) => s + e.questions, 0);
const desc = `${reg.length} interactive, offline, single-file programming curricula — ${listed}. ` +
  `${totalQ} checkpoint questions, ${reg.length * 18} idea cards. Progress lives in your browser.`;

const cards = reg.map(e => `
  <a class="card" href="${link}${e.file}" style="--acc:${e.accent};--acc2:${e.accent}18">
    <span class="chip">${esc(e.brand)}</span>
    <h2>${esc(e.title)}</h2>
    <p>${esc(e.tagline)}</p>
    <div class="stats">
      <span class="stat"><b>${e.layers}</b> parts</span>
      <span class="stat"><b>${e.questions}</b> questions</span>
      <span class="stat"><b>${e.cards}</b> idea cards</span>
      <span class="stat"><b>${e.miles}</b> miles</span>
    </div>
    <span class="open">OPEN SHIPYARD &rarr;</span>
  </a>`).join('\n');

const footLinks = reg.map(e => `<a href="${link}${e.file}">${esc(e.id.toUpperCase())}</a>`).join(' / ');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>THE SHIPYARD — Curriculum Fleet</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:title" content="THE SHIPYARD — First-Principles Curriculum Fleet">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(abs('assets/og/hub.png'))}">${site.url ? `\n<meta property="og:url" content="${esc(abs('index.html'))}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22%23ffd45e%22 d=%22M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z%22/%3E%3C/svg%3E">
<style>
:root{--bg:#0a0a0b;--ink:#f2f2f4;--ink2:#b4b4bf;--line:#232327;--chip:#151517}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:"Segoe UI",system-ui,-apple-system,sans-serif;min-height:100vh}
.wrap{max-width:1040px;margin:0 auto;padding:72px 24px 96px}
.helm{display:flex;align-items:center;gap:14px;margin-bottom:12px}
.helm .k{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--chip);display:grid;place-items:center;font-weight:700;color:#ffd45e}
h1{font-size:30px;letter-spacing:.02em;text-transform:uppercase}
.sub{color:var(--ink2);margin:8px 0 48px;font-size:15px;line-height:1.5;max-width:640px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:20px}
.card{display:flex;flex-direction:column;gap:14px;padding:26px;border-radius:16px;border:1px solid var(--line);background:var(--chip);border-top:3px solid var(--acc);text-decoration:none;color:inherit;transition:transform .18s ease, border-color .18s ease}
.card:hover,.card:focus-visible{transform:translateY(-3px);border-color:var(--acc);outline:none}
.card:focus-visible{box-shadow:0 0 0 2px var(--acc)}
.chip{align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.14em;color:var(--acc);border:1px solid var(--acc);padding:5px 10px;border-radius:999px}
.card h2{font-size:18px;line-height:1.35;min-height:49px}
.card p{color:var(--ink2);font-size:13.5px;line-height:1.5;min-height:40px}
.stats{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.stat{font-size:11.5px;color:var(--ink2);border:1px solid var(--line);border-radius:8px;padding:4px 8px}
.stat b{color:var(--ink)}
.open{font-size:12px;font-weight:700;letter-spacing:.12em;color:var(--acc);margin-top:8px}
.foot{margin-top:64px;padding-top:20px;border-top:1px solid var(--line);color:var(--ink2);font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
.foot a{color:var(--ink2)}
@media (max-width:640px){.wrap{padding:40px 16px 72px}}
@media (prefers-reduced-motion:reduce){.card{transition:none}.card:hover{transform:none}}
</style>
</head>
<body>
<div class="wrap">
  <div class="helm"><div class="k" aria-hidden="true">&#9650;</div><h1>The Shipyard</h1></div>
  <p class="sub">A fleet of first-principles curricula, each built as one portable HTML file — every part, checkpoint, idea card and milestone rendered by the same engine. Progress lives in your browser; the whole fleet runs offline.</p>
  <div class="grid">${cards}</div>
  <div class="foot">
    <span>${reg.length} SHIPS &mdash; GENERATED FROM REGISTRY</span>
    <span>${footLinks}</span>
  </div>
</div>
</body>
</html>`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'index.html'), html);
console.log(`hub: ${reg.length} ships | ${totalQ} questions | ${html.length}b -> ${arg === 'local' ? 'hub/index.html' : 'index.html'}`);
