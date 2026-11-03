import test from "node:test";
import assert from "node:assert/strict";
import { post } from "./helpers/mock-meta";
import { EMPTY_PROFILE } from "@/lib/schemas/eligibility";
import { DEMO_SAMPLES, samplePages } from "@/lib/demo/samples";

// This file runs WITHOUT an API key, to check that a missing key is handled gracefully.
delete process.env.MODEL_API_KEY;
delete process.env.GROQ_API_KEY;

const sample = DEMO_SAMPLES[0];
const criteria = sample.analysis.eligibility.map((c) => ({ id: c.id, category: c.category, requirement: c.requirement, mandatory: c.mandatory }));

test("no key: analyze answers 503 with a friendly message, not a crash", async () => {
  const route = await import("@/app/api/analyze/route");
  const res = await post(route, { source: "pdf", pages: samplePages(sample) });
  const out = (await res.json()) as any;
  assert.equal(res.status, 503);
  assert.equal(out.code, "missing_api_key");
  assert.match(out.message, /sample documents/i);
});

test("no key: chat answers 503", async () => {
  const route = await import("@/app/api/chat/route");
  const res = await post(route, { question: "What documents do I need?", pages: samplePages(sample), hasPageNumbers: true });
  assert.equal(res.status, 503);
});

test("no key: eligibility with a profile answers 503, but an empty profile still works without AI", async () => {
  const route = await import("@/app/api/eligibility/route");
  assert.equal((await post(route, { criteria, profile: { ...EMPTY_PROFILE, country: "Pakistan" } })).status, 503);
  const res = await post(route, { criteria, profile: EMPTY_PROFILE });
  assert.equal(res.status, 200);
});
