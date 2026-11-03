import { ocrSources } from "./ocr";
import { extractPdfText, openPdf, renderPdfPages } from "./pdf";
import {
  ExtractionError,
  LIMITS,
  type ExtractedDocument,
  type ExtractedPage,
  type ProgressFn,
} from "./types";

export { ExtractionError, LIMITS } from "./types";
export type { ExtractedDocument, ExtractedPage } from "./types";

const UNREADABLE =
  "We could not find readable text in this file. Try a clearer or larger screenshot, or paste the text instead.";

function totalChars(pages: ExtractedPage[]): number {
  return pages.reduce((n, p) => n + p.text.length, 0);
}

/** Trims pages so the combined text fits the AI input limit. */
function capChars(pages: ExtractedPage[], warnings: string[]): ExtractedPage[] {
  let budget = LIMITS.maxChars;
  const out: ExtractedPage[] = [];
  for (const p of pages) {
    if (budget <= 0) break;
    const text = p.text.length > budget ? p.text.slice(0, budget) : p.text;
    out.push({ page: p.page, text });
    budget -= text.length;
  }
  if (totalChars(out) < totalChars(pages)) {
    warnings.push(
      `This document is long. Only the first ${out.length} page(s) (about ${LIMITS.maxChars.toLocaleString()} characters) were analyzed, so later requirements may be missing.`,
    );
  }
  return out;
}

export async function extractDocument(file: File, onProgress: ProgressFn): Promise<ExtractedDocument> {
  const warnings: string[] = [];

  if (file.type === "application/pdf") {
    onProgress({ pct: 0, label: "Opening PDF" });
    const pdf = await openPdf(file);
    const textPages = await extractPdfText(pdf, onProgress);
    const avg = totalChars(textPages) / Math.max(textPages.length, 1);

    if (avg >= LIMITS.scannedCharsPerPage) {
      if (pdf.numPages > LIMITS.maxPdfPages) {
        warnings.push(`Only the first ${LIMITS.maxPdfPages} of ${pdf.numPages} pages were read.`);
      }
      return {
        pages: capChars(textPages, warnings),
        method: "pdf-text",
        pageCount: pdf.numPages,
        warnings,
      };
    }

    // Scanned PDF: render pages and OCR them.
    const ocrPageCount = Math.min(pdf.numPages, LIMITS.maxOcrPages);
    if (pdf.numPages > ocrPageCount) {
      warnings.push(`This looks like a scanned PDF. Only the first ${ocrPageCount} of ${pdf.numPages} pages were read.`);
    }
    onProgress({ pct: 0, label: "Scanned PDF detected. Preparing pages" });
    const canvases = await renderPdfPages(
      pdf,
      Array.from({ length: ocrPageCount }, (_, i) => i + 1),
    );
    const texts = await ocrSources(canvases, onProgress, "Reading scanned page");
    const pages = texts.map((text, i) => ({ page: i + 1, text }));
    if (totalChars(pages) < LIMITS.minUsableChars) throw new ExtractionError(UNREADABLE);
    warnings.push("Text was read with OCR and may contain small errors. Check the quotes against your original.");
    return { pages: capChars(pages, warnings), method: "ocr", pageCount: pdf.numPages, warnings };
  }

  if (file.type === "image/png" || file.type === "image/jpeg") {
    onProgress({ pct: 0, label: "Reading text from image" });
    const [text] = await ocrSources([file], onProgress);
    if (!text || text.length < LIMITS.minUsableChars) throw new ExtractionError(UNREADABLE);
    warnings.push("Text was read from an image with OCR and may contain small errors. Check the quotes against your original.");
    return {
      pages: capChars([{ page: 1, text }], warnings),
      method: "ocr",
      pageCount: 1,
      warnings,
    };
  }

  throw new ExtractionError("Unsupported file type. Please upload a PDF, PNG or JPG.");
}
