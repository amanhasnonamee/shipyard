// repair.mjs — rebuild a ship's page from the prose already inside it.
//
// usage: node build/repair.mjs <tech> | --all
//
// The source markdown for these curricula lives outside the repo (see README),
// so the normal `build.mjs <tech>` path cannot run here. This script recovers
// each part's prose from the existing <tech>.html, applies the fixes that would
// have come from the corrected parser, and then re-emits the page through the
// SAME section()/shell() the real build uses. The result is structurally
// identical to a fresh build — only the prose is lifted rather than parsed.
//
// Once content/<tech>-curriculum.md exists, this script is obsolete: use
// `node build/build.mjs --all`.

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');
const SHIPS = ['docker', 'python', 'javascript', 'htmlcss', 'sql', 'rest-api'];

// ---------------------------------------------------------------- extraction
// Exported so build.mjs can reuse it for the v2 chrome migration (--v2): that
// path also has no markdown source, and needs each part's prose lifted from
// the existing v1 page the same way this script already does.
export function extractParts(html) {
  const parts = [];
  const re = /<section class="part" id="(p\d+)"[^>]*>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, id, inner] = m;
    const num = (inner.match(/<div class="pnum"[^>]*>(\d+)<\/div>/) || [])[1] || id.slice(1).padStart(2, '0');
    const title = (inner.match(/class="ptitle"[^>]*>([\s\S]*?)<\/(?:div|h2)>/) || [])[1] || '';
    const tag = (inner.match(/<span class="m">TAG <b>([A-Z]+)<\/b><\/span>/) || [])[1] || null;

    // body = everything between the end of the part header and the breadcrumb.
    // Some hand-written parts have no breadcrumb, so fall back to end-of-section.
    const headEnd = inner.indexOf('</div>', inner.indexOf('<div class="pactions">'));
    const afterHead = inner.indexOf('</div>', headEnd + 6) + 6;
    const crumb = inner.indexOf('<div class="breadcrumb">');
    let body = inner.slice(afterHead, crumb === -1 ? undefined : crumb).trim();
    body = stripGenerated(body);
    parts.push({ id, num, title: decode(title.trim()), tag, body: [body.trim()] });
  }
  return parts;
}
function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

// Walk forward from the <div at `start` and return the index just past its
// matching </div>. Needed because the generated blocks are not always the last
// thing in a part — docker's simulator sits mid-section with prose after it, so
// cutting the tail would delete real curriculum.
function endOfDiv(html, start) {
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return html.length;
}

