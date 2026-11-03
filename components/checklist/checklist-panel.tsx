"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EvidenceQuote } from "@/components/analysis/analysis-view";
import { cn } from "@/lib/utils/cn";
import { GROUP_LABEL, GROUP_ORDER, progress } from "@/lib/utils/checklist";
import type { ChecklistItem } from "@/lib/schemas/opportunity";

export function ProgressBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[#eceff5]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ChecklistPanel({
  items,
  done,
  onToggle,
}: {
  items: ChecklistItem[];
  done: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
}) {
  const p = progress(items, done);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Your preparation progress</h2>
          <span className="text-sm font-medium">
            {p.completed} of {p.total} done · {p.pct}%
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar pct={p.pct} label="Checklist progress" />
        </div>
        <p className="mt-3 text-xs text-muted">
          Tasks marked “From the document” are backed by a quote. “Recommended” tasks are our
          suggestions. Progress is saved on this device.
        </p>
      </Card>

      {GROUP_ORDER.map((g) => {
        const groupItems = items.filter((i) => i.group === g);
        if (groupItems.length === 0) return null;
        return (
          <section key={g} aria-labelledby={`grp-${g}`}>
            <h3 id={`grp-${g}`} className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
              {GROUP_LABEL[g]}
            </h3>
            <ul className="space-y-2">
              {groupItems.map((item) => {
                const checked = Boolean(done[item.id]);
                const inputId = `task-${item.id}`;
                return (
                  <li key={item.id} className="lift-sm rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-start gap-3">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onToggle(item.id, e.target.checked)}
                        className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={inputId}
                          className={cn("block cursor-pointer font-medium", checked && "text-muted line-through")}
                        >
                          {item.title}
                        </label>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge tone={item.required ? "neutral" : "accent"}>{item.required ? "Required" : "Optional"}</Badge>
                          <Badge tone={item.kind === "from_document" ? "ok" : "warn"}>
                            {item.kind === "from_document" ? "From the document" : "Recommended"}
                          </Badge>
                        </div>
                        {item.detail ? <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p> : null}
                        {item.kind === "from_document" ? <EvidenceQuote evidence={item.evidence} /> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
