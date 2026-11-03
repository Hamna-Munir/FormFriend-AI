import "server-only";
import { NextResponse } from "next/server";
import type { MetaErrorCode } from "./meta-client";

export const STATUS: Record<MetaErrorCode, number> = {
  missing_api_key: 503,
  unauthorized: 502,
  rate_limited: 429,
  timeout: 504,
  bad_request: 502,
  upstream: 502,
  bad_output: 502,
};

export function fail(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export const MISSING_KEY_MESSAGE =
  "AI features are not set up on this server yet. You can still explore the sample documents.";

/** 429 with a Retry-After header, for the per-IP rate limiter. */
export function tooMany(retryAfterSec: number) {
  return NextResponse.json(
    {
      ok: false,
      code: "rate_limited",
      message: `You are going a little fast. Please wait ${retryAfterSec} seconds and try again.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
