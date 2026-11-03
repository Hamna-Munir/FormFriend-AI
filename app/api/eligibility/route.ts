import { NextResponse } from "next/server";
import { matchEligibility } from "@/lib/ai/eligibility";
import { checkRateLimit } from "@/lib/ai/ratelimit";
import { fail, MISSING_KEY_MESSAGE, STATUS, tooMany } from "@/lib/ai/http";
import { hasApiKey, MetaApiError } from "@/lib/ai/meta-client";
import { EligibilityRequestSchema, profileIsEmpty } from "@/lib/schemas/eligibility";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = checkRateLimit(req, "eligibility", 20);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 60_000) return fail("too_large", "The request is too large.", 413);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("bad_request", "The request was not valid JSON.", 400);
  }
  const parsed = EligibilityRequestSchema.safeParse(json);
  if (!parsed.success) return fail("bad_request", "The profile or criteria were not in the expected format.", 400);

  const { criteria, profile } = parsed.data;

  // An empty profile never needs the model (and so never needs a key).
  if (!profileIsEmpty(profile) && !hasApiKey()) return fail("missing_api_key", MISSING_KEY_MESSAGE, 503);

  try {
    const result = await matchEligibility(criteria, profile);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof MetaApiError) return fail(err.code, err.message, STATUS[err.code]);
    console.error("[eligibility] unexpected error", (err as Error).name);
    return fail("internal", "Something went wrong while checking eligibility.", 500);
  }
}
