export type Page = { page: number; text: string };

const STOP = new Set([
  "what", "which", "when", "where", "who", "whom", "does", "this", "that", "with", "have", "will",
  "from", "your", "about", "need", "needs", "must", "should", "there", "their", "they", "them",
  "are", "the", "and", "for", "can", "how", "any", "not", "you",
]);

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/\p{L}{3,}/gu) ?? []).filter((t) => !STOP.has(t));
}

/**
 * Picks the pages that fit a character budget. A short document is sent whole.
 * A long one keeps page 1 (usually the overview) plus the pages that share the most words
 * with the question, in their original order.
 */
export function selectPages(pages: Page[], question: string, budget: number): Page[] {
  const total = pages.reduce((n, p) => n + p.text.length, 0);
  if (total <= budget) return pages;

  const q = new Set(tokens(question));
  const scored = pages.map((p, i) => {
    const words = tokens(p.text);
    let hits = 0;
    for (const w of words) if (q.has(w)) hits++;
    return { p, i, score: i === 0 ? hits + 1e6 : hits };
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);

  const chosen: Array<{ p: Page; i: number }> = [];
  let left = budget;
  for (const s of scored) {
    if (left <= 0) break;
    const text = s.p.text.length > left ? s.p.text.slice(0, left) : s.p.text;
    chosen.push({ p: { page: s.p.page, text }, i: s.i });
    left -= text.length;
  }
  return chosen.sort((a, b) => a.i - b.i).map((c) => c.p);
}
