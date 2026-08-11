// build.mjs — Shipyard curriculum pipeline
// usage: node build.mjs <tech>     tech in: python | javascript | htmlcss | docker
// reads   archives/<tech>-curriculum.md + build/pedagogy/<tech>.mjs
// writes  shipyard/<tech>.html, shipyard/<tech>.slim.html, shipyard/data/<tech>.js, registry.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { esc, inline, term, parse } from './mdparse.mjs';


const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');
const ARCH = path.resolve(ROOT, '..');
const TECH = process.argv[2];
if (!TECH) { console.error('usage: node build.mjs <tech>'); process.exit(1); }

const OUT = {
  page: path.join(ROOT, TECH + '.html'),
  slim: path.join(ROOT, TECH + '.slim.html'),
  data: path.join(ROOT, 'data', TECH + '.js'),
  registry: path.join(ROOT, 'registry.json'),
};

// md => parts + term rendering now live in mdparse.mjs (shared with draft.mjs)

// ================= section assembly =================
function medal(tag) {
  if (!tag) return '';
  return '<span class="m">TAG <b>' + esc(tag) + '</b></span>';
}
function quizBlock(id) {
  return '<div class="quiz" data-part="' + id + '"><span class="qlbl">Checkpoint — hold yourself to it</span><div class="qscore">SCORE <b>—</b></div><div class="qwrap"></div><div class="qres"></div></div>';
}
const SIM_BLOCK =
  '<div class="term"><div class="termhead"><span class="td td1"></span><span class="td td2"></span><span class="td td3"></span><span class="tname">simulator — click RUN</span></div>' +
  '<pre id="simOut"><span cl/></pre>' +
  '<div class="stack-controls" style="margin:0;padding:10px 16px;border-top:1px solid var(--line)"><button class="btn sm" id="simRun">&#9654; RUN</button><button class="btn sm ok" id="simReset">RESET</button></div></div>';

