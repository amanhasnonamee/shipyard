// build.mjs — Shipyard curriculum pipeline
//
// usage: node build/build.mjs <tech>        build one ship from markdown + pedagogy
//        node build/build.mjs --all         build every ship in the registry
//        node build/build.mjs <tech> --reslim
//              regenerate data/<tech>.js from the existing page, without needing
//              the source markdown. Use this when the engine, CSS or pedagogy
//              changed but the prose did not.
//
// reads   content/<tech>-curriculum.md + build/pedagogy/<tech>.mjs
// writes  <tech>.html, data/<tech>.js, registry.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { esc, parse } from './mdparse.mjs';
import { shuffleQuiz } from './shuffle.mjs';
import { extractParts } from './repair.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');
const CONTENT = path.join(ROOT, 'content');
const SITE = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8')); }
  catch { return { url: '' }; }
})();

const argv = process.argv.slice(2);
const FLAGS = new Set(argv.filter(a => a.startsWith('--')));
const NAMED = argv.filter(a => !a.startsWith('--'));

const SHIPS = ['docker', 'python', 'javascript', 'htmlcss', 'sql', 'rest-api', 'langchain'];

function outFor(tech) {
  return {
    page: path.join(ROOT, tech + '.html'),
    data: path.join(ROOT, 'data', tech + '.js'),
  };
}
const REGISTRY = path.join(ROOT, 'registry.json');

// ================= section assembly =================
function medal(tag) {
  if (!tag) return '';
  return '<span class="m">TAG <b>' + esc(tag) + '</b></span>';
}
function quizBlock(id) {
  return '<div class="quiz" data-part="' + id + '">' +
    '<span class="qlbl">Checkpoint — hold yourself to it</span>' +
    '<div class="qscore">SCORE <b>—</b></div>' +
    '<div class="qwrap"></div>' +
    '<div class="qres" role="status" aria-live="polite"></div></div>';
}
const SIM_BLOCK =
  '<div class="term"><div class="termhead"><span class="td td1"></span><span class="td td2"></span><span class="td td3"></span><span class="tname">simulator — click RUN</span></div>' +
  '<pre id="simOut" aria-live="polite"></pre>' +
  '<div class="stack-controls" style="margin:0;padding:10px 16px;border-top:1px solid var(--line)"><button type="button" class="btn sm" id="simRun">&#9654; RUN</button><button type="button" class="btn sm ok" id="simReset">RESET</button></div></div>';

function section(part, i, parts, ped) {
  const prev = parts[i - 1]; const next = parts[i + 1];
  const chips = (ped.chips && ped.chips[part.id]) || [];
  let body = part.body.join('\n\n');
  if (ped.sim && ped.simIn === part.id) body += '\n\n' + SIM_BLOCK;
  if (ped.quiz && ped.quiz[part.id]) body += '\n\n' + quizBlock(part.id);
  if (part.id === ped.deckIn) body += '\n\n<p>' + (ped.deckNote || 'You&#39;ve already built the answers; this consolidates them. <b>Answer each question aloud before flipping the card.</b>') + '</p>\n<div class="deck" id="deck"><!-- cards injected by JS --></div>';
  if (part.id === ped.milesIn) body += '\n\n<p>' + (ped.milesNote || 'Six milestones = six layers of proof. Check each off honestly.') + '</p>\n<div class="mlist" id="mlist"><!-- milestones injected by JS --></div>';
  const crumbs = [];
  if (prev) crumbs.push('<a href="#' + prev.id + '">&larr; ' + prev.num + ' · ' + esc(prev.title.toUpperCase()) + '</a>');
  if (next) crumbs.push('<a class="next" href="#' + next.id + '">' + next.num + ' · ' + esc(next.title.toUpperCase()) + ' &rarr;</a>');
  return '<section class="part" id="' + part.id + '" aria-labelledby="' + part.id + '-title">\n' +
    '  <div class="phead"><div class="pnum" aria-hidden="true">' + part.num + '</div>\n' +
    '    <div><h2 class="ptitle" id="' + part.id + '-title">' + esc(part.title) + '</h2>\n' +
    '    <div class="pmeta">' + medal(part.tag) + chips.join('') + '</div></div>\n' +
    '    <div class="pactions"><button type="button" class="btn sm" data-done="' + part.id + '">MARK COMPLETE</button></div>\n' +
    '  </div>\n\n  ' + body + '\n\n' +
    '  <div class="breadcrumb">' + crumbs.join('') + '</div>\n' +
    '</section>';
}

