"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listOpportunities, saveOpportunity } from "@/lib/storage/opportunities";
import type { Analysis } from "@/lib/schemas/analysis";

export function SaveButton({
  analysis,
  pages,
  origin,
  sampleId = null,
  hasPageNumbers = true,
}: {
  analysis: Analysis;
  pages: Array<{ page: number; text: string }>;
  origin: "upload" | "sample";
  sampleId?: string | null;
  hasPageNumbers?: boolean;
}) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Samples check storage first, so we do not flash a "Save" button for something already saved.
  const [ready, setReady] = useState(!sampleId);

  // A sample that was saved earlier shows as already saved.
  useEffect(() => {
    if (!sampleId) return;
    const existing = listOpportunities().find((o) => o.sampleId === sampleId);
    if (existing) setSavedId(existing.id);
    setReady(true);
  }, [sampleId]);

  const save = () => {
    setError(null);
    const res = saveOpportunity({ origin, sampleId, analysis, pages, hasPageNumbers });
    if (res.ok) {
      setSavedId(res.value.id);
    } else {
      setError(
        res.reason === "quota"
          ? "Your browser storage is full. Delete an old saved opportunity and try again."
          : "Saving is not available in this browser (private mode or blocked storage).",
      );
    }
  };

  if (!ready) return <div className="h-9" aria-hidden />;

  if (savedId) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ok">
          <BookmarkCheck size={16} aria-hidden /> Saved
        </span>
        <Link href={`/saved/${savedId}`} className="text-sm font-medium text-accent underline underline-offset-2">
          Open checklist
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Button variant="accent" size="sm" onClick={save}>
        <Bookmark size={15} aria-hidden /> Save and get checklist
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
