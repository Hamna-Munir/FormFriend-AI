import http from "node:http";
import type { AddressInfo } from "node:net";

export type Recorded = { url: string; auth: string | undefined; body: any };

/** What the "model" does for one request. Return an object to send it as the model's JSON answer. */
export type Responder = (
  schemaName: string,
  body: any,
  callNumber: number,
) => unknown | { __status: number } | { __raw: string };

/**
 * A tiny stand-in for Meta Model API (OpenAI-compatible chat completions), so the whole
 * server pipeline can be tested without a key or network access.
 */
export async function startMockMeta() {
  const requests: Recorded[] = [];
  let responder: Responder = () => ({});
  let calls = 0;

  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      requests.push({ url: req.url ?? "", auth: req.headers.authorization, body });
      calls++;
      const out = responder(body.response_format?.json_schema?.name ?? "", body, calls) as any;
      res.setHeader("content-type", "application/json");
      if (out && typeof out === "object" && "__status" in out) {
        res.statusCode = out.__status;
        res.end("{}");
        return;
      }
      const content = out && typeof out === "object" && "__raw" in out ? out.__raw : JSON.stringify(out);
      res.end(JSON.stringify({ choices: [{ message: { content } }] }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;

  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    requests,
    respondWith(r: Responder) {
      responder = r;
      calls = 0;
      requests.length = 0;
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

let ipCounter = 0;
/** A fresh client IP per request, so the per-IP rate limiter does not interfere between tests. */
export function post(route: { POST: (r: Request) => Promise<Response> }, body: unknown, ip?: string) {
  ipCounter++;
  return route.POST(
    new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip ?? `10.1.${Math.floor(ipCounter / 250)}.${ipCounter % 250}` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}
