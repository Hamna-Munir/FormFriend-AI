"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, FileText, Link2, ListChecks, Quote, ReceiptText, Send, UserCheck } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { DeadlineCountdown } from "./deadline-countdown";
import type { Analysis, Basis, DateItem, Evidence } from "@/lib/schemas/analysis";

type Lang = "en" | "ur";

export function EvidenceQuote({ evidence }: { evidence: Evidence | null }) {
  if (!evidence) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-warn">
        <AlertTriangle size={13} aria-hidden /> No supporting text found in the document
      </p>
    );
  }
  const unverified = evidence.verified === false;
  return (
    <div>
      <blockquote
        className={cn(
          "mt-2 flex gap-2 border-l-2 pl-3 text-xs leading-relaxed text-muted",
          unverified ? "border-warn/60" : "border-accent/40",
        )}
      >
        <Quote size={12} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          “{evidence.quote}”{evidence.page ? <span className="ml-1 whitespace-nowrap">· page {evidence.page}</span> : null}
        </span>
      </blockquote>
      {unverified ? (
        <p className="mt-1 flex items-center gap-1.5 pl-5 text-xs text-warn">
          <AlertTriangle size={13} aria-hidden /> We could not find this exact text in your document. Check the original.
        </p>
      ) : null}
    </div>
  );
}

function BasisBadge({ basis }: { basis: Basis }) {
  if (basis === "explicit") return <Badge tone="ok">Stated in document</Badge>;
  if (basis === "inferred") return <Badge tone="warn">AI interpretation</Badge>;
  return <Badge tone="danger">Needs verification</Badge>;
}

function DateCard({ d }: { d: DateItem }) {
  const tone = d.status === "verified" ? "ok" : d.status === "ambiguous" ? "warn" : "danger";
  const label = d.status === "verified" ? "Verified" : d.status === "ambiguous" ? "Ambiguous" : "Not specified";
  return (
    <div className="lift-sm rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarClock size={16} className="text-accent" aria-hidden />
        <span className="text-sm font-medium capitalize">
          {d.label === "other" ? "Other date" : d.label === "closes" ? "Closing date" : "Opening date"}
        </span>
        <Badge tone={tone}>{label}</Badge>
        {d.timezone ? <Badge>{d.timezone}</Badge> : <Badge tone="warn">No time zone given</Badge>}
      </div>
      <p className="mt-2 font-medium">{d.originalText}</p>
      {d.note ? <p className="mt-1 text-sm text-muted">{d.note}</p> : null}
      <EvidenceQuote evidence={d.evidence} />
      {d.label === "closes" ? <DeadlineCountdown item={d} /> : null}
    </div>
  );
}

export function AnalysisView({ analysis, sourceLabel }: { analysis: Analysis; sourceLabel?: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const a = analysis;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent" className="capitalize">{a.opportunity.type}</Badge>
              {sourceLabel ? <Badge tone="warn">{sourceLabel}</Badge> : null}
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
              {a.opportunity.name}
            </h1>
            {a.opportunity.organizer ? (
              <p className="mt-1 text-muted">{a.opportunity.organizer}</p>
            ) : null}
          </div>
          <div role="group" aria-label="Explanation language" className="inline-flex rounded-lg bg-[#eceff5] p-1">
            {(["en", "ur"] as const).map((l) => (
              <button
                key={l}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  lang === l ? "bg-surface shadow-sm" : "text-muted hover:text-foreground",
                )}
              >
                {l === "en" ? "English" : "Roman Urdu"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 leading-relaxed">{a.opportunity.summary[lang]}</p>
      </Card>

      {a.unresolved.length > 0 ? (
        <Card className="border-warn/30 bg-warn-soft">
          <div className="flex items-center gap-2 font-semibold text-warn">
            <AlertTriangle size={18} aria-hidden /> Unresolved questions
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {a.unresolved.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <SectionTitle icon={CalendarClock} hint="Dates are shown exactly as written. We only normalize a date when the document makes it unambiguous.">
          Deadlines
        </SectionTitle>
        <div className="space-y-3">
          {a.dates.length === 0 ? (
            <p className="text-sm text-muted">No dates were found in this document.</p>
          ) : (
            a.dates.map((d, i) => <DateCard key={i} d={d} />)
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={UserCheck}>Eligibility</SectionTitle>
        <ul className="space-y-4">
          {a.eligibility.map((e) => (
            <li key={e.id} className="lift-sm rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={e.mandatory ? "neutral" : "accent"}>{e.mandatory ? "Required" : "Preferred"}</Badge>
                <Badge className="capitalize">{e.category}</Badge>
                <BasisBadge basis={e.basis} />
              </div>
              <p className="mt-2 font-medium">{e.requirement}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{e.explanation[lang]}</p>
              <EvidenceQuote evidence={e.evidence} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle icon={FileText}>Required documents</SectionTitle>
        <ul className="space-y-4">
          {a.requiredDocuments.map((d) => (
            <li key={d.id} className="lift-sm rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={d.mandatory ? "neutral" : "accent"}>{d.mandatory ? "Required" : "Optional"}</Badge>
                <BasisBadge basis={d.basis} />
              </div>
              <p className="mt-2 font-medium">{d.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d.explanation[lang]}</p>
              <EvidenceQuote evidence={d.evidence} />
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <SectionTitle icon={Send}>How to submit</SectionTitle>
          {a.submissionInstructions.length === 0 ? (
            <p className="text-sm text-muted">Not specified</p>
          ) : (
            <ol className="space-y-3">
              {a.submissionInstructions.map((s, i) => (
                <li key={i}>
                  <p className="text-sm">{s.step}</p>
                  <EvidenceQuote evidence={s.evidence} />
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card>
          <SectionTitle icon={ListChecks}>Selection process</SectionTitle>
          {a.selectionProcess.length === 0 ? (
            <p className="text-sm text-muted">Not specified</p>
          ) : (
            <ol className="space-y-3">
              {a.selectionProcess.map((s, i) => (
                <li key={i}>
                  <p className="text-sm">{s.step}</p>
                  <EvidenceQuote evidence={s.evidence} />
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <SectionTitle icon={ReceiptText}>Fees</SectionTitle>
          <p className="text-sm">{a.fees.text}</p>
          <EvidenceQuote evidence={a.fees.evidence} />
        </Card>
        <Card>
          <SectionTitle icon={Link2}>Links and contacts</SectionTitle>
          {a.links.length === 0 ? (
            <p className="text-sm text-muted">None found in the document</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {a.links.map((l) => (
                <li key={l.value}>
                  <span className="text-muted">{l.label}: </span>
                  {l.value}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs text-muted">
        AI results can contain mistakes. Always confirm deadlines and requirements against the original
        application instructions.
      </p>
    </div>
  );
}
