"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Lock, RotateCcw } from "lucide-react";
import { UploadZone, type PickedFile } from "@/components/upload/upload-zone";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { EligibilityPanel } from "@/components/eligibility/eligibility-panel";
import { SaveButton } from "@/components/saved/save-button";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_SAMPLES } from "@/lib/demo/samples";
import { extractDocument, ExtractionError, type ExtractedDocument } from "@/lib/parsers";
import type { Analysis } from "@/lib/schemas/analysis";

type Phase = "idle" | "extracting" | "analyzing" | "done";

type Result = {
  analysis: Analysis;
  warnings: string[];
  model: string;
  doc: ExtractedDocument;
  source: "pdf" | "ocr" | "paste";
};

type ApiResponse =
  | { ok: true; analysis: Analysis; warnings: string[]; model: string }
  | { ok: false; code: string; message: string };

async function callAnalyze(doc: ExtractedDocument, source: "pdf" | "ocr" | "paste") {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, pages: doc.pages }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as ApiResponse | null;
  if (!data) throw new Error("The server sent an unexpected response. Please try again.");
  if (!data.ok) throw new Error(data.message);
  return data;
}

export default function AnalyzePage() {
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const busy = phase === "extracting" || phase === "analyzing";

  const finish = useCallback(async (doc: ExtractedDocument, source: "pdf" | "ocr" | "paste") => {
    setPhase("analyzing");
    setProgress(null);
    setLabel("Analyzing with AI. This can take up to a minute");
    const data = await callAnalyze(doc, source);
    setResult({
      analysis: data.analysis,
      warnings: [...doc.warnings, ...data.warnings],
      model: data.model,
      doc,
      source,
    });
    setPhase("done");
  }, []);

  const fail = (err: unknown) => {
    setPhase("idle");
    setProgress(null);
    setLabel(null);
    setError(
      err instanceof ExtractionError || err instanceof Error
        ? err.message
        : "Something went wrong. Please try again.",
    );
  };

  const analyzeFile = async () => {
    if (!picked) return;
    setError(null);
    setPhase("extracting");
    try {
      const doc = await extractDocument(picked.file, ({ pct, label }) => {
        setProgress(pct);
        setLabel(label);
      });
      await finish(doc, doc.method === "ocr" ? "ocr" : "pdf");
    } catch (err) {
      fail(err);
    }
  };

  const analyzeText = async (text: string) => {
    setError(null);
    setPhase("analyzing");
    try {
      const doc: ExtractedDocument = {
        pages: [{ page: 1, text }],
        method: "pdf-text",
        pageCount: 1,
        warnings: [],
      };
      await finish(doc, "paste");
    } catch (err) {
      fail(err);
    }
  };

  const reset = () => {
    setResult(null);
    setPicked(null);
    setPhase("idle");
    setError(null);
    setProgress(null);
    setLabel(null);
    setResetKey((k) => k + 1);
  };

  if (phase === "done" && result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Analyzed with {result.model} ·{" "}
            {result.doc.method === "ocr" ? "text read with OCR" : "text read from the document"}
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw size={14} aria-hidden /> Analyze another
          </Button>
        </div>
        <div className="mb-6">
          <SaveButton
            analysis={result.analysis}
            pages={result.doc.pages}
            origin="upload"
            hasPageNumbers={result.source !== "paste"}
          />
        </div>

        {result.warnings.length > 0 ? (
          <Card className="mb-6 border-warn/30 bg-warn-soft">
            <div className="flex items-center gap-2 font-semibold text-warn">
              <AlertTriangle size={18} aria-hidden /> Please note
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        <details className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-medium">View the text we extracted from your file</summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-sans leading-relaxed text-muted">
            {result.doc.pages.map((p) => (result.doc.pages.length > 1 ? `— Page ${p.page} —\n${p.text}` : p.text)).join("\n\n")}
          </pre>
        </details>

        <AnalysisView analysis={result.analysis} />
        <div className="mt-6">
          <EligibilityPanel analysis={result.analysis} />
        </div>
        <div className="mt-6">
          <ChatPanel pages={result.doc.pages} hasPageNumbers={result.source !== "paste"} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
        Analyze a document
      </h1>
      <p className="mt-2 text-muted">
        Upload the instructions for a scholarship, internship, competition or application.
      </p>

      <div className="mt-8">
        <UploadZone
          key={resetKey}
          onFileReady={setPicked}
          onTextSubmit={analyzeText}
          busy={busy}
          processingProgress={phase === "extracting" ? progress : null}
          processingLabel={label}
          error={error}
        />
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-lg bg-accent-soft p-3 text-sm text-accent">
        <Lock size={18} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Text from your document is sent to an AI service (a hosted language model API) to be analyzed. We do not
          store it on our servers. Avoid uploading documents that contain passwords or ID numbers.
        </span>
      </div>

      <div className="mt-6">
        <Button variant="accent" size="lg" disabled={!picked || busy} onClick={analyzeFile}>
          {busy ? "Working…" : "Analyze document"}
        </Button>
      </div>

      <h2 className="mt-12 text-lg font-semibold">Or explore a sample</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {DEMO_SAMPLES.map((s) => (
          <Link key={s.id} href={`/demo/${s.id}`}>
            <Card className="h-full transition-colors hover:border-accent">
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.blurb}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