// ================= chrome =================
const LEGEND =
  '  <div class="legend">\n    <div class="lt">Depth legend</div>\n' +
  '    <div class="lg"><span class="sw" style="background:var(--deep);box-shadow:0 0 6px rgba(255,93,93,.6)"></span><span><b style="color:var(--deep)">DEEP</b> — core mental model. Prove it out loud.</span></div>\n' +
  '    <div class="lg"><span class="sw" style="background:var(--recog)"></span><span><b style="color:var(--recog)">RECOGNIZE</b> — read fluently; write with docs open.</span></div>\n' +
  '    <div class="lg"><span class="sw" style="background:var(--ref)"></span><span><b style="color:var(--ref)">REFERENCE</b> — know it exists. Never memorize.</span></div>\n' +
  '    <div class="lg"><span class="sw" style="background:var(--adv)"></span><span><b style="color:var(--adv)">ADVANCED</b> — return after Part 8.</span></div>\n  </div>';

function ogUrl(rel) {
  if (!SITE.url) return rel;
  return SITE.url.replace(/\/+$/, '') + '/' + rel.replace(/^\/+/, '');
}

function shell(meta, ped, parts) {
  const layers = Math.max(parts.length - 1, 0);
  const desc = meta.tagline + ' — a first-principles interactive curriculum. One portable HTML file, ' +
    layers + ' parts, checkpoint quizzes and idea cards. Runs offline; progress stays in your browser.';
  return '<!DOCTYPE html>\n<html lang="en" data-render="img">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<meta name="color-scheme" content="dark">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(meta.title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:image" content="' + esc(ogUrl('assets/og/' + meta.tech + '.png')) + '">\n' +
    (SITE.url ? '<meta property="og:url" content="' + esc(ogUrl(meta.tech + '.html')) + '">\n' : '') +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22' + (meta.accent || '#ffb000').replace('#', '%23') + '%22 d=%22M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z%22/%3E%3C/svg%3E">\n' +
    '<meta name="contract" content="shipyard-' + meta.tech + '@2">\n' +
    '<title>' + esc(meta.title) + '</title>\n' +
    '<link rel="stylesheet" href="assets/shipyard.css">\n</head>\n<body>\n' +
    '<a href="#part0" class="skiplink">Skip to content</a>\n' +
    '<div id="scanlines" aria-hidden="true"></div><div id="vignette" aria-hidden="true"></div>\n' +
    '<button type="button" id="burger" aria-controls="dock" aria-expanded="false">&#9776; MAP</button><div id="backdrop"></div>\n<div id="app">\n' +
    '<aside id="dock" aria-label="Curriculum navigation">\n  <div class="brand">\n' +
    '    <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">\n' +
    '      <path fill="var(--accent)" d="M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z"/>\n' +
    '      <rect x="7" y="11" width="2" height="2" fill="var(--bg)"/><rect x="12" y="11" width="2" height="2" fill="var(--bg)"/><rect x="17" y="11" width="2" height="2" fill="var(--bg)"/>\n' +
    '    </svg>\n    <div><div class="bname">' + esc(meta.brand) + '</div><div class="bsub">' + esc(meta.tagline) + '</div></div>\n  </div>\n\n' +
    '  <div class="rankbox">\n    <div class="rk" id="rankNow">' + esc((meta.ranks && meta.ranks[0]) || 'SWABBIE') + '</div>\n    <div class="rkxp" id="rankXp"></div>\n    <div class="prbar"><i id="rankBar"></i></div>\n  </div>\n\n' +
    '  <div class="stackbox">\n    <div class="st"><span>' + esc(meta.stackLabel || 'THE STACK — your build') + '</span><span id="stackCount">0/' + layers + '</span></div>\n    <div id="stackMini"></div>\n    <div id="psRow"><b id="psRowCmd">$ shipyard status</b><br><span id="psRow2">—</span></div>\n  </div>\n\n' +
    '  <div class="milebox">\n    <div class="st"><span>MILESTONES</span><span id="mileCount">0/6</span></div>\n    <div id="mileMini"></div>\n  </div>\n\n' +
    '  <nav class="docknav" id="docknav" aria-label="Parts"></nav>\n\n' + LEGEND + '\n\n  <div class="dockfoot" id="dockfoot"></div>\n</aside>\n\n<main id="main">\n' +
    '<section class="hero" id="part0">\n  <div class="boot" aria-hidden="true">' + ped.boot.join('\n    ') + '\n  </div>\n' +
    '  <h1>' + ped.h1 + '</h1>\n  <p class="sub">' + ped.sub + '</p>\n' +
    '  <div class="hstatus">\n    <div class="hchip">RANK <b id="hRank">' + esc((meta.ranks && meta.ranks[0]) || 'SWABBIE') + '</b></div>\n' +
    '    <div class="hchip">XP <b id="hXp">0</b></div>\n    <div class="hchip">LAYERS <b id="hLayers">0/' + layers + '</b></div>\n' +
    '    <div class="hchip">QUIZZES CLEARED <b class="ok" id="hQuizzes">0</b></div>\n  </div>\n' +
    '  <h2 id="voyageHead">THE VOYAGE — ' + layers + ' WAYPOINTS</h2>\n  <div class="voyage" id="voyage"></div>\n</section>\n\n' +
    '#SECTIONS#' +
    '<footer>\n  <b>ABOUT THIS BUILD:</b> ' + ped.foot.about + '<br>\n  <b>THE ONE RULE:</b> ' + ped.foot.rule + '\n</footer>\n</main>\n</div>\n' +
    '<div id="grad"><div class="gterm"><div class="ghead">&#9650; SHIPYARD DEPLOYMENT — ALL MILESTONES CROSSED</div><div class="gbody"></div></div></div>\n' +
    '<script src="data/' + meta.tech + '.js"></script>\n<script src="assets/shipyard.js"></script>\n</body>\n</html>';
}

