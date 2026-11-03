import { ExtractionError, LIMITS, type ExtractedPage, type ProgressFn } from "./types";

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfDoc = Awaited<ReturnType<PdfjsModule["getDocument"]>["promise"]>;

async function loadPdfjs(): Promise<PdfjsModule> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Legacy build: works on older browsers that lack newer JS features. The worker is copied into /public by scripts/copy-pdf-worker.mjs (npm postinstall).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return pdfjs;
}

export async function openPdf(file: File): Promise<PdfDoc> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  try {
    return await pdfjs.getDocument({ data }).promise;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "PasswordException") {
      throw new ExtractionError(
        "This PDF is password-protected. Remove the password and upload it again, or paste the text instead.",
      );
    }
    if (name === "InvalidPDFException" || name === "FormatError") {
      throw new ExtractionError(
        "This PDF looks corrupted and could not be opened. Try re-downloading it, or paste the text instead.",
      );
    }
    throw new ExtractionError("This PDF could not be read. Try another copy, or paste the text instead.");
  }
}

/** Reads the embedded text layer. Scanned PDFs return (almost) empty strings. */
export async function extractPdfText(
  pdf: PdfDoc,
  onProgress: ProgressFn,
): Promise<ExtractedPage[]> {
  const total = Math.min(pdf.numPages, LIMITS.maxPdfPages);
  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if ("str" in item) {
        text += item.str;
        text += item.hasEOL ? "\n" : " ";
      }
    }
    pages.push({ page: i, text: text.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim() });
    onProgress({ pct: Math.round((i / total) * 100), label: `Reading PDF text (page ${i} of ${total})` });
  }
  return pages;
}

/** Renders PDF pages to canvases so they can be OCR'd. Used for scanned PDFs. */
export async function renderPdfPages(
  pdf: PdfDoc,
  pageNumbers: number[],
): Promise<HTMLCanvasElement[]> {
  const canvases: HTMLCanvasElement[] = [];
  for (const n of pageNumbers) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ExtractionError("Your browser could not prepare the page for reading.");
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
  }
  return canvases;
}
