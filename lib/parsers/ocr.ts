import { ExtractionError, type ProgressFn } from "./types";

/**
 * Runs Tesseract OCR in the browser on one or more images.
 * Language: English. Roman Urdu is Latin script, so it is read correctly;
 * Urdu in Arabic script is not supported by this model.
 *
 * All Tesseract assets are served from /public/tesseract (copied by the postinstall
 * script), so OCR does not depend on a third-party CDN.
 */

const INIT_TIMEOUT_MS = 45_000;
const PAGE_TIMEOUT_MS = 120_000;

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ExtractionError(message)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

export async function ocrSources(
  sources: Array<Blob | HTMLCanvasElement>,
  onProgress: ProgressFn,
  labelPrefix = "Reading text from image",
): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  let current = 0;

  onProgress({ pct: 0, label: "Starting text recognition" });

  let worker: Awaited<ReturnType<typeof createWorker>>;
  try {
    worker = await withTimeout(
      createWorker("eng", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/core",
        langPath: "/tesseract/lang",
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            const pct = Math.round(((current + m.progress) / sources.length) * 100);
            onProgress({
              pct,
              label:
                sources.length > 1
                  ? `${labelPrefix} (${current + 1} of ${sources.length})`
                  : labelPrefix,
            });
          }
        },
      }),
      INIT_TIMEOUT_MS,
      "Text recognition could not start. Check your connection and try again, or paste the text instead.",
    );
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      "Text recognition could not start in this browser. Try again, or paste the text instead.",
    );
  }

  try {
    const out: string[] = [];
    for (current = 0; current < sources.length; current++) {
      const { data } = await withTimeout(
        worker.recognize(sources[current]),
        PAGE_TIMEOUT_MS,
        "Reading this image took too long. Try a smaller or clearer image, or paste the text instead.",
      );
      out.push(data.text.trim());
    }
    return out;
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError("This image could not be read. Try a clearer image, or paste the text instead.");
  } finally {
    await worker.terminate().catch(() => undefined);
  }
}