/**
 * Assemble a full page from parts. Exported so build/repair.mjs can re-emit an
 * existing ship through exactly this chrome instead of patching HTML by hand.
 */
export function renderPage(tech, ped, parts) {
  const meta = buildMeta(tech, ped);
  const sections = parts.map((p, i) => section(p, i, parts, ped)).join('\n\n');
  return shell(meta, ped, parts).replace('#SECTIONS#', sections);
}

// ================= v2 chrome (one-part-at-a-time) =================
// Reviewed and approved as the reference redesign for Python; NOT wired into
// the default build path. Only `node build/build.mjs <tech> --v2` uses this —
// `--all` and every other invocation still produce the v1 chrome above, so
// the other five ships are unaffected until each is migrated on purpose.
//
// medal(), quizBlock(), SIM_BLOCK and ogUrl() above are shared verbatim — the
// per-part content contract (quiz/deck/milestone injection points, depth
// tags, chips) hasn't changed, only the page chrome around it.
function sectionV2(part, i, parts, ped) {
  const chips = (ped.chips && ped.chips[part.id]) || [];
  let body = part.body.join('\n\n');
  if (ped.sim && ped.simIn === part.id) body += '\n\n' + SIM_BLOCK;
  if (ped.quiz && ped.quiz[part.id]) body += '\n\n' + quizBlock(part.id);
  if (part.id === ped.deckIn) body += '\n\n<p>' + (ped.deckNote || 'You&#39;ve already built the answers; this consolidates them. <b>Answer each question aloud before flipping the card.</b>') + '</p>\n<div class="deck" id="deck"><!-- cards injected by JS --></div>';
  if (part.id === ped.milesIn) body += '\n\n<p>' + (ped.milesNote || 'Six milestones = six layers of proof. Check each off honestly.') + '</p>\n<div class="mlist" id="mlist"><!-- milestones injected by JS --></div>';
  // only the first part is visible before JS runs — shipyard-v2.js toggles the
  // rest via showPart() on boot, this just avoids a flash of every part at once
  const hide = i === 0 ? '' : ' style="display:none"';
  return '<section class="part" id="' + part.id + '" aria-labelledby="' + part.id + '-title"' + hide + '>\n' +
    '  <div class="phead"><div class="pnum" aria-hidden="true">' + part.num + '</div>\n' +
    '    <div><h2 class="ptitle" id="' + part.id + '-title">' + esc(part.title) + '</h2>\n' +
    '    <div class="pmeta">' + medal(part.tag) + chips.join('') + '</div></div>\n' +
    '    <div class="pactions"><button type="button" class="btn sm" data-done="' + part.id + '">MARK COMPLETE</button></div>\n' +
    '  </div>\n\n  ' + body + '\n\n' +
    '</section>';
}

