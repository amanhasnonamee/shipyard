// draft.mjs — generate a pedagogy skeleton for a new ship from its markdown
// usage: node build/draft.mjs <tech> [--out <path>]
// reads  archives/<tech>-curriculum.md (structure via mdparse.mjs)
// writes build/pedagogy/<tech>.mjs  — fill the TBD fields, then run build.mjs <tech>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from './mdparse.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');
const ARCH = path.resolve(ROOT, '..');
const TECH = process.argv[2];
if (!TECH) { console.error('usage: node build/draft.mjs <tech>'); process.exit(1); }
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : path.join(__dir, 'pedagogy', TECH + '.mjs');

const mdPath = path.join(ARCH, TECH + '-curriculum.md');
if (!fs.existsSync(mdPath)) { console.error('missing ' + mdPath); process.exit(1); }
const md = fs.readFileSync(mdPath, 'utf8');
const parts = parse(md).filter(p => p.id !== 'p0');
const T = TECH.toUpperCase();

function hint(part) {
  const text = part.body.join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 130);
}

const quizLines = parts.map(p => {
  const h = hint(p);
  const qs = [0, 1, 2, 3].map(() =>
    "      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },");
  return '    ' + p.id + ': [\n' + qs.join('\n') + '\n    ], // ' + p.title + ' — hint: ' + h;
}).join('\n');

const cardLines = [];
for (let i = 1; i <= 18; i++) {
  const tier = i <= 8 ? 1 : i <= 14 ? 2 : 3;
  cardLines.push("    { t: 'TIER " + tier + " - " + (tier === 1 ? 'EXPECTED OF EVERYONE' : tier === 2 ? 'DIFFERENTIATORS' : 'SENIOR SIGNAL') + "', q: '" + i + " \\u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },");
}

const mileLines = [1, 2, 3, 4, 5, 6].map(m =>
  "    { id: 'm" + m + "', title: 'Milestone " + m + " \\u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },").join('\n');

const simLines = [800, 1200, 1400, 1200, 1300, 1000, 1200, 900].map((t, i) =>
  '    { t: ' + t + ', l: "<span class=\\"a\\">step' + (i + 1) + '</span> TBD — one staged line of the idea, ending <span class=\\"ok\\">OK</span>" },').join('\n');

const ped = `// ${TECH} pedagogy — DRAFT from ${TECH}-curriculum.md. Fill every TBD, then: node build/build.mjs ${TECH}
export default {
  title: 'The ${T} Shipyard - ${T}: A First-Principles Curriculum',
  brand: 'THE ${T} SHIPYARD',
  tagline: 'TBD — 3-4 keywords separated by \\u00b7',
  storageKey: 'shipyard:${TECH}:v1',
  accent: null, // palette: emerald #16b981 | violet #a78bfa | coral #ff6b6b | amber #ffb000 (null = amber)

  boot: [
    '<div class="bl">$ shipyard boot --curriculum ${TECH}-first-principles</div>',
    '<div class="bl">STAGE 1: LOADING PARTS 0\u201314 ......... <span style="color:var(--ok)">OK</span></div>',
    '<div class="bl">STAGE 2: MOUNTING DEPTH TAGS .......... <span style="color:var(--ok)">OK</span></div>',
    '<div class="bl"><span class="warn">WARNING: TBD — the one-line warning that sets the tone.</span></div>',
    '<div class="bl">AWAITING CREW \u2014 14 waypoints ahead. <span class="cursor" style="color:var(--accent)">\\u258e</span></div>',
  ],
  h1: '${T}, UNDERSTOOD.<br><span class="wh">NOT JUST SNIPPED.</span>',
  sub: 'TBD — the mission paragraph: learn the mental model <b>deeply</b>, reference the rest, and build the shipyard\\u2019s container as you complete parts. Quizzes earn XP; ranks go from <b>Swabbie</b> to <b>Harbor Master</b>.',
  foot: {
    about: 'The ${T} Shipyard is a faithful interactive conversion of the first-principles ${T} curriculum \\u2014 every concept, table, code block and exercise preserved. Progress lives in your browser (localStorage). Built as a single file \\u2014 copy it anywhere, it runs offline.',
    rule: 'TBD \\u2014 THE ONE RULE: the sentence that collapses the whole topic.',
  },
  chips: { /* pN: ['<span class="m">\\u2605 <b>INTERVIEW GOLD</b></span>'] */ },
  simIn: 'p10',
  deckNote: 'If you can deliver these aloud \\u2014 with the WHAT \\u2192 WHY IT EXISTS \\u2192 ONE CONCRETE CONSEQUENCE shape \\u2014 you are interview-ready. Answer before flipping; nailed cards dim.',
  milesNote: 'Six milestones = six layers of proof, mapped to the curriculum\\u2019s day plan. When all six drop, the shipyard ships your container.',

  quiz: {
${quizLines}
  },

  cards: [
${cardLines.join('\n')}
  ],

  miles: [
${mileLines}
  ],

  sim: [
${simLines}
  ],
};
`;

fs.writeFileSync(OUT, ped);
console.log('draft: ' + parts.length + ' parts -> ' + OUT);
console.log('next: fill TBDs (' + (parts.length * 4) + ' quiz slots, 18 cards, 6 miles, 8 sim steps), then node build/build.mjs ' + TECH);