function section(part, i, parts, ped) {
  const prev = parts[i - 1]; const next = parts[i + 1];
  const chips = (ped.chips && ped.chips[part.id]) || [];
  let body = part.body.join('\n\n');
  if (ped.sim && ped.simIn === part.id) body += '\n\n' + SIM_BLOCK;
  if (ped.quiz && ped.quiz[part.id]) body += '\n\n' + quizBlock(part.id);
  if (part.id === 'p13') body += '\n\n<p>' + (ped.deckNote || 'You&#39;ve already built the answers; this consolidates them. <b>Answer each question aloud before flipping the card.</b> Nail a card and it dims. Every card maps to the section where you built the answer.') + '</p>\n<div class="deck" id="deck"><!-- cards injected by JS --></div>';
  if (part.id === 'p14') body += '\n\n<p>' + (ped.milesNote || 'Six milestones = six layers of proof. Check each off honestly — when all six drop, <b>the shipyard ships your container</b>.') + '</p>\n<div class="mlist" id="mlist"><!-- milestones injected by JS --></div>';
  const crumbs = [];
  if (prev) crumbs.push('<a href="#' + prev.id + '">&larr; ' + prev.num + ' · ' + esc(prev.title.toUpperCase()) + '</a>');
  if (next) crumbs.push('<a class="next" href="#' + next.id + '">' + next.num + ' · ' + esc(next.title.toUpperCase()) + ' &rarr;</a>');
  return '<section class="part" id="' + part.id + '">\n' +
    '  <div class="phead"><div class="pnum">' + part.num + '</div>\n' +
    '    <div><div class="ptitle">' + esc(part.title) + '</div>\n' +
    '    <div class="pmeta">' + medal(part.tag) + chips.join('') + '</div></div>\n' +
    '    <div class="pactions"><button class="btn sm" data-done="' + part.id + '">MARK COMPLETE</button></div>\n' +
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

function shell(meta, ped) {
  return '<!DOCTYPE html>\n<html lang="en" data-render="img">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(meta.title) + '">\n' +
    '<meta property="og:description" content="' + esc(meta.tagline) + ' — a first-principles interactive curriculum, one portable HTML file, runs offline.">\n' +
    '<meta property="og:image" content="assets/og/' + meta.tech + '.png">\n' +
    '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Cpath fill=%22' + (meta.accent || '#ffb000').replace('#', '%23') + '%22 d=%22M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z%22/%3E%3C/svg%3E">\n' +
    '<meta name="contract" content="shipyard-' + meta.tech + '@1">\n' +
    '<title>' + esc(meta.title) + '</title>\n' +
    '<link rel="stylesheet" href="assets/shipyard.css">\n</head>\n<body>\n' +
    '<div id="scanlines"></div><div id="vignette"></div>\n<button id="burger">&#9776; MAP</button><div id="backdrop"></div>\n<div id="app">\n' +
    '<aside id="dock">\n  <div class="brand">\n' +
    '    <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">\n' +
    '      <path fill="var(--accent)" d="M12 3c4 0 7 2.5 9 8-.3 3-1.2 5.5-2 7.5-.6 1.4-1 2-2.5 2h-9c-1.5 0-1.9-.6-2.5-2C4.2 16.5 3.3 14 3 11c2-5.5 5-8 9-8z"/>\n' +
    '      <rect x="7" y="11" width="2" height="2" fill="var(--bg)"/><rect x="12" y="11" width="2" height="2" fill="var(--bg)"/><rect x="17" y="11" width="2" height="2" fill="var(--bg)"/>\n' +
    '    </svg>\n    <div><div class="bname">' + esc(meta.brand) + '</div><div class="bsub">' + esc(meta.tagline) + '</div></div>\n  </div>\n\n' +
    '  <div class="rankbox">\n    <div class="rk" id="rankNow">SWABBIE</div>\n    <div class="rkxp" id="rankXp"></div>\n    <div class="prbar"><i id="rankBar"></i></div>\n  </div>\n\n' +
    '  <div class="stackbox">\n    <div class="st"><span>THE STACK — your container</span><span id="stackCount">0/14</span></div>\n    <div id="stackMini"></div>\n    <div id="psRow"><b>$ docker ps</b><br><span id="psRow2">—</span></div>\n  </div>\n\n' +
    '  <nav class="docknav" id="docknav"></nav>\n\n' + LEGEND + '\n\n  <div class="dockfoot" id="dockfoot"></div>\n</aside>\n\n<main>\n' +
    '<section class="hero" id="part0">\n  <div class="boot">' + ped.boot.join('\n    ') + '\n  </div>\n' +
    '  <h1>' + ped.h1 + '</h1>\n  <p class="sub">' + ped.sub + '</p>\n' +
    '  <div class="hstatus">\n    <div class="hchip">RANK <b id="hRank">SWABBIE</b></div>\n' +
    '    <div class="hchip">XP <b id="hXp">0</b></div>\n    <div class="hchip">LAYERS <b id="hLayers">0/14</b></div>\n' +
    '    <div class="hchip">QUIZZES CLEARED <b class="ok" id="hQuizzes">0</b></div>\n  </div>\n' +
    '  <div id="voyageHead">THE VOYAGE — 14 WAYPOINTS</div>\n  <div class="voyage" id="voyage"></div>\n</section>\n\n' +
    '#SECTIONS#' +
    '<footer>\n  <b>ABOUT THIS BUILD:</b> ' + ped.foot.about + '<br>\n  <b>THE ONE RULE:</b> ' + ped.foot.rule + '\n</footer>\n</main>\n</div>\n' +
    '<div id="grad"><div class="gterm"><div class="ghead">&#9650; SHIPYARD DEPLOYMENT — ALL MILESTONES CROSSED</div><div class="gbody"></div></div></div>\n' +
    '<script src="data/' + meta.tech + '.js"></script>\n<script src="assets/shipyard.js"></script>\n</body>\n</html>';
}

// ================= slim contractor =================
function slimify(page, tech) {
  const css = fs.readFileSync(path.join(ROOT, 'assets', 'shipyard.css'), 'utf8');
  const data = fs.readFileSync(path.join(ROOT, 'data', tech + '.js'), 'utf8');
  const eng = fs.readFileSync(path.join(ROOT, 'assets', 'shipyard.js'), 'utf8');
  let out = page
    .replace(/<link rel="stylesheet" href="assets\/shipyard\.css">/, '<style>\n' + css + '\n</style>')
    .replace('<script src="data/' + tech + '.js"></script>', '<script>\n' + data + '\n</script>')
    .replace('<script src="assets/shipyard.js"></script>', '<script>\n' + eng + '\n</script>');
  if (!/<html[^>]*data-render/.test(out)) out = out.replace(/<html lang="en">/, '<html lang="en" data-render="img">');
  return out;
}

// ================= build =================
async function main() {
  if (TECH === 'docker') {
    const page = fs.readFileSync(OUT.page, 'utf8');
    fs.writeFileSync(OUT.slim, slimify(page, TECH));
    console.log('docker: contracted docker.slim.html from docker.html');
    registry(); return;
  }
  const pedPath = path.join(__dir, 'pedagogy', TECH + '.mjs');
  const ped = (await import(pathToFileURL(pedPath).href)).default;
  const md = fs.readFileSync(path.join(ARCH, TECH + '-curriculum.md'), 'utf8');
  const parts = parse(md);
  const sections = parts.map((p, i) => section(p, i, parts, ped)).join('\n\n');
  const meta = { tech: TECH, title: ped.title, brand: ped.brand, tagline: ped.tagline, storageKey: ped.storageKey, accent: ped.accent || null };

  const dataJs =
    '// generated by build.mjs from ' + TECH + '-curriculum.md + build/pedagogy/' + TECH + '.mjs - do not hand-edit\n' +
    'window.SHIPYARD_DATA={\nmeta:' + JSON.stringify(meta, null, 1) + ',\n' +
    'parts:' + JSON.stringify(parts.map(p => ({ id: p.id, num: p.num, title: p.title, tag: p.tag })), null, 1) + ',\n' +
    'quiz:' + JSON.stringify(ped.quiz || {}, null, 1) + ',\n' +
    'cards:' + JSON.stringify(ped.cards || [], null, 1) + ',\n' +
    'miles:' + JSON.stringify(ped.miles || [], null, 1) + ',\n' +
    'sim:' + JSON.stringify(ped.sim || [], null, 1) + '\n' +
    (ped.stackInfo ? ',\nstackInfo:' + JSON.stringify(ped.stackInfo, null, 1) + '\n' : '\n') +
    '};\n';

  fs.writeFileSync(OUT.data, dataJs);
  const page = shell(meta, ped).replace('#SECTIONS#', sections);
  fs.writeFileSync(OUT.page, page);
  fs.writeFileSync(OUT.slim, slimify(page, TECH));
  console.log(TECH + ': parts=' + parts.length + ' codeblocks/quizmounts/sim=' +
    (page.match(/<div class="term">/g) || []).length + '/' + (page.match(/data-part="p\d+"/g) || []).length + '/' + (ped.sim ? 1 : 0) +
    ' | page=' + page.length + 'b slim=' + fs.statSync(OUT.slim).size + 'b data=' + dataJs.length + 'b');
  registry();
}
function registry() {
  const entries = [];
  for (const t of ['docker', 'python', 'javascript', 'htmlcss', 'sql']) {
    const dp = path.join(ROOT, 'data', t + '.js');
    if (!fs.existsSync(dp)) continue;
    const raw = fs.readFileSync(dp, 'utf8');
const m = raw.match(/["']?brand["']?\s*:\s*"([^"]+)"/); const tt = raw.match(/["']?title["']?\s*:\s*"([^"]+)"/); const tg = raw.match(/["']?tagline["']?\s*:\s*"([^"]+)"/);
  const ac = raw.match(/["']?accent["']?\s*:\s*"([^"]+)"/);
    entries.push({ id: t, brand: m ? m[1] : t, title: tt ? tt[1] : t, tagline: tg ? tg[1] : '',
      accent: ac ? ac[1] : '#ffb000',
      parts: (raw.match(/["']?id["']?\s*:\s*"p\d+"/g) || []).length,
      quiz: (raw.match(/["']?q["']?\s*:\s*"/g) || []).length,
      file: t + '.html' });
  }
  fs.writeFileSync(OUT.registry, JSON.stringify({ generated: new Date().toISOString(), techs: entries }, null, 1));
  console.log('registry:', entries.map(e => e.id + '(' + e.parts + 'p/' + e.quiz + 'q)').join(' '));
}
main().catch(e => { console.error(e); process.exit(1); });