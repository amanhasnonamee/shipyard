// rest-api pedagogy — DRAFT from rest-api-curriculum.md. Fill every TBD, then: node build/build.mjs rest-api
export default {
  title: 'The REST-API Shipyard - REST-API: A First-Principles Curriculum',
  brand: 'THE REST-API SHIPYARD',
  tagline: 'TBD — 3-4 keywords separated by \u00b7',
  storageKey: 'shipyard:rest-api:v1',
  accent: null, // palette: emerald #16b981 | violet #a78bfa | coral #ff6b6b | amber #ffb000 (null = amber)

  boot: [
    '<div class="bl">$ shipyard boot --curriculum rest-api-first-principles</div>',
    '<div class="bl">STAGE 1: LOADING PARTS 0–14 ......... <span style="color:var(--ok)">OK</span></div>',
    '<div class="bl">STAGE 2: MOUNTING DEPTH TAGS .......... <span style="color:var(--ok)">OK</span></div>',
    '<div class="bl"><span class="warn">WARNING: TBD — the one-line warning that sets the tone.</span></div>',
    '<div class="bl">AWAITING CREW — 14 waypoints ahead. <span class="cursor" style="color:var(--accent)">\u258e</span></div>',
  ],
  h1: 'REST-API, UNDERSTOOD.<br><span class="wh">NOT JUST SNIPPED.</span>',
  sub: 'TBD — the mission paragraph: learn the mental model <b>deeply</b>, reference the rest, and build the shipyard\u2019s container as you complete parts. Quizzes earn XP; ranks go from <b>Swabbie</b> to <b>Harbor Master</b>.',
  foot: {
    about: 'The REST-API Shipyard is a faithful interactive conversion of the first-principles REST-API curriculum \u2014 every concept, table, code block and exercise preserved. Progress lives in your browser (localStorage). Built as a single file \u2014 copy it anywhere, it runs offline.',
    rule: 'TBD \u2014 THE ONE RULE: the sentence that collapses the whole topic.',
  },
  chips: { /* pN: ['<span class="m">\u2605 <b>INTERVIEW GOLD</b></span>'] */ },
  simIn: 'p10',
  deckNote: 'If you can deliver these aloud \u2014 with the WHAT \u2192 WHY IT EXISTS \u2192 ONE CONCRETE CONSEQUENCE shape \u2014 you are interview-ready. Answer before flipping; nailed cards dim.',
  milesNote: 'Six milestones = six layers of proof, mapped to the curriculum\u2019s day plan. When all six drop, the shipyard ships your container.',

  quiz: {
    p1: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Where REST Came From — hint: Almost every REST "rule" people repeat is a consequence of a specific historical problem. Knowing the problems turns arbitrary con
    p2: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // The Core Mental Model — hint: Five ideas. This is the most important section in the document. Idea 1: A resource is a *thing*, and what you receive is a *repres
    p3: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // HTTP: The Substrate REST Is Built On — hint: REST is a way of using HTTP well. So you cannot be good at REST without genuinely knowing HTTP. This part is the foundation everyt
    p4: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Resources and URL Design — hint: URL design is where most APIs reveal whether their author understood REST. It's also cheap to get right and expensive to change la
    p5: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Representations, Errors, and Validation — hint: 5.1 Designing response bodies [DEEP] Decisions to make once and apply everywhere — inconsistency here is what makes an API exhaust
    p6: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Collections, Evolution, and Versioning — hint: 6.1 Pagination [DEEP — including why the obvious way is wrong] Never return an unbounded collection. It will be small in developme
    p7: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Authentication, Authorization, and CORS — hint: Two different questions, constantly conflated: authentication is *who are you*; authorization is *what may you do*. 401 answers th
    p8: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Real Project: Build One API, Consume Another — hint: Two halves, because designing an API and living with someone else's are different skills and each teaches what the other misses. 8
    p9: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Debugging and Testing Playbook — hint: 9.1 The debugging decision tree Always establish where the failure is before guessing why. Work outward from the simplest thing th
    p10: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Internals: What Actually Happens on the Wire — hint: Return here after Part 8. This upgrades Part 3's model to mechanism. 10.1 The full journey of one API call GET https://api.example
    p11: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Production: Caching, Idempotency, Rate Limits, Security, Observability — hint: 11.1 Caching [DEEP — the highest-leverage thing most APIs ignore] A cache hit is infinitely faster than any optimization, because 
    p12: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // When REST Is and Isn't the Right Choice — hint: Being able to argue against your default is a mark of real understanding. REST over HTTP is a strong default when: you're building
    p13: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Interview Preparation — hint: Tier 1 — expected of everyone: What is REST? (Part 1 — "an architectural style with constraints," not "an API that returns JSON") 
    p14: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Milestones and Self-Assessment — hint: Milestone 1 — Model (Parts 1–2). Pass: the five checkpoint questions in Part 2, unaided; name Fielding's constraints and what stat
  },

  cards: [
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '1 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '2 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '3 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '4 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '5 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '6 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '7 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 1 - EXPECTED OF EVERYONE', q: '8 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 2 - DIFFERENTIATORS', q: '9 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 2 - DIFFERENTIATORS', q: '10 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 2 - DIFFERENTIATORS', q: '11 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 2 - DIFFERENTIATORS', q: '12 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 2 - DIFFERENTIATORS', q: '13 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 2 - DIFFERENTIATORS', q: '14 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 3 - SENIOR SIGNAL', q: '15 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 3 - SENIOR SIGNAL', q: '16 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 3 - SENIOR SIGNAL', q: '17 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
    { t: 'TIER 3 - SENIOR SIGNAL', q: '18 \u25b6 TBD — write the question', a: 'TBD — model answer (cite part)' },
  ],

  miles: [
    { id: 'm1', title: 'Milestone 1 \u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },
    { id: 'm2', title: 'Milestone 2 \u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },
    { id: 'm3', title: 'Milestone 3 \u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },
    { id: 'm4', title: 'Milestone 4 \u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },
    { id: 'm5', title: 'Milestone 5 \u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },
    { id: 'm6', title: 'Milestone 6 \u25b6 TBD', pass: 'Pass: TBD. <b>(parts; days)</b>' },
  ],

  sim: [
    { t: 800, l: "<span class=\"a\">step1</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 1200, l: "<span class=\"a\">step2</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 1400, l: "<span class=\"a\">step3</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 1200, l: "<span class=\"a\">step4</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 1300, l: "<span class=\"a\">step5</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 1000, l: "<span class=\"a\">step6</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 1200, l: "<span class=\"a\">step7</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
    { t: 900, l: "<span class=\"a\">step8</span> TBD — one staged line of the idea, ending <span class=\"ok\">OK</span>" },
  ],
};
