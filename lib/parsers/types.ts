export type ExtractedPage = {
  /** 1-based page number. */
  page: number;
  text: string;
};

export type ExtractionMethod = "pdf-text" | "ocr";

export type ExtractedDocument = {
  pages: ExtractedPage[];
  method: ExtractionMethod;
  /** Total pages in the original file (may exceed pages.length when capped). */
  pageCount: number;
  /** Things the user should know, e.g. "only the first 10 pages were read". */
  warnings: string[];
};

export type ProgressFn = (update: { pct: number; label: string }) => void;

/** An error whose message is safe and useful to show directly to the user. */
export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

/** Limits shared by the client (to trim early) and the server (to enforce). */
export const LIMITS = {
  /** Max characters sent to the AI for one document. */
  maxChars: 60_000,
  /** Max pages we will OCR (OCR is slow on phones). */
  maxOcrPages: 8,
  /** Max pages read from a PDF with a text layer. */
  maxPdfPages: 60,
  /** Below this average characters per page a PDF is treated as scanned. */
  scannedCharsPerPage: 40,
  /** Below this many characters in total we say the file is unreadable. */
  minUsableChars: 40,
} as const;
