// test.mjs — regression tests for the Shipyard fleet.
//
// usage: node build/test.mjs            static checks (no dependencies, no browser)
//
// Every assertion here corresponds to a bug that actually shipped. The quiz
// scoring bug in particular sat in production across six ships and would have
// been caught by the first test below.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditQuiz } from './lint-quiz.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHIPS = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry.json'), 'utf8')).techs.map(t => t.id);

let passed = 0, failed = 0;
const results = [];
function check(name, fn) {
  try {
    const detail = fn();
    passed++; results.push(['PASS', name, detail || '']);
  } catch (e) {
    failed++; results.push(['FAIL', name, e.message]);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// v2 ships (currently just python, mid-migration — see design/ui-overhaul-mockup.html)
// use a one-part-at-a-time layout with a different chrome contract: no docknav/
// voyage grid (`.navitem`/`.waypoint`), no `.milebox` (it's `.milegroup` now),
// no CRT toggle (`fxToggle`), and a separate engine/CSS file. Detect it from the
// page's own contract tag rather than hardcoding a ship name, so this keeps
// working once more ships migrate.
function isV2(html) { return /<meta name="contract" content="shipyard-[\w-]+@3"/.test(html); }

function readData(tech) {
  const src = fs.readFileSync(path.join(ROOT, 'data', tech + '.js'), 'utf8');
  const sandbox = { window: {} };
  new Function('window', src).call(sandbox, sandbox.window);
  return sandbox.window.SHIPYARD_DATA;
}

// ============================================================ data integrity
for (const tech of SHIPS) {
  const d = readData(tech);

  check(`${tech}: answer indices are in range`, () => {
    let n = 0;
    for (const [pid, qs] of Object.entries(d.quiz)) {
      qs.forEach((q, i) => {
        assert(Number.isInteger(q.a), `${pid} Q${i + 1}: answer is not an integer`);
        assert(q.a >= 0 && q.a < q.o.length, `${pid} Q${i + 1}: answer ${q.a} outside 0..${q.o.length - 1}`);
        assert(q.o.length >= 3, `${pid} Q${i + 1}: only ${q.o.length} options`);
        assert(q.e && q.e.length > 10, `${pid} Q${i + 1}: missing explanation`);
        n++;
      });
    }
    return `${n} questions`;
  });

  check(`${tech}: no duplicate options within a question`, () => {
    for (const [pid, qs] of Object.entries(d.quiz)) {
      qs.forEach((q, i) => {
        const seen = new Set(q.o.map(o => o.trim().toLowerCase()));
        assert(seen.size === q.o.length, `${pid} Q${i + 1} repeats an option`);
      });
    }
  });

  // The tell that made javascript and htmlcss 100% guessable by pressing A.
  check(`${tech}: answers are not clustered on one option`, () => {
    const r = auditQuiz(d.quiz);
    assert(r.positionRate <= 0.45,
      `pressing ${r.positionLetter} every time scores ${(r.positionRate * 100).toFixed(0)}%`);
    return `best single letter ${(r.positionRate * 100).toFixed(0)}%`;
  });

  check(`${tech}: milestone ids are unique`, () => {
    const ids = d.miles.map(m => m.id);
    assert(new Set(ids).size === ids.length, 'duplicate milestone id');
    return `${ids.length} milestones`;
  });

  check(`${tech}: per-ship chrome is present in meta`, () => {
    assert(d.meta.ranks && d.meta.ranks.length >= 2, 'no rank ladder');
    assert(d.meta.grad && d.meta.grad.title, 'no graduation title');
    assert(d.meta.sim && d.meta.sim.prompt, 'no simulator prompt');
    assert(d.meta.console && d.meta.console.cmd, 'no console line');
    assert(d.meta.storageKey && d.meta.storageKey.includes(tech), 'storage key not namespaced');
    return d.meta.storageKey;
  });
}

// ==================================================== no cross-ship leakage
// The shared engine used to hardcode Docker: the Python ship's simulator reset
// to `docker run`, its graduation said CONTAINER DEPLOYED, and rank 5 of 6 was
// DOCKER CAPTAIN.
for (const tech of SHIPS.filter(t => t !== 'docker')) {
  check(`${tech}: no docker leakage in the page`, () => {
    const html = fs.readFileSync(path.join(ROOT, tech + '.html'), 'utf8');
    const d = readData(tech);
    const hay = [
      JSON.stringify(d.meta),
      ...Object.values(d.quiz).flat().map(q => ''),   // quiz prose may legitimately mention docker
    ].join(' ');
    for (const word of ['docker', 'container is just a process', 'WHALE MODE', 'DOCKER CAPTAIN']) {
      assert(!hay.toLowerCase().includes(word.toLowerCase()),
        `meta still mentions "${word}"`);
    }
    // the engine itself must be curriculum-neutral — check whichever engine
    // this ship actually loads (v1 shipyard.js, or v2 for migrated ships)
    const engineFile = isV2(html) ? 'shipyard-v2.js' : 'shipyard.js';
    const engine = fs.readFileSync(path.join(ROOT, 'assets', engineFile), 'utf8');
    assert(!/docker/i.test(engine), `assets/${engineFile} still mentions docker`);
    assert(!/whale/i.test(engine), `assets/${engineFile} still mentions whales`);
    return 'clean';
  });
}

// ============================================================ page structure
for (const tech of SHIPS) {
  const html = fs.readFileSync(path.join(ROOT, tech + '.html'), 'utf8');

  check(`${tech}: ordered lists are not fragmented`, () => {
    const splits = (html.match(/<\/ul>\s*<ul>/g) || []).length + (html.match(/<\/ol>\s*<ol>/g) || []).length;
    assert(splits === 0, `${splits} adjacent single-item lists — ordered lists will restart at 1`);
    return `${(html.match(/<ol>/g) || []).length} ordered lists`;
  });

  check(`${tech}: heading levels do not skip`, () => {
    const levels = [...html.matchAll(/<h([1-6])\b/g)].map(m => Number(m[1]));
    assert(levels.filter(l => l === 1).length === 1, 'expected exactly one h1');
    let prev = 1;
    for (const l of levels) {
      assert(l <= prev + 1, `jumped from h${prev} to h${l}`);
      prev = l;
    }
    return `h1..h${Math.max(...levels)}`;
  });

  check(`${tech}: part titles are headings, not divs`, () => {
    assert(!/<div class="ptitle"/.test(html), 'ptitle is still a div — screen readers cannot navigate parts');
    const n = (html.match(/<h2 class="ptitle"/g) || []).length;
    assert(n >= 15, `only ${n} part-title headings`);
    return `${n} parts`;
  });

  check(`${tech}: no malformed markup from the sim block`, () => {
    assert(!html.includes('<span cl/>'), 'the <span cl/> fragment is still there');
  });

  check(`${tech}: has a meta description`, () => {
    assert(/<meta name="description" content="[^"]{40,}"/.test(html), 'missing or too-short description');
  });

  check(`${tech}: interactive controls are reachable`, () => {
    assert(/class="skiplink"/.test(html), 'no skip link');
    const bare = (html.match(/<button(?![^>]*type=)/g) || []).length;
    assert(bare === 0, `${bare} buttons without an explicit type`);
  });

  check(`${tech}: milestones have a sidebar tracker`, () => {
    // the .mile rows themselves are injected by JS (see the --dom check below for
    // the rendered anchors); the static page only needs to carry the mount points.
    // v2's sidebar groups this under .milegroup instead of a standalone .milebox.
    if (isV2(html)) assert(/class="milegroup"/.test(html), 'no .milegroup in the sidebar');
    else assert(/class="milebox"/.test(html), 'no .milebox in the sidebar');
    assert(/id="mileMini"/.test(html), 'no #mileMini mount point');
    assert(/id="mileCount"/.test(html), 'no #mileCount readout');
  });
}

// The scrollbar-stranded-in-empty-space bug: `main` was capped at 1060px but
// left-aligned in a 1fr grid track with no margin:auto, so on wide viewports
// the content sat flush against the sidebar while the browser's scrollbar sat
// at the true (far) right edge, with ~550px of dead air between them.
check('layout: #app and main are centered, not left-stranded', () => {
  const css = fs.readFileSync(path.join(ROOT, 'assets', 'shipyard.css'), 'utf8');
  const appRule = (css.match(/#app\{[^}]*\}/) || [''])[0];
  const mainRule = (css.match(/\nmain\{[^}]*\}/) || [''])[0];
  assert(/margin:0 auto/.test(appRule), '#app has no margin:0 auto — will hug the left edge on wide screens');
  assert(/max-width/.test(appRule), '#app has no max-width — will stretch edge to edge');
  assert(/margin:0 auto/.test(mainRule), 'main has no margin:0 auto — will sit flush against the sidebar');
});

// ==================================================================== report
const width = Math.max(...results.map(r => r[1].length));
for (const [status, name, detail] of results) {
  const mark = status === 'PASS' ? '  ok  ' : '  FAIL';
  console.log(`${mark} ${name.padEnd(width)} ${detail ? '· ' + detail : ''}`);
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