// Everything the builder appends gets removed, because section() puts it back.
function stripGenerated(body) {
  let out = body;

  const excise = (start, end) => { out = out.slice(0, start) + out.slice(end); };

  // simulator: find its caption, walk back to the .term that opens it
  const simCaption = out.indexOf('simulator — click RUN');
  if (simCaption !== -1) {
    const open = out.lastIndexOf('<div class="term">', simCaption);
    if (open !== -1) excise(open, endOfDiv(out, open));
  }

  const quiz = out.indexOf('<div class="quiz" data-part=');
  if (quiz !== -1) excise(quiz, endOfDiv(out, quiz));

  // deck and milestones each follow a one-line intro paragraph that build.mjs
  // also generates — remove that too, but only if it really is just one <p>
  for (const marker of ['<div class="deck" id="deck"', '<div class="mlist" id="mlist"']) {
    const at = out.indexOf(marker);
    if (at === -1) continue;
    const end = endOfDiv(out, at);
    const para = out.lastIndexOf('<p>', at);
    const isIntro = para !== -1 && /^<p>[\s\S]*?<\/p>\s*$/.test(out.slice(para, at));
    excise(isIntro ? para : at, end);
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

// ------------------------------------------------------------------- repairs
// 1. merge lists that the old parser split one-item-per-list. This is what made
//    every ordered list restart at "1.".
//
//    Only single-item lists are merged — that shape is the old parser's
//    signature. Two genuinely separate multi-item lists sitting next to each
//    other in hand-written HTML are left alone.
function mergeLists(html) {
  for (const tag of ['ol', 'ul']) {
    const single = new RegExp(`<${tag}><li>(?:(?!</?${tag}>)[\\s\\S])*?</li></${tag}>`, 'g');
    const run = new RegExp(`(?:${single.source}\\s*){2,}`, 'g');
    html = html.replace(run, block => {
      const items = block.match(new RegExp(`<li>[\\s\\S]*?</li>`, 'g')) || [];
      return `<${tag}>${items.join('')}</${tag}>`;
    });
  }
  return html;
}

// 2. heading levels. The part title is now the section's h2, so prose headings
//    start at h3. Rather than shifting by a fixed amount (which left docker's
//    duel columns jumping h2 -> h4), the distinct levels used inside a part are
//    remapped onto consecutive levels starting at h3, so no level is skipped.
function fixHeadings(html) {
  const used = [...new Set([...html.matchAll(/<h([1-6])\b/g)].map(m => Number(m[1])))].sort((a, b) => a - b);
  if (!used.length) return html;
  const map = new Map(used.map((lvl, i) => [lvl, Math.min(6, 3 + i)]));
  return html.replace(/<(\/?)h([1-6])\b/g, (_m, slash, lvl) => `<${slash}h${map.get(Number(lvl))}`);
}

// 3. docker's bridge diagram had its caption baked into the stylesheet
function fixBridge(html, tech) {
  if (tech !== 'docker') return html;
  return html.replace(
    /<div class="bnet">/g,
    '<div class="bnet" data-label="bridge network — docker0 (virtual switch)">'
  );
}

// 4. buttons inside the prose (COPY on code blocks, the interactive stack
//    controls) default to type="submit"; give them an explicit type so they
//    behave predictably and the a11y test can assert on it
function fixButtons(html) {
  return html.replace(/<button(?![^>]*\btype=)/g, '<button type="button"');
}

function repairBody(body, tech) {
  return fixButtons(fixBridge(fixHeadings(mergeLists(body)), tech));
}

// ---------------------------------------------------------------------- main
async function repair(tech) {
  const pagePath = path.join(ROOT, tech + '.html');
  if (!fs.existsSync(pagePath)) { console.log(`${tech}: no page, skipped`); return; }

  const build = await import(pathToFileURL(path.join(__dir, 'build.mjs')).href);
  const ped = (await import(pathToFileURL(path.join(__dir, 'pedagogy', tech + '.mjs')).href)).default;

  const html = fs.readFileSync(pagePath, 'utf8');
  const parts = extractParts(html);
  if (!parts.length) throw new Error('no parts found in ' + tech + '.html');

  const before = {
    splits: (html.match(/<\/ul>\s*<ul>/g) || []).length + (html.match(/<\/ol>\s*<ol>/g) || []).length,
    ols: (html.match(/<ol>/g) || []).length,
  };

  for (const p of parts) p.body = [repairBody(p.body[0], tech)];

  // hand back to the real builder so the chrome is generated, not patched
  const rebuilt = build.renderPage(tech, ped, parts);
  fs.writeFileSync(pagePath, rebuilt);

  const after = {
    splits: (rebuilt.match(/<\/ul>\s*<ul>/g) || []).length + (rebuilt.match(/<\/ol>\s*<ol>/g) || []).length,
    ols: (rebuilt.match(/<ol>/g) || []).length,
  };
  console.log(`${tech.padEnd(11)} parts=${parts.length} list-splits ${before.splits}->${after.splits} ` +
    `ol ${before.ols}->${after.ols} page=${rebuilt.length}b`);
}

async function main() {
  const args = process.argv.slice(2);
  const techs = args.includes('--all') ? SHIPS : args.filter(a => !a.startsWith('--'));
  if (!techs.length) { console.error('usage: node build/repair.mjs <tech> | --all'); process.exit(1); }
  for (const t of techs) await repair(t);
  console.log('\nnow run: node build/build.mjs <tech> --v2   (one ship at a time, --v2 rejects --all)');
}
// guarded like build.mjs — otherwise importing extractParts() (as build.mjs's
// --v2 path does) would run this file's own CLI against whatever argv the
// *importing* script was called with, and silently repair/overwrite a page
if (process.argv[1] && process.argv[1].endsWith('repair.mjs')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
