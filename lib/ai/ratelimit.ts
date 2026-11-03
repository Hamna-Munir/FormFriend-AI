import "server-only";

/**
 * Best-effort in-memory rate limiter, keyed by client IP.
 *
 * On serverless hosting (Vercel) each instance has its own memory, so this slows down
 * casual abuse and runaway loops but is NOT a hard guarantee. For a hard limit put a shared
 * store (e.g. Upstash Redis or Vercel KV) behind this same function. See README.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function checkRateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs = 60_000,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;

  // Keep memory bounded: drop expired buckets once the map grows.
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  b.count++;
  return { ok: true };
}