function shellV2(meta, ped, parts) {
  const layers = Math.max(parts.length - 1, 0);
  const miles = (ped.miles || []).length;
  const desc = meta.tagline + ' — a first-principles interactive curriculum. One portable HTML file, ' +
    layers + ' parts, checkpoint quizzes and idea cards. Runs offline; progress stays in your browser.';
  const first = parts[0] ? parts[0].id : 'p0';
  return '<!DOCTYPE html>\n<html lang="en" data-render="img">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<meta name="color-scheme" content="dark">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(meta.title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:image" content="' + esc(ogUrl('assets/og/' + meta.tech + '.png')) + '">\n' +
    (SITE.url ? '<meta property="og:url" content="' + esc(ogUrl(meta.tech + '.html')) + '">\n' : '') +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22' + (meta.accent || '#ffb000').replace('#', '%23') + '%22 d=%22M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z%22/%3E%3C/svg%3E">\n' +
    '<meta name="contract" content="shipyard-' + meta.tech + '@3">\n' +
    '<title>' + esc(meta.title) + '</title>\n' +
    '<link rel="stylesheet" href="assets/shipyard-v2.css">\n</head>\n<body>\n' +
    '<a href="#' + first + '" class="skiplink">Skip to content</a>\n' +
    '<button type="button" id="burger" aria-controls="dock" aria-expanded="false">&#9776; MENU</button><div id="backdrop"></div>\n' +
    '<div id="app">\n' +
    '<aside id="dock" aria-label="Curriculum navigation">\n  <div class="brand">\n' +
    '    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">\n' +
    '      <path fill="var(--accent)" d="M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z"/>\n' +
    '      <rect x="7" y="11" width="2" height="2" fill="var(--bg)"/><rect x="12" y="11" width="2" height="2" fill="var(--bg)"/><rect x="17" y="11" width="2" height="2" fill="var(--bg)"/>\n' +
    '    </svg>\n    <div><h1 class="bname">' + esc(meta.brand) + '</h1><div class="bsub">' + esc(meta.tagline) + '</div></div>\n  </div>\n\n' +
    '  <div class="rankbox">\n    <div class="rk" id="rankNow">' + esc((meta.ranks && meta.ranks[0]) || 'SWABBIE') + '</div>\n    <div class="rkxp" id="rankXp"></div>\n    <div class="prbar"><i id="rankBar"></i></div>\n  </div>\n\n' +
    '  <div class="progress-dash">\n' +
    '    <div class="dhead"><span>Course</span><span id="stackCount">0/' + layers + '</span></div>\n' +
    '    <div id="stackMini"></div>\n' +
    '    <div id="psRow"><b id="psRowCmd">$ shipyard status</b><br><span id="psRow2">—</span></div>\n' +
    '    <div class="milegroup">\n      <div class="dhead"><span>Milestones</span><span id="mileCount">0/' + miles + '</span></div>\n      <div id="mileMini"></div>\n    </div>\n' +
    '  </div>\n\n  <div class="sidefoot" id="sidefoot"></div>\n</aside>\n\n' +
    '<main>\n  <div class="topbar">\n' +
    '    <div class="crumbs">\n      <div class="crumb-l">PART <b id="pnum"></b> / <span id="ptotal"></span> <span class="tag-pill" id="tagPill" style="display:none"></span></div>\n' +
    '      <div class="navbtns"><button type="button" class="navbtn" id="btnPrev">&larr; PREV</button><button type="button" class="navbtn" id="btnNext">NEXT &rarr;</button></div>\n' +
    '    </div>\n    <div class="readbar"><i id="readbar"></i></div>\n    <div class="toc" id="toc"></div>\n' +
    '  </div>\n\n' +
    '#SECTIONS#' +
    '\n  <div class="footnav"><button type="button" class="fnbtn" id="fnPrev"></button><button type="button" class="fnbtn next" id="fnNext"></button></div>\n' +
    '</main>\n</div>\n' +
    '<div id="grad"><div class="gterm"><div class="ghead">&#9650; SHIPYARD DEPLOYMENT — ALL MILESTONES CROSSED</div><div class="gbody"></div></div></div>\n' +
    '<script src="data/' + meta.tech + '.js"></script>\n<script src="assets/shipyard-v2.js"></script>\n</body>\n</html>';
}

