import "server-only";

/**
 * Minimal server-side client for any OpenAI-compatible Chat Completions API.
 * Supported out of the box:
 *   - Groq (set GROQ_API_KEY)                -> https://api.groq.com/openai/v1
 *   - Meta Model API (set MODEL_API_KEY)     -> https://api.meta.ai/v1
 *   - Any other compatible host: MODEL_API_KEY + META_API_BASE_URL + META_MODEL
 * Structured output uses response_format json_schema. If the model rejects it (HTTP 400),
 * we retry once in plain JSON mode with the schema written into the prompt. Every answer is
 * validated against our Zod schemas afterwards, so both paths are equally checked.
 */

export type MetaErrorCode =
  | "missing_api_key"
  | "unauthorized"
  | "rate_limited"
  | "timeout"
  | "bad_request"
  | "upstream"
  | "bad_output";

export class MetaApiError extends Error {
  constructor(
    public code: MetaErrorCode,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

const USING_GROQ = !process.env.MODEL_API_KEY && Boolean(process.env.GROQ_API_KEY);
const BASE_URL = (
  process.env.META_API_BASE_URL ?? (USING_GROQ ? "https://api.groq.com/openai/v1" : "https://api.meta.ai/v1")
).replace(/\/$/, "");
export const MODEL = process.env.META_MODEL ?? (USING_GROQ ? "openai/gpt-oss-120b" : "muse-spark-1.3");

/**
 * Max characters of document text sent per request. Groq's free tier allows only a few thousand
 * tokens per minute, so it gets a small budget. Override with AI_CONTEXT_CHARS.
 */
export const CONTEXT_CHARS = Number(process.env.AI_CONTEXT_CHARS) || (USING_GROQ ? 12_000 : 60_000);

function apiKey(): string | undefined {
  return process.env.MODEL_API_KEY || process.env.GROQ_API_KEY || undefined;
}

export function hasApiKey(): boolean {
  return Boolean(apiKey());
}

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function chatJson(opts: {
  messages: Message[];
  schemaName: string;
  schema: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<string> {
  const key = apiKey();
  if (!key) {
    throw new MetaApiError(
      "missing_api_key",
      "AI analysis is not configured on this server. Set GROQ_API_KEY or MODEL_API_KEY (see README).",
    );
  }

  const timeoutMs = opts.timeoutMs ?? 50_000;
  const send = async (useSchema: boolean): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const messages: Message[] = useSchema
      ? opts.messages
      : [
          ...opts.messages,
          {
            role: "system",
            content:
              "Reply with a single JSON object only, no markdown. It must match this JSON Schema exactly:\n" +
              JSON.stringify(opts.schema),
          },
        ];
    try {
      return await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages,
          response_format: useSchema
            ? { type: "json_schema", json_schema: { name: opts.schemaName, schema: opts.schema } }
            : { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new MetaApiError("timeout", "The AI model took too long to respond. Please try again.");
      }
      throw new MetaApiError("upstream", "Could not reach the AI service. Please try again.");
    } finally {
      clearTimeout(timer);
    }
  };

  let res = await send(true);
  let useSchema = true;
  if (res.status === 400) {
    // Some models do not accept json_schema. Retry once in plain JSON mode.
    useSchema = false;
    res = await send(false);
  }
  if (res.status === 429) {
    // Rate limited. If the provider says the wait is short, wait and retry once.
    const wait = Number(res.headers.get("retry-after"));
    if (Number.isFinite(wait) && wait > 0 && wait <= 20) {
      await new Promise((r) => setTimeout(r, wait * 1000 + 300));
      res = await send(useSchema);
    }
  }

  if (!res.ok) {
    // Log status only. Never log request bodies: they contain the user's document.
    // The provider's error message (not our request) is safe to log and helps with setup problems.
    const detail = await res
      .json()
      .then((j: { error?: { message?: string } }) => String(j?.error?.message ?? "").slice(0, 300))
      .catch(() => "");
    console.error(`[ai-api] HTTP ${res.status} model=${MODEL} ${detail}`);
    if (res.status === 413) {
      throw new MetaApiError(
        "bad_request",
        "This document is too large for the AI model's limit. Try a shorter section, or use a model with a higher limit.",
        413,
      );
    }
    if (res.status === 404) {
      throw new MetaApiError("bad_request", `The AI model "${MODEL}" was not found. Check META_MODEL.`, 404);
    }
    if (res.status === 401 || res.status === 403) {
      throw new MetaApiError("unauthorized", "The AI service rejected the API key.", res.status);
    }
    if (res.status === 429) {
      throw new MetaApiError("rate_limited", "The AI service rate limit was reached (the free tier allows only a few requests per minute). Wait one minute and try again, or use a smaller document.", 429);
    }
    if (res.status === 400) {
      throw new MetaApiError("bad_request", "The AI service could not process this request.", 400);
    }
    throw new MetaApiError("upstream", "The AI service had a problem. Please try again.", res.status);
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  } | null;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new MetaApiError("bad_output", "The AI returned an empty answer. Please try again.");
  return content;
}
