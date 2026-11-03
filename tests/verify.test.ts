import test from "node:test";
import assert from "node:assert/strict";
import { locateQuote, verifyAnalysis } from "@/lib/ai/verify";
import { AnalysisSchema, analysisJsonSchema, type Analysis } from "@/lib/schemas/analysis";

const bi = { en: "x", ur: "y" };
const pages = [
  { page: 1, text: "Test Scholarship. Applications open in early March." },
  { page: 2, text: "Applications close on March 15, 2027 at 5:00 PM PKT. Submit an official transcript." },
];

function analysis(over: Partial<Analysis>): Analysis {
  return {
    opportunity: { name: "T", type: "scholarship", organizer: null, summary: bi },
    dates: [],
    eligibility: [],
    requiredDocuments: [],
    submissionInstructions: [],
    fees: { text: "Not specified", evidence: null },
    selectionProcess: [],
    links: [],
    unresolved: [],
    ...over,
  };
}

test("locateQuote finds a quote despite spacing, case and punctuation, and returns its real page", () => {
  const r = locateQuote("OFFICIAL  transcript!", pages, true);
  assert.deepEqual(r, { verified: true, page: 2 });
});

test("locateQuote rejects text that is not in the document", () => {
  assert.equal(locateQuote("The foundation sponsors all visas.", pages, true).verified, false);
});

test("locateQuote rejects very short quotes (too easy to match by accident)", () => {
  assert.equal(locateQuote("the", pages, true).verified, false);
});

test("locateQuote returns page null for pasted text", () => {
  assert.deepEqual(locateQuote("official transcript", pages, false), { verified: true, page: null });
});

test("a valid date with a real quote stays verified", () => {
  const a = analysis({
    dates: [
      {
        label: "closes",
        originalText: "March 15, 2027 at 5:00 PM PKT",
        normalizedISO: "2027-03-15T17:00:00+05:00",
        timezone: "PKT",
        status: "verified",
        note: null,
        evidence: { quote: "Applications close on March 15, 2027 at 5:00 PM PKT", page: 1 },
      },
    ],
  });
  const { analysis: out, unverifiedCount } = verifyAnalysis(a, pages, true);
  assert.equal(out.dates[0].status, "verified");
  assert.equal(out.dates[0].normalizedISO, "2027-03-15T17:00:00+05:00");
  assert.equal(out.dates[0].evidence?.page, 2, "page is corrected from 1 to 2");
  assert.equal(unverifiedCount, 0);
});

test("a date with no year is downgraded to ambiguous even if the model said verified", () => {
  const a = analysis({
    dates: [
      {
        label: "opens",
        originalText: "early March",
        normalizedISO: "2027-03-01",
        timezone: null,
        status: "verified",
        note: null,
        evidence: { quote: "Applications open in early March", page: 1 },
      },
    ],
  });
  const d = verifyAnalysis(a, pages, true).analysis.dates[0];
  assert.equal(d.status, "ambiguous");
  assert.equal(d.normalizedISO, null);
  assert.match(d.note ?? "", /year/i);
});

test("a date backed by a fabricated quote is downgraded and flagged", () => {
  const a = analysis({
    dates: [
      {
        label: "other",
        originalText: "April 1, 2027",
        normalizedISO: "2027-04-01",
        timezone: null,
        status: "verified",
        note: null,
        evidence: { quote: "Results will be announced on April 1, 2027 by email", page: 2 },
      },
    ],
  });
  const { analysis: out, unverifiedCount } = verifyAnalysis(a, pages, true);
  assert.equal(out.dates[0].status, "ambiguous");
  assert.equal(out.dates[0].normalizedISO, null);
  assert.equal(out.dates[0].evidence?.verified, false);
  assert.equal(unverifiedCount, 1);
});

test("a verified date without any evidence is downgraded", () => {
  const a = analysis({
    dates: [
      { label: "closes", originalText: "March 15, 2027", normalizedISO: "2027-03-15", timezone: null, status: "verified", note: null, evidence: null },
    ],
  });
  assert.equal(verifyAnalysis(a, pages, true).analysis.dates[0].status, "ambiguous");
});

test("a malformed ISO string is rejected", () => {
  const a = analysis({
    dates: [
      {
        label: "closes",
        originalText: "March 15, 2027",
        normalizedISO: "15/03/2027",
        timezone: null,
        status: "verified",
        note: null,
        evidence: { quote: "Applications close on March 15, 2027", page: 2 },
      },
    ],
  });
  const d = verifyAnalysis(a, pages, true).analysis.dates[0];
  assert.equal(d.status, "ambiguous");
  assert.equal(d.normalizedISO, null);
});

test("eligibility and documents with unverifiable evidence become 'needs_verification'", () => {
  const a = analysis({
    eligibility: [
      {
        id: "e1",
        category: "other",
        requirement: "Must have won a national award",
        mandatory: true,
        basis: "explicit",
        evidence: { quote: "Applicants must have won a national award in 2020", page: 1 },
        explanation: bi,
      },
    ],
    requiredDocuments: [
      { id: "d1", name: "Transcript", mandatory: true, basis: "explicit", evidence: null, explanation: bi },
      { id: "d2", name: "Official transcript", mandatory: true, basis: "explicit", evidence: { quote: "Submit an official transcript", page: 2 }, explanation: bi },
    ],
  });
  const out = verifyAnalysis(a, pages, true).analysis;
  assert.equal(out.eligibility[0].basis, "needs_verification");
  assert.equal(out.requiredDocuments[0].basis, "needs_verification", "no evidence at all");
  assert.equal(out.requiredDocuments[1].basis, "explicit", "real quote keeps its basis");
});

test("pasted text forces page numbers to null", () => {
  const a = analysis({
    fees: { text: "x", evidence: { quote: "Submit an official transcript", page: 2 } },
  });
  assert.equal(verifyAnalysis(a, pages, false).analysis.fees.evidence?.page, null);
});

test("the JSON Schema sent to the model does not expose the server-only 'verified' field", () => {
  const evidenceProps = JSON.stringify(analysisJsonSchema());
  assert.ok(!/"verified":\{/.test(evidenceProps), "evidence.verified must not be offered to the model");
  assert.ok(AnalysisSchema.safeParse(analysis({})).success);
});