/** v2 counterpart to renderPage() — migrates existing prose into the new chrome. */
export function renderPageV2(tech, ped, parts) {
  const meta = buildMeta(tech, ped);
  const sections = parts.map((p, i) => sectionV2(p, i, parts, ped)).join('\n\n');
  return shellV2(meta, ped, parts).replace('#SECTIONS#', sections);
}

// ================= data contract =================
function buildMeta(tech, ped) {
  return {
    tech,
    title: ped.title,
    brand: ped.brand,
    tagline: ped.tagline,
    storageKey: ped.storageKey,
    legacyStorageKeys: ped.legacyStorageKeys || [],
    accent: ped.accent || '#ffb000',
    stackLabel: ped.stackLabel || 'THE STACK — your build',
    ranks: ped.ranks || ['SWABBIE', 'DECKHAND', 'BOATSWAIN', 'FIRST MATE', 'QUARTERMASTER', 'HARBOR MASTER'],
    grad: ped.grad || { title: 'SHIPPED', rule: ped.foot && ped.foot.rule },
    sim: ped.simPrompt ? { prompt: ped.simPrompt } : { prompt: '# run the simulation' },
    console: ped.console || { cmd: '$ shipyard status', line: 'all parts laid · every layer earned' },
    egg: ped.egg || null,
    stackSim: ped.stackSim || null,
  };
}

function dataModule(tech, meta, parts, quiz, ped) {
  return '// generated by build/build.mjs — do not hand-edit.\n' +
    '// source: content/' + tech + '-curriculum.md + build/pedagogy/' + tech + '.mjs\n' +
    '// quiz options are shuffled deterministically by build/shuffle.mjs\n' +
    'window.SHIPYARD_DATA={\nmeta:' + JSON.stringify(meta, null, 1) + ',\n' +
    'parts:' + JSON.stringify(parts.map(p => ({ id: p.id, num: p.num, title: p.title, tag: p.tag })), null, 1) + ',\n' +
    'quiz:' + JSON.stringify(quiz, null, 1) + ',\n' +
    'cards:' + JSON.stringify(ped.cards || [], null, 1) + ',\n' +
    'miles:' + JSON.stringify(ped.miles || [], null, 1) + ',\n' +
    'sim:' + JSON.stringify(ped.sim || [], null, 1) +
    (ped.stackInfo ? ',\nstackInfo:' + JSON.stringify(ped.stackInfo, null, 1) : '') +
    '\n};\n';
}

