import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/ai/chat";
import { checkRateLimit } from "@/lib/ai/ratelimit";
import { fail, MISSING_KEY_MESSAGE, STATUS, tooMany } from "@/lib/ai/http";
import { hasApiKey, MetaApiError } from "@/lib/ai/meta-client";
import { ChatRequestSchema } from "@/lib/schemas/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = checkRateLimit(req, "chat", 20);
  if (!rl.ok) return tooMany(rl.retryAfterSec);

  if (!hasApiKey()) return fail("missing_api_key", MISSING_KEY_MESSAGE, 503);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 400_000) return fail("too_large", "The request is too large.", 413);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("bad_request", "The request was not valid JSON.", 400);
  }
  const parsed = ChatRequestSchema.safeParse(json);
  if (!parsed.success) return fail("bad_request", "Your question or the document data was not in the expected format.", 400);

  const totalChars = parsed.data.pages.reduce((n, p) => n + p.text.length, 0);
  if (totalChars > 60_000) return fail("too_large", "This document is too long to ask about.", 413);

  try {
    return NextResponse.json({ ok: true, ...(await answerQuestion(parsed.data)) });
  } catch (err) {
    if (err instanceof MetaApiError) return fail(err.code, err.message, STATUS[err.code]);
    console.error("[chat] unexpected error", (err as Error).name);
    return fail("internal", "Something went wrong while answering.", 500);
  }
}
