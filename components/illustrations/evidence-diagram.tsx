import { AlertTriangle, Check } from "lucide-react";

/**
 * Shows the idea the whole product is built on: every claim must point at text that really is in
 * your document, and a claim that does not is flagged instead of shown as fact.
 */
export function EvidenceDiagram() {
  return (
    <div
      role="img"
      aria-label="Illustration: a requirement whose quote is found on page 1 of the document is shown as verified. A claim whose quote is not found in the document is flagged as unverified."
      className="rounded-2xl border border-border bg-white p-5 sm:p-7"
    >
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <p className="font-[family-name:var(--font-display)] text-[15px] leading-relaxed">
          “Applicants must have a cumulative{" "}
          <mark className="mark mark-teal">GPA of at least 3.2</mark> out of 4.0.”
        </p>
        <svg viewBox="0 0 64 24" className="mx-auto hidden h-6 w-16 sm:block" fill="none" aria-hidden>
          <path d="M2 12h54M48 5l9 7-9 7" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 5" />
        </svg>
        <div className="flex items-start gap-2 rounded-xl bg-ok-soft p-3 text-sm text-ok">
          <Check size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">Found on page 1.</span> Shown as a stated requirement.
          </span>
        </div>
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <p className="font-[family-name:var(--font-display)] text-[15px] leading-relaxed text-muted">
          “Winners receive a full ride and a laptop.”
        </p>
        <svg viewBox="0 0 64 24" className="mx-auto hidden h-6 w-16 sm:block" fill="none" aria-hidden>
          <path d="M2 12h40" className="stroke-warn" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
          <path d="M48 6l10 12M58 6L48 18" className="stroke-warn" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-sm text-warn">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">Not in your document.</span> Flagged as unverified, never shown as fact.
          </span>
        </div>
      </div>
    </div>
  );
}
