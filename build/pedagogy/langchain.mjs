// langchain pedagogy — DRAFT from langchain-curriculum.md. Fill every TBD, then: node build/build.mjs langchain
export default {
  title: 'The LANGCHAIN Shipyard - LANGCHAIN: A First-Principles Curriculum',
  brand: 'THE LANGCHAIN SHIPYARD',
  tagline: 'TBD — 3-4 keywords separated by \u00b7',
  storageKey: 'shipyard:langchain:v1',
  accent: null, // palette: emerald #16b981 | violet #a78bfa | coral #ff6b6b | amber #ffb000 (null = amber)

  boot: [
    '<div class="bl">$ shipyard boot --curriculum langchain-first-principles</div>',
    '<div class="bl">STAGE 1: LOADING PARTS 0–14 ......... <span style="color:var(--ok)">OK</span></div>',
    '<div class="bl">STAGE 2: MOUNTING DEPTH TAGS .......... <span style="color:var(--ok)">OK</span></div>',
    '<div class="bl"><span class="warn">WARNING: TBD — the one-line warning that sets the tone.</span></div>',
    '<div class="bl">AWAITING CREW — 14 waypoints ahead. <span class="cursor" style="color:var(--accent)">\u258e</span></div>',
  ],
  h1: 'LANGCHAIN, UNDERSTOOD.<br><span class="wh">NOT JUST SNIPPED.</span>',
  sub: 'TBD — the mission paragraph: learn the mental model <b>deeply</b>, reference the rest, and build the shipyard\u2019s container as you complete parts. Quizzes earn XP; ranks go from <b>Swabbie</b> to <b>Harbor Master</b>.',
  foot: {
    about: 'The LANGCHAIN Shipyard is a faithful interactive conversion of the first-principles LANGCHAIN curriculum \u2014 every concept, table, code block and exercise preserved. Progress lives in your browser (localStorage). Built as a single file \u2014 copy it anywhere, it runs offline.',
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
    ], // The LLM Primitive — hint: At its core, LangChain wraps language models. We start by understanding the llm.invoke() interface and how it standardizes interac
    p2: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Prompt Templates — hint: Hardcoding strings doesn't scale. Prompt templates parameterize prompts, allowing dynamic insertion of variables and separating lo
    p3: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Output Parsers — hint: LLMs return text, but software needs structured data. Output parsers convert raw text (like JSON blocks) into usable objects.
    p4: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // LCEL (LangChain Expression Language) — hint: The most critical addition to modern LangChain. LCEL uses the | operator to compose runnables, handling streaming, batching, and a
    p5: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Chains (Legacy vs LCEL) — hint: Before LCEL, we had LLMChain , SequentialChain , etc. You need to recognize these in older codebases, but shouldn't write them for
    p6: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Memory & State — hint: LLMs are stateless. Memory is how we inject past conversation history into the current prompt to create the illusion of continuity
    p7: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Document Loaders — hint: To give an LLM context, we need data. Loaders pull text from PDFs, Notion, SQL databases, and web pages into a standard Document f
    p8: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Text Splitters — hint: Context windows are limited. Splitters break large documents into semantic chunks so they fit into a prompt without losing meaning
    p9: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Vector Stores & Embeddings — hint: Embeddings turn text into coordinates in a high-dimensional space. Vector stores index these coordinates for fast similarity searc
    p10: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Retrievers — hint: A retriever takes a query and returns relevant Documents. It is the interface between the Vector Store and the Chain.
    p11: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Tools & Toolkits — hint: LLMs can't execute code or browse the web natively. Tools give them functions they can call to interact with the outside world.
    p12: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Agents — hint: Agents use an LLM as a reasoning engine to decide which Tools to call and in what order to solve a complex goal.
    p13: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // Callbacks & Tracing — hint: When chains get deep, debugging is hard. Callbacks let you hook into intermediate steps, and tracing logs the exact execution path
    p14: [
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
      { q: 'TBD', o: ['', '', '', ''], a: 0, e: '' },
    ], // LangGraph (The Future) — hint: Agents often get stuck in loops. LangGraph models agent workflows as state machines (graphs), allowing cycles and precise control 
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
