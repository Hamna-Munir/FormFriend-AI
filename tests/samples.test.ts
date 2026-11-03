import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_SAMPLES, samplePages } from "@/lib/demo/samples";
import { AnalysisSchema } from "@/lib/schemas/analysis";
import { verifyAnalysis } from "@/lib/ai/verify";
import { buildChecklist } from "@/lib/utils/checklist";
import { deadlineState } from "@/lib/utils/dates";

const sample = (id: string) => DEMO_SAMPLES.find((s) => s.id === id)!;

test("there are three samples: a scholarship, an internship and a hackathon", () => {
  assert.deepEqual(DEMO_SAMPLES.map((s) => s.kind).sort(), ["hackathon", "internship", "scholarship"]);
});

for (const s of DEMO_SAMPLES) {
  test(`${s.id}: reference result is valid and every quote really is in the sample text`, () => {
    assert.ok(AnalysisSchema.safeParse(s.analysis).success);
    const { unverifiedCount } = verifyAnalysis(s.analysis, samplePages(s), true);
    assert.equal(unverifiedCount, 0);
  });

  test(`${s.id}: produces a checklist with unique ids`, () => {
    const items = buildChecklist(s.analysis);
    assert.ok(items.length > 3);
    assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  });
}

test("scholarship: the ambiguous deadline ('end of March') is never turned into a date or countdown", () => {
  const closes = sample("scholarship").analysis.dates.find((d) => d.label === "closes")!;
  assert.equal(closes.status, "ambiguous");
  assert.equal(closes.normalizedISO, null);
  assert.equal(deadlineState(closes, new Date()).kind, "unreliable");
  const task = buildChecklist(sample("scholarship").analysis).find((i) => i.group === "deadline")!;
  assert.match(task.title, /^Confirm the exact closing date/);
});

test("internship: missing eligibility information is flagged, not filled in", () => {
  const a = sample("internship").analysis;
  assert.ok(a.eligibility.some((e) => e.basis === "needs_verification"));
  assert.ok(a.unresolved.length > 0);
  assert.equal(a.dates.find((d) => d.label === "closes")!.timezone, null);
});

test("hackathon: a clear deadline with a time zone is verified and counts down", () => {
  const closes = sample("hackathon").analysis.dates.find((d) => d.label === "closes")!;
  assert.equal(closes.status, "verified");
  assert.equal(closes.timezone, "PKT");
  assert.equal(deadlineState(closes, new Date("2026-10-22T10:00:00+05:00")).kind, "countdown");
});
