"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChecklistPanel } from "@/components/checklist/checklist-panel";
import { EligibilityPanel } from "@/components/eligibility/eligibility-panel";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { deleteOpportunity, getOpportunity, setEligibility, setTaskDone } from "@/lib/storage/opportunities";
import type { SavedOpportunity } from "@/lib/schemas/opportunity";
import type { EligibilityResponse } from "@/lib/schemas/eligibility";

type Tab = "checklist" | "analysis" | "chat";

export default function SavedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // undefined = still loading, null = not found
  const [opp, setOpp] = useState<SavedOpportunity | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("checklist");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setOpp(getOpportunity(id));
  }, [id]);

  const toggle = useCallback(
    (taskId: string, value: boolean) => {
      setError(null);
      const res = setTaskDone(id, taskId, value);
      if (res.ok) setOpp(res.value);
      else setError("Your progress could not be saved. Browser storage may be full or blocked.");
    },
    [id],
  );

  const saveEligibility = useCallback(
    (r: EligibilityResponse) => {
      const res = setEligibility(id, r);
      if (res.ok) setOpp(res.value);
    },
    [id],
  );

  if (opp === undefined) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-muted sm:px-6">Loading…</div>;
  }

  if (opp === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">We could not find that opportunity</h1>
        <p className="mt-2 text-muted">
          It may have been deleted, or it was saved in a different browser. Saved items live on the
          device where you saved them.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/saved" variant="outline">My opportunities</ButtonLink>
          <ButtonLink href="/analyze" variant="accent">Analyze a document</ButtonLink>
        </div>
      </div>
    );
  }

  const a = opp.analysis;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/saved" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} aria-hidden /> My opportunities
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent" className="capitalize">{a.opportunity.type}</Badge>
            {opp.origin === "sample" ? <Badge tone="warn">Sample document</Badge> : null}
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            {a.opportunity.name}
          </h1>
          {a.opportunity.organizer ? <p className="text-muted">{a.opportunity.organizer}</p> : null}
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span>Delete this saved item?</span>
            <Button
              size="sm"
              variant="outline"
              className="border-danger/40 text-danger"
              onClick={() => {
                if (deleteOpportunity(id)) router.push("/saved");
                else setError("Could not delete. Browser storage may be blocked.");
              }}
            >
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} aria-hidden /> Delete
          </Button>
        )}
      </div>

      {error ? (
        <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div role="group" aria-label="Sections" className="mt-6 inline-flex rounded-lg bg-[#eceff5] p-1">
        {(
          [
            ["checklist", "Checklist"],
            ["analysis", "Analysis and eligibility"],
            ["chat", "Ask your document"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === key ? "bg-surface shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "checklist" ? (
          <ChecklistPanel items={opp.checklist} done={opp.done} onToggle={toggle} />
        ) : tab === "chat" ? (
          <ChatPanel pages={opp.pages} hasPageNumbers={opp.hasPageNumbers} />
        ) : (
          <div className="space-y-6">
            <AnalysisView
              analysis={a}
              sourceLabel={opp.origin === "sample" ? "Sample result, not live AI output" : undefined}
            />
            <EligibilityPanel analysis={a} initialResult={opp.eligibility} onResult={saveEligibility} />
          </div>
        )}
      </div>

      <Card className="mt-8 text-sm text-muted">
        Saved {new Date(opp.savedAt).toLocaleString()}. Everything is stored in this browser only.
      </Card>
    </div>
  );
}
