import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy. Notes on the looser directives:
 * - 'unsafe-inline' scripts: Next.js App Router injects small inline scripts for hydration.
 * - 'wasm-unsafe-eval' and blob: workers: Tesseract.js (OCR) runs WebAssembly in a Web Worker.
 * All OCR and PDF assets are served from this origin (see scripts/copy-pdf-worker.mjs), and the
 * browser only ever talks to this origin, so connect-src is 'self'. The Meta API key and calls
 * stay on the server.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    ];
    return [
      {
        source: "/:path*",
        // The CSP is production-only: the dev server needs eval for hot reloading.
        headers: isProd ? [...common, { key: "Content-Security-Policy", value: csp }] : common,
      },
      {
        // API responses contain the user's document analysis: never cache them.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
