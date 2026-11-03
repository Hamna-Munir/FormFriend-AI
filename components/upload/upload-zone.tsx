"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};
export const MAX_PASTED_CHARS = 60_000;

export type PickedFile = {
  file: File;
  kindLabel: string;
  isImage: boolean;
};

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES[file.type]) {
    return `“${file.name}” is not supported. Please upload a PDF, PNG or JPG file.`;
  }
  if (file.size === 0) {
    return `“${file.name}” is empty. Please choose a different file.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`;
  }
  return null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  /** Called with the chosen file once it passed validation and was read. */
  onFileReady: (picked: PickedFile) => void;
  /** Called when the user chooses to paste text instead. */
  onTextSubmit: (text: string) => void;
  busy?: boolean;
  /** 0-100 processing progress supplied by the parent (extraction / OCR). */
  processingProgress?: number | null;
  processingLabel?: string | null;
  error?: string | null;
};

export function UploadZone({
  onFileReady,
  onTextSubmit,
  busy = false,
  processingProgress = null,
  processingLabel = null,
  error = null,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [readPct, setReadPct] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");

  const handleFiles = useCallback(
    (files: FileList | null) => {
      setLocalError(null);
      if (!files || files.length === 0) return;
      if (files.length > 1) {
        setLocalError("Please upload one document at a time.");
        return;
      }
      const file = files[0];
      const problem = validateFile(file);
      if (problem) {
        setPicked(null);
        setLocalError(problem);
        return;
      }
      const next: PickedFile = {
        file,
        kindLabel: ACCEPTED_TYPES[file.type],
        isImage: file.type.startsWith("image/"),
      };
      setPicked(next);
      setReadPct(0);

      // Read the file locally so the user sees real progress and corrupted files fail early.
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) setReadPct(Math.round((e.loaded / e.total) * 100));
      };
      reader.onerror = () => {
        setPicked(null);
        setLocalError(`“${file.name}” could not be read. It may be corrupted. Try another copy.`);
      };
      reader.onload = () => {
        setReadPct(100);
        onFileReady(next);
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileReady],
  );

  const clear = () => {
    setPicked(null);
    setReadPct(0);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const shownError = error ?? localError;
  const pct = processingProgress ?? readPct;

  return (
    <div>
      <div role="group" aria-label="Input method" className="mb-4 inline-flex rounded-lg bg-[#eceff5] p-1">
        {(["file", "text"] as const).map((m) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              mode === m ? "bg-surface shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {m === "file" ? "Upload file" : "Paste text"}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12",
            dragging ? "border-accent bg-accent-soft" : "border-border bg-surface",
          )}
        >
          <span
            className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-300",
              dragging && "scale-110 -translate-y-1",
            )}
          >
            <UploadCloud size={32} aria-hidden />
          </span>
          <p className="mt-3 font-medium">Drag and drop your document here</p>
          <p className="mt-1 text-sm text-muted">PDF, PNG or JPG, up to {formatBytes(MAX_FILE_BYTES)}</p>
          <input
            ref={inputRef}
            id="file-input"
            aria-label="Choose a PDF, PNG or JPG document to upload"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={busy}
          />
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            Choose a file
          </Button>
        </div>
      ) : (
        <div>
          <label htmlFor="paste" className="mb-2 block text-sm font-medium">
            Paste the application instructions
          </label>
          <textarea
            id="paste"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_PASTED_CHARS))}
            rows={10}
            placeholder="Paste eligibility, required documents, deadline…"
            className="w-full rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed placeholder:text-muted focus:border-accent"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>
              {text.length.toLocaleString()} / {MAX_PASTED_CHARS.toLocaleString()} characters
            </span>
            <Button
              variant="accent"
              size="sm"
              disabled={busy || text.trim().length < 40}
              onClick={() => onTextSubmit(text.trim())}
            >
              Analyze text
            </Button>
          </div>
          {text.trim().length > 0 && text.trim().length < 40 ? (
            <p className="mt-2 text-xs text-warn">Add a bit more text so there is something to analyze.</p>
          ) : null}
        </div>
      )}

      {picked && mode === "file" ? (
        <Card className="mt-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-accent">
              {picked.isImage ? <FileImage size={22} aria-hidden /> : <FileText size={22} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{picked.file.name}</p>
              <p className="text-sm text-muted">
                {picked.kindLabel} · {formatBytes(picked.file.size)}
              </p>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceff5]"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Processing progress"
              >
                <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted" aria-live="polite">
                {busy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                    {processingLabel ?? "Processing…"}
                  </>
                ) : pct >= 100 ? (
                  <>
                    <CheckCircle2 size={14} className="text-ok" aria-hidden />
                    File loaded
                  </>
                ) : (
                  "Reading file…"
                )}
              </p>
            </div>
            <button
              onClick={clear}
              disabled={busy}
              aria-label="Remove file"
              className="rounded-md p-1 text-muted hover:bg-[#eceff5] hover:text-foreground disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : null}

      {shownError ? (
        <div
          role="alert"
          className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{shownError}</span>
        </div>
      ) : null}
    </div>
  );
}
