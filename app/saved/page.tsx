"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { DeadlineCountdown } from "@/components/analysis/deadline-countdown";
import { ProgressBar } from "@/components/checklist/checklist-panel";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listOpportunities } from "@/lib/storage/opportunities";
import { progress } from "@/lib/utils/checklist";
import type { SavedOpportunity } from "@/lib/schemas/opportunity";

function closingDate(o: SavedOpportunity) {
  return o.analysis.dates.find((d) => d.label === "closes") ?? null;
}

function eligibilityText(o: SavedOpportunity): string {
  if (!o.eligibility) return "Not checked yet";
  const c = o.eligibility.counts;
  return `${c.met} met · ${c.not_met} not met · ${c.needs_verification} to verify`;
}

const OVERALL_LABEL: Record<string, string> = {
  not_eligible_per_criteria: "A required criterion is not met",
  cannot_confirm: "Cannot confirm yet",
  meets_listed_criteria: "Meets all listed required criteria",
  no_criteria_found: "No criteria in the document",
};

export default function SavedPage() {
  const [items, setItems] = useState<SavedOpportunity[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setItems(listOpportunities());
  }, []);

  const chosen = useMemo(() => (items ?? []).filter((o) => selected.includes(o.id)), [items, selected]);

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));

  if (items === null) return <div className="mx-auto max-w-5xl px-4 py-10 text-muted sm:px-6">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <FolderOpen size={40} className="mx-auto text-accent" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">No saved opportunities yet</h1>
        <p className="mt-2 text-muted">
          Analyze a document and choose “Save and get checklist”. It will show up here with your
          progress.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/analyze" variant="accent">Analyze a document</ButtonLink>
          <ButtonLink href="/demo/scholarship" variant="outline">Try a sample</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        My opportunities
      </h1>
      <p className="mt-2 text-muted">
        Select two or three to compare them side by side. Saved on this device only.
      </p>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((o) => {
          const p = progress(o.checklist, o.done);
          const closes = closingDate(o);
          const isSel = selected.includes(o.id);
          const requiredDocs = o.analysis.requiredDocuments.filter((d) => d.mandatory).length;
          return (
            <li key={o.id}>
              <Card className={isSel ? "border-accent" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="accent" className="capitalize">{o.analysis.opportunity.type}</Badge>
                      {o.origin === "sample" ? <Badge tone="warn">Sample</Badge> : null}
                    </div>
                    <h2 className="mt-2 font-semibold leading-snug">{o.analysis.opportunity.name}</h2>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isSel}
                      disabled={!isSel && selected.length >= 3}
                      onChange={() => toggleSelect(o.id)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    Compare
                  </label>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Deadline</dt>
                    <dd>
                      {closes ? (
                        <>
                          <span className="font-medium">{closes.originalText}</span>{" "}
                          <Badge tone={closes.status === "verified" ? "ok" : closes.status === "ambiguous" ? "warn" : "danger"}>
                            {closes.status === "verified" ? "Verified" : closes.status === "ambiguous" ? "Ambiguous" : "Not specified"}
                          </Badge>
                          <DeadlineCountdown item={closes} />
                        </>
                      ) : (
                        <span className="text-muted">Not specified in the document</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Eligibility</dt>
                    <dd>{eligibilityText(o)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Required documents</dt>
                    <dd>{requiredDocs}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Open questions</dt>
                    <dd>{o.analysis.unresolved.length}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Checklist</span>
                    <span>{p.completed}/{p.total} · {p.pct}%</span>
                  </div>
                  <ProgressBar pct={p.pct} label={`Checklist progress for ${o.analysis.opportunity.name}`} />
                </div>

                <div className="mt-5">
                  <ButtonLink href={`/saved/${o.id}`} variant="outline" size="sm">
                    Open analysis and checklist
                  </ButtonLink>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {chosen.length >= 2 ? (
        <section className="mt-10" aria-labelledby="compare-h">
          <h2 id="compare-h" className="text-xl font-semibold tracking-tight">Comparison</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="w-36 p-3 font-medium text-muted"><span className="sr-only">Attribute</span></th>
                  {chosen.map((o) => (
                    <th key={o.id} scope="col" className="p-3 font-semibold">
                      <Link href={`/saved/${o.id}`} className="hover:underline">{o.analysis.opportunity.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="align-top">
                {(
                  [
                    ["Type", (o: SavedOpportunity) => <span className="capitalize">{o.analysis.opportunity.type}</span>],
                    [
                      "Deadline",
                      (o: SavedOpportunity) => {
                        const c = closingDate(o);
                        return c ? `${c.originalText} (${c.status === "verified" ? "verified" : c.status === "ambiguous" ? "ambiguous" : "not specified"})` : "Not specified";
                      },
                    ],
                    [
                      "Required criteria",
                      (o: SavedOpportunity) => `${o.analysis.eligibility.filter((e) => e.mandatory).length} required, ${o.analysis.eligibility.filter((e) => !e.mandatory).length} preferred`,
                    ],
                    [
                      "Your eligibility",
                      (o: SavedOpportunity) =>
                        o.eligibility ? `${OVERALL_LABEL[o.eligibility.overall]} (${eligibilityText(o)})` : "Not checked yet",
                    ],
                    [
                      "Required documents",
                      (o: SavedOpportunity) => {
                        const names = o.analysis.requiredDocuments.filter((d) => d.mandatory).map((d) => d.name);
                        return names.length ? names.join(", ") : "None listed";
                      },
                    ],
                    ["Fees", (o: SavedOpportunity) => o.analysis.fees.text],
                    ["Open questions", (o: SavedOpportunity) => String(o.analysis.unresolved.length)],
                    [
                      "Checklist progress",
                      (o: SavedOpportunity) => {
                        const p = progress(o.checklist, o.done);
                        return `${p.completed}/${p.total} (${p.pct}%)`;
                      },
                    ],
                  ] as Array<[string, (o: SavedOpportunity) => React.ReactNode]>
                ).map(([label, render]) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <th scope="row" className="p-3 font-medium text-muted">{label}</th>
                    {chosen.map((o) => (
                      <td key={o.id} className="p-3">{render(o)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : selected.length === 1 ? (
        <p className="mt-8 text-sm text-muted">Select one more to see a comparison.</p>
      ) : null}
    </div>
  );
}
