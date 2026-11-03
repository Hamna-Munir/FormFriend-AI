import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeDocument } from "@/lib/ai/analyze";
import { checkRateLimit } from "@/lib/ai/ratelimit";
import { fail, STATUS, tooMany } from "@/lib/ai/http";
import { hasApiKey, MetaApiError, MODEL } from "@/lib/ai/meta-client";
import { LIMITS } from "@/lib/parsers/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  source: z.enum(["pdf", "ocr", "paste"]),
  pages: z
    .array(
      z.object({
        page: z.number().int().positive().max(10_000),
        text: z.string().max(LIMITS.maxChars),
      }),
    )
    .min(1)
    .max(LIMITS.maxPdfPages),
});

export async function POST(req: Request) {
  const rl = checkRateLimit(req, "analyze", 6);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  if (!hasApiKey()) {
    return fail(
      "missing_api_key",
      "AI analysis is not set up on this server yet. You can still explore the sample documents.",
      503,
    );
  }

  // Reject oversized bodies before parsing them.
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 400_000) return fail("too_large", "This document is too large to analyze.", 413);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("bad_request", "The request was not valid JSON.", 400);
  }

  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) return fail("bad_request", "The document data was not in the expected format.", 400);

  const { pages, source } = parsed.data;
  const totalChars = pages.reduce((n, p) => n + p.text.length, 0);
  if (totalChars < LIMITS.minUsableChars) {
    return fail("too_short", "There is not enough text to analyze.", 400);
  }
  if (totalChars > LIMITS.maxChars) {
    return fail("too_large", "This document is too long to analyze in one go.", 413);
  }

  try {
    const result = await analyzeDocument({ pages, source });
    return NextResponse.json({ ok: true, ...result, model: MODEL });
  } catch (err) {
    if (err instanceof MetaApiError) return fail(err.code, err.message, STATUS[err.code]);
    console.error("[analyze] unexpected error", (err as Error).name);
    return fail("internal", "Something went wrong while analyzing the document.", 500);
  }
}
