import type { Analysis, Evidence } from "@/lib/schemas/analysis";

export type SourcePage = { page: number; text: string };

/** Lowercase letters and digits only, so quotes still match despite spacing, bullets or smart quotes. */
function squash(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

const MIN_QUOTE_LEN = 8;

/**
 * Checks that a quote the model returned really appears in the document.
 * Fixes the page number when the quote is found on a different page.
 * Pasted text has no pages, so page is forced to null.
 */
function verifyEvidence(
  ev: Evidence | null,
  pages: SourcePage[],
  hasPageNumbers: boolean,
  squashedPages: string[],
): Evidence | null {
  if (!ev) return null;
  const q = squash(ev.quote);
  if (q.length < MIN_QUOTE_LEN) return { quote: ev.quote, page: null, verified: false };

  const idx = squashedPages.findIndex((s) => s.includes(q));
  if (idx === -1) return { quote: ev.quote, page: null, verified: false };
  return { quote: ev.quote, page: hasPageNumbers ? pages[idx].page : null, verified: true };
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
const YEAR_RE = /\b(19|20)\d{2}\b/;

/**
 * Deterministic guard on top of the model's answer. The model is not trusted with
 * deadlines: a date stays "verified" only if it passes every check here.
 */
function guardDate(d: Analysis["dates"][number]): Analysis["dates"][number] {
  const next = { ...d };
  const note: string[] = d.note ? [d.note] : [];

  if (next.status === "not_specified") {
    next.normalizedISO = null;
    return next;
  }

  let ok = next.status === "verified" && next.normalizedISO !== null;

  if (ok && !ISO_RE.test(next.normalizedISO!)) ok = false;
  if (ok && Number.isNaN(Date.parse(next.normalizedISO!))) ok = false;
  if (ok && !YEAR_RE.test(next.originalText)) {
    ok = false;
    note.push("The document does not state a year, so the date was not normalized.");
  }
  if (ok && next.evidence && next.evidence.verified === false) {
    ok = false;
    note.push("We could not match the quoted text to the document, so please check this date yourself.");
  }
  if (ok && !next.evidence) {
    ok = false;
    note.push("No supporting text was found for this date.");
  }

  if (!ok) {
    next.status = "ambiguous";
    next.normalizedISO = null;
  }
  next.note = note.length ? note.join(" ") : null;
  return next;
}

export function verifyAnalysis(
  analysis: Analysis,
  pages: SourcePage[],
  hasPageNumbers: boolean,
): { analysis: Analysis; unverifiedCount: number } {
  const squashedPages = pages.map((p) => squash(p.text));
  const v = (ev: Evidence | null) => verifyEvidence(ev, pages, hasPageNumbers, squashedPages);
  let unverified = 0;
  const count = (ev: Evidence | null) => {
    if (ev && ev.verified === false) unverified++;
    return ev;
  };

  const a: Analysis = {
    ...analysis,
    dates: analysis.dates.map((d) => guardDate({ ...d, evidence: count(v(d.evidence)) })),
    eligibility: analysis.eligibility.map((e) => {
      const evidence = count(v(e.evidence));
      const bad = !evidence || evidence.verified === false;
      return { ...e, evidence, basis: bad ? "needs_verification" : e.basis };
    }),
    requiredDocuments: analysis.requiredDocuments.map((d) => {
      const evidence = count(v(d.evidence));
      const bad = !evidence || evidence.verified === false;
      return { ...d, evidence, basis: bad ? "needs_verification" : d.basis };
    }),
    submissionInstructions: analysis.submissionInstructions.map((s) => ({
      ...s,
      evidence: count(v(s.evidence)),
    })),
    selectionProcess: analysis.selectionProcess.map((s) => ({ ...s, evidence: count(v(s.evidence)) })),
    fees: { ...analysis.fees, evidence: count(v(analysis.fees.evidence)) },
  };

  return { analysis: a, unverifiedCount: unverified };
}

/** Finds a quote in the document. Used for chat citations. */
export function locateQuote(
  quote: string,
  pages: SourcePage[],
  hasPageNumbers: boolean,
): { verified: boolean; page: number | null } {
  const q = squash(quote);
  if (q.length < MIN_QUOTE_LEN) return { verified: false, page: null };
  const idx = pages.findIndex((p) => squash(p.text).includes(q));
  if (idx === -1) return { verified: false, page: null };
  return { verified: true, page: hasPageNumbers ? pages[idx].page : null };
}
