"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, SectionTitle } from "@/components/ui/card";
import { EvidenceQuote } from "@/components/analysis/analysis-view";
import { cn } from "@/lib/utils/cn";
import { loadProfile, saveProfile } from "@/lib/storage/profile";
import {
  EMPTY_PROFILE,
  type EligibilityResponse,
  type OverallStatus,
  type Profile,
  type Verdict,
} from "@/lib/schemas/eligibility";
import type { Analysis } from "@/lib/schemas/analysis";

const FIELDS: Array<{ key: keyof Profile; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "educationLevel", label: "Education level", placeholder: "e.g. Undergraduate, Master's" },
  { key: "degree", label: "Degree", placeholder: "e.g. BS Computer Science" },
  { key: "fieldOfStudy", label: "Field of study", placeholder: "e.g. Software engineering" },
  { key: "country", label: "Country of residence", placeholder: "e.g. Pakistan" },
  { key: "graduationYear", label: "Graduation year", placeholder: "e.g. 2027" },
  { key: "skills", label: "Skills and experience", placeholder: "e.g. Python, a web app project, 1 internship", multiline: true },
  { key: "other", label: "Anything else relevant", placeholder: "e.g. GPA 3.4, nationality, age", multiline: true },
];

const VERDICT_UI: Record<Verdict, { label: string; tone: "ok" | "danger" | "warn"; Icon: typeof CheckCircle2 }> = {
  met: { label: "Meets requirement", tone: "ok", Icon: CheckCircle2 },
  not_met: { label: "Does not meet requirement", tone: "danger", Icon: XCircle },
  needs_verification: { label: "Needs verification", tone: "warn", Icon: HelpCircle },
};

const OVERALL_UI: Record<OverallStatus, { title: string; body: string; box: string }> = {
  not_eligible_per_criteria: {
    title: "At least one required criterion is not met",
    body: "Based on what you entered, you do not meet a required condition. Re-read that item and confirm with the organizer before giving up, since the document may allow exceptions.",
    box: "border-danger/30 bg-danger-soft text-danger",
  },
  cannot_confirm: {
    title: "We cannot confirm your eligibility yet",
    body: "No required criterion was contradicted, but some could not be checked from your profile. Resolve the items marked “Needs verification”.",
    box: "border-warn/30 bg-warn-soft text-warn",
  },
  meets_listed_criteria: {
    title: "You meet every required criterion that the document lists",
    body: "This is not a guarantee. The document may not list everything, and the organizer makes the final decision. Confirm with the original instructions.",
    box: "border-ok/30 bg-ok-soft text-ok",
  },
  no_criteria_found: {
    title: "No eligibility criteria were found",
    body: "The document did not state any criteria, so there is nothing to compare. Check with the organizer.",
    box: "border-warn/30 bg-warn-soft text-warn",
  },
};

type ApiResponse = ({ ok: true } & EligibilityResponse) | { ok: false; message: string };

export function EligibilityPanel({
  analysis,
  initialResult = null,
  onResult,
}: {
  analysis: Analysis;
  /** A previously saved result to show straight away. */
  initialResult?: EligibilityResponse | null;
  /** Called after each successful check, e.g. to save it with the opportunity. */
  onResult?: (r: EligibilityResponse) => void;
}) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EligibilityResponse | null>(initialResult);
  const [ur, setUr] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setLoaded(true);
  }, []);

  const criteria = analysis.eligibility;
  const byId = useMemo(() => new Map(criteria.map((c) => [c.id, c])), [criteria]);

  const check = async () => {
    setBusy(true);
    setError(null);
    saveProfile(profile);
    try {
      const res = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          criteria: criteria.map((c) => ({
            id: c.id,
            category: c.category,
            requirement: c.requirement,
            mandatory: c.mandatory,
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!data) throw new Error("The server sent an unexpected response. Please try again.");
      if (!data.ok) throw new Error(data.message);
      const next: EligibilityResponse = { results: data.results, overall: data.overall, counts: data.counts };
      setResult(next);
      onResult?.(next);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (criteria.length === 0) {
    return (
      <Card>
        <SectionTitle>Check your eligibility</SectionTitle>
        <p className="text-sm text-muted">This document lists no eligibility criteria, so there is nothing to compare.</p>
      </Card>
    );
  }

  return (
    <Card lift="none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle hint="Tell us about yourself. Each criterion is marked as met, not met, or needs verification, with the reason. Only your profile and the criteria are sent to the AI, not the whole document.">
          <span className="inline-flex items-center gap-2">
            <UserCheck size={20} className="text-accent" aria-hidden /> Check your eligibility
          </span>
        </SectionTitle>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ur} onChange={(e) => setUr(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Roman Urdu
        </label>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void check();
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {FIELDS.map((f) => (
          <div key={f.key} className={f.multiline ? "sm:col-span-2" : undefined}>
            <label htmlFor={`pf-${f.key}`} className="mb-1 block text-sm font-medium">
              {f.label}
            </label>
            {f.multiline ? (
              <textarea
                id={`pf-${f.key}`}
                rows={2}
                value={profile[f.key]}
                maxLength={600}
                placeholder={f.placeholder}
                onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm placeholder:text-muted focus:border-accent"
              />
            ) : (
              <input
                id={`pf-${f.key}`}
                value={profile[f.key]}
                maxLength={120}
                placeholder={f.placeholder}
                onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-sm placeholder:text-muted focus:border-accent"
              />
            )}
          </div>
        ))}
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" variant="accent" disabled={busy || !loaded}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden /> Checking…
              </>
            ) : (
              "Check eligibility"
            )}
          </Button>
          <span className="text-xs text-muted">Saved on this device only.</span>
        </div>
      </form>

      {error ? (
        <div role="alert" className="mt-4 flex gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className="mt-6" aria-live="polite">
          <div className={cn("rounded-xl border p-4", OVERALL_UI[result.overall].box)}>
            <p className="font-semibold">{OVERALL_UI[result.overall].title}</p>
            <p className="mt-1 text-sm">{OVERALL_UI[result.overall].body}</p>
            <p className="mt-2 text-xs">
              {result.counts.met} met · {result.counts.not_met} not met · {result.counts.needs_verification} need verification
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {result.results.map((r) => {
              const c = byId.get(r.criterionId);
              if (!c) return null;
              const ui = VERDICT_UI[r.verdict];
              return (
                <li key={r.criterionId} className="lift-sm rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={ui.tone}>
                      <ui.Icon size={12} aria-hidden /> {ui.label}
                    </Badge>
                    <Badge tone={c.mandatory ? "neutral" : "accent"}>{c.mandatory ? "Required" : "Preferred"}</Badge>
                  </div>
                  <p className="mt-2 font-medium">{c.requirement}</p>
                  <p className="mt-1 text-sm leading-relaxed">{ur ? r.reason.ur : r.reason.en}</p>
                  {r.profileEvidence ? (
                    <p className="mt-2 text-xs text-muted">
                      Based on your profile: <span className="font-medium text-foreground">“{r.profileEvidence}”</span>
                    </p>
                  ) : null}
                  <EvidenceQuote evidence={c.evidence} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
