import test from "node:test";
import assert from "node:assert/strict";
import { buildChecklist, progress } from "@/lib/utils/checklist";
import { computeOverall } from "@/lib/utils/overall";
import { selectPages } from "@/lib/ai/select";
import { profileIsEmpty, EMPTY_PROFILE } from "@/lib/schemas/eligibility";
import type { Analysis } from "@/lib/schemas/analysis";
import type { CriterionInput, CriterionResult } from "@/lib/schemas/eligibility";

const bi = { en: "x", ur: "y" };
const empty = (over: Partial<Analysis> = {}): Analysis => ({
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
});

// ---- checklist ----------------------------------------------------------

test("checklist: no closing date in the document creates a 'find the date' task", () => {
  const ids = buildChecklist(empty()).map((i) => i.id);
  assert.ok(ids.includes("deadline:missing"));
});

test("checklist: an ambiguous closing date creates a 'confirm' task, not a 'submit before' task", () => {
  const items = buildChecklist(
    empty({
      dates: [{ label: "closes", originalText: "end of March", normalizedISO: null, timezone: null, status: "ambiguous", note: null, evidence: null }],
    }),
  );
  const t = items.find((i) => i.group === "deadline")!;
  assert.match(t.title, /^Confirm the exact closing date/);
});

test("checklist: a verified closing date creates a 'submit before' task", () => {
  const items = buildChecklist(
    empty({
      dates: [
        { label: "closes", originalText: "5 Nov 2026, 6 PM PKT", normalizedISO: "2026-11-05T18:00:00+05:00", timezone: "PKT", status: "verified", note: null, evidence: { quote: "closes 5 Nov 2026", page: 1 } },
      ],
    }),
  );
  assert.match(items.find((i) => i.group === "deadline")!.title, /^Submit before the deadline/);
});

test("checklist: fee tasks only when there is something to pay", () => {
  const has = (text: string) => buildChecklist(empty({ fees: { text, evidence: null } })).some((i) => i.id === "fees");
  assert.equal(has("No application fee."), false);
  assert.equal(has("Free"), false);
  assert.equal(has("Not specified"), false);
  assert.equal(has("A fee of $25 is due with the application."), true);
});

test("checklist: 'recommended' tasks never carry evidence and 'from_document' ids are stable", () => {
  const a = empty({ unresolved: ["Is there a fee?"] });
  const one = buildChecklist(a);
  assert.deepEqual(one, buildChecklist(a), "deterministic");
  assert.ok(one.filter((i) => i.kind === "recommended").every((i) => i.evidence === null));
  assert.equal(new Set(one.map((i) => i.id)).size, one.length, "unique ids");
});

test("checklist: optional documents are optional, mandatory ones required", () => {
  const items = buildChecklist(
    empty({
      requiredDocuments: [
        { id: "d1", name: "Transcript", mandatory: true, basis: "explicit", evidence: null, explanation: bi },
        { id: "d2", name: "Portfolio", mandatory: false, basis: "explicit", evidence: null, explanation: bi },
      ],
    }),
  );
  assert.equal(items.find((i) => i.id === "doc:d1")!.required, true);
  assert.equal(items.find((i) => i.id === "doc:d2")!.required, false);
});

test("progress counts completed tasks and handles empty lists", () => {
  const items = buildChecklist(empty());
  assert.deepEqual(progress([], {}), { total: 0, completed: 0, pct: 0 });
  assert.equal(progress(items, { [items[0].id]: true }).completed, 1);
});

// ---- eligibility overall status ------------------------------------------

const crit = (id: string, mandatory: boolean): CriterionInput => ({ id, category: "other", requirement: "r", mandatory });
const res = (id: string, verdict: CriterionResult["verdict"]): CriterionResult => ({ criterionId: id, verdict, profileEvidence: null, reason: bi });

test("overall: any mandatory 'not met' means not eligible per criteria", () => {
  assert.equal(computeOverall([crit("a", true), crit("b", true)], [res("a", "met"), res("b", "not_met")]), "not_eligible_per_criteria");
});

test("overall: mandatory 'needs verification' means cannot confirm", () => {
  assert.equal(computeOverall([crit("a", true), crit("b", true)], [res("a", "met"), res("b", "needs_verification")]), "cannot_confirm");
});

test("overall: all mandatory met means 'meets listed criteria'", () => {
  assert.equal(computeOverall([crit("a", true), crit("b", false)], [res("a", "met"), res("b", "needs_verification")]), "meets_listed_criteria");
});

test("overall: a preferred criterion that is not met never blocks", () => {
  assert.equal(computeOverall([crit("a", true), crit("b", false)], [res("a", "met"), res("b", "not_met")]), "meets_listed_criteria");
});

test("overall: no mandatory criteria cannot be confirmed; no criteria at all is reported", () => {
  assert.equal(computeOverall([crit("a", false)], [res("a", "met")]), "cannot_confirm");
  assert.equal(computeOverall([], []), "no_criteria_found");
});

test("empty profile detection", () => {
  assert.equal(profileIsEmpty(EMPTY_PROFILE), true);
  assert.equal(profileIsEmpty({ ...EMPTY_PROFILE, country: "  " }), true);
  assert.equal(profileIsEmpty({ ...EMPTY_PROFILE, country: "Pakistan" }), false);
});

// ---- page selection for long documents ------------------------------------

test("selectPages: short documents are sent whole; long ones keep page 1 and the relevant page", () => {
  const filler = "lorem ipsum dolor ".repeat(40);
  const pages = Array.from({ length: 10 }, (_, i) => ({ page: i + 1, text: filler }));
  pages[6].text = "Applicants need a passport and transcript. " + filler;

  assert.equal(selectPages(pages.slice(0, 2), "anything", 100_000).length, 2);

  const sel = selectPages(pages, "Do I need a passport?", 1500);
  assert.ok(sel.reduce((n, p) => n + p.text.length, 0) <= 1500, "respects the budget");
  assert.equal(sel[0].page, 1);
  assert.ok(sel.some((p) => p.page === 7));
  assert.ok(sel.every((p, i) => i === 0 || sel[i - 1].page < p.page), "original order");
});
