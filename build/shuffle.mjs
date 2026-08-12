// shuffle.mjs — deterministic option permutation for quiz items.
//
// Why this exists: authored quizzes drift toward putting the true answer first.
// Before this, javascript and htmlcss had *every* answer at index 0 and rest-api
// had 98% at index 1 — "always press A" scored 100%. Shuffling at build time
// fixes the position tell without touching the authored source.
//
// The permutation is seeded from tech+part+index, so it is stable across builds:
// rebuilding a ship produces byte-identical output, which keeps the render-parity
// regression rule meaningful.

// FNV-1a — small, fast, no dependencies, good enough for shuffling four items.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// mulberry32 — deterministic PRNG from a 32-bit seed
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Permute one question's options and move its answer index to match.
 * Returns a new object; the input is not mutated.
 */
export function shuffleQuestion(q, seedStr) {
  const rand = rng(hash(seedStr));
  const idx = q.o.map((_, i) => i);
  // Fisher-Yates
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const o = idx.map(i => q.o[i]);
  const a = idx.indexOf(q.a);
  if (a < 0) throw new Error('shuffle lost the answer for: ' + q.q);
  return { ...q, o, a };
}

/**
 * Shuffle every question in a quiz map, keyed stably by tech/part/index.
 */
export function shuffleQuiz(quiz, tech) {
  const out = {};
  for (const [pid, questions] of Object.entries(quiz || {})) {
    out[pid] = questions.map((q, i) => shuffleQuestion(q, `${tech}:${pid}:${i}:${q.q}`));
  }
  return out;
}

export { hash, rng };