// ================= build one ship =================
async function buildTech(tech, { reslim = false, v2 = false } = {}) {
  const OUT = outFor(tech);
  const pedPath = path.join(__dir, 'pedagogy', tech + '.mjs');
  if (!fs.existsSync(pedPath)) throw new Error('missing pedagogy module: ' + pedPath);
  const ped = (await import(pathToFileURL(pedPath).href + '?t=' + Date.now())).default;

  const mdPath = path.join(CONTENT, tech + '-curriculum.md');
  const haveMd = fs.existsSync(mdPath);

  let parts;
  if (v2) {
    // --v2 migrates an already-built page into the new chrome. There is no
    // markdown source for this content (see repair.mjs) — the prose is lifted
    // straight out of the existing <tech>.html, same as a repair pass, and
    // re-emitted through shellV2()/sectionV2() instead of shell()/section().
    if (!fs.existsSync(OUT.page)) throw new Error('no existing ' + tech + '.html to migrate for --v2');
    parts = extractParts(fs.readFileSync(OUT.page, 'utf8'));
    if (!parts.length) throw new Error('no parts found in ' + tech + '.html for --v2 migration');
  } else if (haveMd && !reslim) {
    parts = parse(fs.readFileSync(mdPath, 'utf8'));
  } else {
    // No markdown available: keep the prose that is already in the page and reuse
    // the part table from the existing data module.
    if (!fs.existsSync(OUT.data)) throw new Error('no markdown and no existing data for ' + tech);
    parts = readData(tech).parts;
    if (!reslim) console.warn('  ! ' + tech + ': content/' + tech + '-curriculum.md not found — reslim only');
  }

  const meta = buildMeta(tech, ped);
  const quiz = shuffleQuiz(ped.quiz || {}, tech);
  fs.writeFileSync(OUT.data, dataModule(tech, meta, parts, quiz, ped));

  let page;
  if (v2) {
    const sections = parts.map((p, i) => sectionV2(p, i, parts, ped)).join('\n\n');
    page = shellV2(meta, ped, parts).replace('#SECTIONS#', sections);
    fs.writeFileSync(OUT.page, page);
  } else if (haveMd && !reslim) {
    const sections = parts.map((p, i) => section(p, i, parts, ped)).join('\n\n');
    page = shell(meta, ped, parts).replace('#SECTIONS#', sections);
    fs.writeFileSync(OUT.page, page);
  } else {
    page = fs.readFileSync(OUT.page, 'utf8');
  }

  const qn = Object.values(quiz).reduce((s, a) => s + a.length, 0);
  console.log(`${tech.padEnd(11)} parts=${parts.length} questions=${qn} cards=${(ped.cards || []).length} ` +
    `miles=${(ped.miles || []).length} | page=${page.length}b` +
    (v2 ? ' (v2)' : (haveMd && !reslim ? '' : ' (reslim)')));
}

// ================= registry =================
export function readData(tech) {
  const file = path.join(ROOT, 'data', tech + '.js');
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  // the data module is a plain assignment to window — no DOM needed
  new Function('window', src).call(sandbox, sandbox.window);
  return sandbox.window.SHIPYARD_DATA;
}

function registry() {
  const entries = [];
  for (const t of SHIPS) {
    if (!fs.existsSync(path.join(ROOT, 'data', t + '.js'))) continue;
    const d = readData(t);
    // count what the thing actually is, rather than regexing the generated source
    const questions = Object.values(d.quiz || {}).reduce((s, a) => s + a.length, 0);
    entries.push({
      id: t,
      brand: d.meta.brand,
      title: d.meta.title,
      tagline: d.meta.tagline,
      accent: d.meta.accent || '#ffb000',
      parts: (d.parts || []).length,
      layers: Math.max((d.parts || []).length - 1, 0),
      questions,
      checkpoints: Object.keys(d.quiz || {}).length,
      cards: (d.cards || []).length,
      miles: (d.miles || []).length,
      file: t + '.html',
    });
  }
  fs.writeFileSync(REGISTRY, JSON.stringify({ generated: new Date().toISOString(), techs: entries }, null, 1));
  console.log('registry:', entries.map(e => `${e.id}(${e.layers}p/${e.questions}q/${e.cards}c)`).join(' '));
}

// ================= main =================
async function main() {
  const reslim = FLAGS.has('--reslim');
  const v2 = FLAGS.has('--v2');
  if (v2 && FLAGS.has('--all')) {
    console.error('--v2 must name a specific ship — it is not wired into --all, so it never touches the other ships by accident');
    process.exit(1);
  }
  const techs = FLAGS.has('--all') ? SHIPS.filter(t => fs.existsSync(path.join(__dir, 'pedagogy', t + '.mjs'))) : NAMED;
  if (!techs.length) {
    console.error('usage: node build/build.mjs <tech> | --all [--reslim] [--v2]');
    process.exit(1);
  }
  for (const t of techs) await buildTech(t, { reslim, v2 });
  registry();
}

if (process.argv[1] && process.argv[1].endsWith('build.mjs')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
