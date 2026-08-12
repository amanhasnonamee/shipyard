// test.mjs — regression tests for the Shipyard fleet.
//
// usage: node build/test.mjs            static checks only (no dependencies)
//        node build/test.mjs --dom      also boot each slim page in jsdom
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
const DOM = process.argv.includes('--dom');

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
function mileCountFrom(doc) { return doc.querySelectorAll('#mlist .mile.done').length; }

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
    const html = fs.readFileSync(path.join(ROOT, tech + '.slim.html'), 'utf8');
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

// ================================================================ dom tests
if (DOM) {
  const { JSDOM } = await import('jsdom');

  for (const tech of SHIPS) {
    const html = fs.readFileSync(path.join(ROOT, tech + '.slim.html'), 'utf8');
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://local.test/' });
    const win = dom.window;
    await new Promise(r => { win.addEventListener('load', r); setTimeout(r, 1500); });

    const engine = win.__SHIPYARD_ENGINE__;

    check(`${tech}: engine booted without errors`, () => {
      assert(engine, 'engine did not expose its test seam');
      if (isV2(html)) {
        // v2 has one consolidated sidebar path instead of a separate nav list
        // and voyage grid — assert on that, and that exactly one .part shows
        assert(win.document.querySelectorAll('#stackMini .layer').length >= 15, 'sidebar path did not render');
        assert(win.document.querySelectorAll('.part').length >= 15, 'parts did not render');
        const visible = [...win.document.querySelectorAll('.part')].filter(p => p.style.display !== 'none');
        assert(visible.length === 1, `expected exactly 1 visible part, got ${visible.length}`);
      } else {
        assert(win.document.querySelectorAll('.navitem').length >= 15, 'nav did not render');
        assert(win.document.querySelectorAll('.waypoint').length >= 15, 'voyage did not render');
      }
      assert(win.document.querySelectorAll('.card').length === 18, 'deck did not render');
      assert(win.document.querySelectorAll('.mile').length === 6, 'milestones did not render');
      return `${win.document.querySelectorAll('.opt').length} quiz options rendered`;
    });

    // THE regression: answering every question correctly used to score 25%
    check(`${tech}: a perfect quiz scores 100%`, () => {
      const data = win.SHIPYARD_DATA;
      const pid = Object.keys(data.quiz)[0];
      data.quiz[pid].forEach((q, i) => engine.answer(pid, i, q.a));
      const pct = engine.pct(pid);
      assert(pct === 100, `scored ${pct}% after answering everything correctly`);
      assert(engine.cleared(pid), 'checkpoint did not clear at 100%');
      return `${pid} = ${pct}%`;
    });

    check(`${tech}: a wrong answer is scored as wrong`, () => {
      const data = win.SHIPYARD_DATA;
      const pid = Object.keys(data.quiz)[1];
      const qs = data.quiz[pid];
      qs.forEach((q, i) => engine.answer(pid, i, i === 0 ? (q.a + 1) % q.o.length : q.a));
      const expected = Math.round((qs.length - 1) / qs.length * 100);
      assert(engine.pct(pid) === expected, `expected ${expected}%, got ${engine.pct(pid)}%`);
      return `${engine.pct(pid)}%`;
    });

    check(`${tech}: XP cannot be farmed by toggling`, () => {
      const doc = win.document;
      const btn = doc.querySelector('[data-done]');
      const before = engine.xp();
      for (let i = 0; i < 10; i++) { btn.click(); btn.click(); }
      const after = engine.xp();
      assert(after === before, `XP drifted from ${before} to ${after} after 10 toggles`);
      const mile = doc.querySelector('.mile');
      const b2 = engine.xp();
      for (let i = 0; i < 10; i++) { mile.click(); mile.click(); }
      assert(engine.xp() === b2, 'milestone toggling farms XP');
      return `stable at ${after}`;
    });

    check(`${tech}: rank ladder tops out within reach`, () => {
      const ranks = engine.ranks();
      const max = engine.maxXp();
      assert(ranks[ranks.length - 1][0] <= max,
        `top rank needs ${ranks[ranks.length - 1][0]} XP but only ${max} exists`);
      return `${max} XP max, top rank at ${ranks[ranks.length - 1][0]}`;
    });

    check(`${tech}: graduation is not reachable by checking boxes`, () => {
      const doc = win.document;
      doc.querySelectorAll('.mile').forEach(m => { if (m.getAttribute('aria-checked') !== 'true') m.click(); });
      assert(!engine.graduationReady(),
        'graduated on milestones alone — parts and checkpoints were not required');
      return 'gated on parts + checkpoints too';
    });

    check(`${tech}: simulator prompt is this ship's, not docker's`, () => {
      const out = win.document.getElementById('simOut');
      if (!out) return 'no simulator on this ship';
      const text = out.textContent;
      assert(text.trim().length > 0, 'simulator placeholder never painted');
      if (tech !== 'docker') assert(!/docker/i.test(text), `simulator still shows "${text.trim().slice(0, 40)}"`);
      return text.trim().slice(0, 44);
    });

    check(`${tech}: progress tools are present`, () => {
      const doc = win.document;
      // v2 dropped the CRT scanline toggle entirely — no fxToggle to check for
      const ids = ['ptExport', 'ptImport', 'ptReset'].concat(isV2(html) ? [] : ['fxToggle']);
      for (const id of ids) {
        assert(doc.getElementById(id), `missing #${id}`);
      }
    });

    check(`${tech}: milestones render with anchorable ids`, () => {
      const doc = win.document;
      const anchors = doc.querySelectorAll('#mlist .mile[id^="mile-"]');
      const miles = win.SHIPYARD_DATA.miles;
      assert(anchors.length === miles.length, `${anchors.length}/${miles.length} milestones have a jump target`);
    });

    check(`${tech}: sidebar milestone tracker stays in sync`, () => {
      const doc = win.document;
      const miles = win.SHIPYARD_DATA.miles;
      const mini = doc.querySelectorAll('#mileMini .mmini');
      assert(mini.length === miles.length, `${mini.length} mini rows for ${miles.length} milestones`);

      // toggling in the full Part 14 list must update the compact sidebar copy —
      // there are two views of one state, not two places for them to drift apart.
      // Don't assume the starting state: earlier checks in this suite (graduation
      // gating) may have already toggled milestones on this same `win`.
      const fullFirst = doc.querySelector('#mlist .mile');
      const miniFirst = doc.querySelector('#mileMini .mmini');
      const before = fullFirst.classList.contains('done');

      fullFirst.click();
      const after = fullFirst.classList.contains('done');
      assert(after !== before, 'click did not toggle the full milestone');
      assert(miniFirst.classList.contains('done') === after, 'sidebar row did not follow the toggle');
      assert(doc.getElementById('mileCount').textContent === `${mileCountFrom(doc)}/${miles.length}`,
        `mileCount reads "${doc.getElementById('mileCount').textContent}"`);

      fullFirst.click(); // restore, so later assertions on this `win` see a clean slate
      assert(miniFirst.classList.contains('done') === before, 'sidebar row did not revert with the untoggle');
      return `${mini.length} rows synced`;
    });

    win.close();
  }

  // ------------------------------------------------- persistence across loads
  // Answered questions used to render as unanswered after a refresh, because
  // the restore path compared stored 1/0 against true/false.
  for (const tech of SHIPS) {
    const html = fs.readFileSync(path.join(ROOT, tech + '.slim.html'), 'utf8');
    const first = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://local.test/' });
    await new Promise(r => { first.window.addEventListener('load', r); setTimeout(r, 1500); });

    const data = first.window.SHIPYARD_DATA;
    const key = data.meta.storageKey;
    const qz = first.window.document.querySelector('.quiz');
    const pid = qz.getAttribute('data-part');
    data.quiz[pid].forEach((q, i) => {
      const b = qz.querySelector(`.opt[data-q="${i}"][data-o="${q.a}"]`);
      if (b) b.click();
    });
    const saved = first.window.localStorage.getItem(key);
    first.window.close();

    const reload = new JSDOM(html, {
      runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://local.test/',
      beforeParse(w) { w.localStorage.setItem(key, saved); },
    });
    await new Promise(r => { reload.window.addEventListener('load', r); setTimeout(r, 1500); });
    const doc = reload.window.document;
    const qz2 = doc.querySelector('.quiz');

    check(`${tech}: answered questions survive a reload`, () => {
      const opts = qz2.querySelectorAll('.opt').length;
      const disabled = qz2.querySelectorAll('.opt[disabled]').length;
      assert(disabled === opts, `${disabled}/${opts} options restored as answered`);
      assert(qz2.querySelectorAll('.qe.show').length > 0, 'explanations were not restored');
      assert(qz2.querySelector('.qscore b').textContent === '100%', 'score badge not restored');
      assert(qz2.querySelector('.qres').classList.contains('show'), 'verdict banner not restored');
      return `${disabled} options, banner restored`;
    });

    check(`${tech}: retake clears the attempt but keeps best and XP`, () => {
      const xpBefore = reload.window.__SHIPYARD_ENGINE__.xp();
      qz2.querySelector('.retake').click();
      assert(qz2.querySelectorAll('.opt[disabled]').length === 0, 'options were not re-enabled');
      assert(qz2.querySelector('.qscore b').textContent === '100%', 'best score was lost');
      assert(reload.window.__SHIPYARD_ENGINE__.xp() === xpBefore, 'retake changed XP');
      return `best kept, XP steady at ${xpBefore}`;
    });

    reload.window.close();
  }
}

// ==================================================================== report
const width = Math.max(...results.map(r => r[1].length));
for (const [status, name, detail] of results) {
  const mark = status === 'PASS' ? '  ok  ' : '  FAIL';
  console.log(`${mark} ${name.padEnd(width)} ${detail ? '· ' + detail : ''}`);
}
console.log(`\n${passed} passed, ${failed} failed${DOM ? '' : '  (run with --dom for engine tests)'}`);
process.exit(failed ? 1 : 0);
