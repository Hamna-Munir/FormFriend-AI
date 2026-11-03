import { Check } from "lucide-react";

/**
 * The hero picture: an application document with its requirements highlighted, and the notes
 * FormFriend AI adds next to them. It is decorative, so assistive tech gets one summary sentence.
 * The text is fictional and matches the "Future Engineers Scholarship" sample.
 */
export function HeroDocument() {
  return (
    <div
      role="img"
      aria-label="Illustration: a scholarship document with requirements highlighted. Notes beside it say the requirement is stated on page 1 and that the deadline is ambiguous, so no date is guessed. A checklist shows two of three tasks done."
      className="relative mx-auto w-full max-w-[560px] pb-6 sm:pb-20 lg:pb-24"
    >
      <div className="paper relative w-full rounded-lg border border-border bg-white p-6 shadow-[0_30px_60px_-30px_rgba(15,27,51,0.45)] sm:w-[80%] sm:p-7 sm:pr-28">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted">NORTHBRIDGE FOUNDATION</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold leading-snug">
          Future Engineers Scholarship 2027
        </p>
        <div className="my-3 h-px bg-border" />

        <p className="text-[11px] font-semibold tracking-wide text-muted">Eligibility</p>
        <p className="mt-1.5 font-[family-name:var(--font-display)] text-[14px] leading-[1.75]">
          Applicants must be{" "}
          <mark className="mark mark-teal" style={{ "--d": "0.7s" } as React.CSSProperties}>
            enrolled full-time
          </mark>{" "}
          in an undergraduate degree in engineering or computer science, with a cumulative{" "}
          <mark className="mark mark-teal" style={{ "--d": "1.15s" } as React.CSSProperties}>
            GPA of at least 3.2
          </mark>{" "}
          out of 4.0.
        </p>

        <p className="mt-4 text-[11px] font-semibold tracking-wide text-muted">Deadline</p>
        <p className="mt-1.5 font-[family-name:var(--font-display)] text-[14px] leading-[1.75]">
          Applications close at the{" "}
          <mark className="mark mark-amber" style={{ "--d": "1.6s" } as React.CSSProperties}>
            end of March.
          </mark>
        </p>

        <div className="mt-5 space-y-1.5" aria-hidden>
          <div className="h-1.5 w-full rounded-full bg-[#eceff5]" />
          <div className="h-1.5 w-[88%] rounded-full bg-[#eceff5]" />
          <div className="h-1.5 w-[64%] rounded-full bg-[#eceff5]" />
        </div>
      </div>

      {/* Note: where the requirement came from */}
      <div
        className="note-in relative mt-3 w-full rounded-xl border border-border border-l-4 border-l-accent bg-surface p-3.5 shadow-[0_14px_30px_-18px_rgba(15,27,51,0.4)] sm:absolute sm:right-0 sm:top-[10%] sm:mt-0 sm:w-[38%]"
        style={{ "--d": "1.0s" } as React.CSSProperties}
      >
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ok">
          <Check size={14} aria-hidden /> Stated in the document
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          “enrolled full-time” · page 1. Required, not optional.
        </p>
      </div>

      {/* Note: an honest "we do not know" */}
      <div
        className="note-in relative mt-3 w-full rounded-xl border border-border border-l-4 border-l-[#d98a0b] bg-surface p-3.5 shadow-[0_14px_30px_-18px_rgba(15,27,51,0.4)] sm:absolute sm:right-0 sm:top-[42%] sm:mt-0 sm:w-[40%]"
        style={{ "--d": "1.95s" } as React.CSSProperties}
      >
        <p className="text-[13px] font-semibold text-warn">Deadline is ambiguous</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          No year and no time zone. We will not guess a date. Ask the organizer.
        </p>
      </div>

      {/* Note: what you do next */}
      <div
        className="note-in relative mt-3 w-full rounded-xl border border-border bg-surface p-3.5 shadow-[0_14px_30px_-18px_rgba(15,27,51,0.4)] sm:absolute sm:bottom-0 sm:left-[8%] sm:mt-0 sm:w-[50%]"
        style={{ "--d": "2.3s" } as React.CSSProperties}
      >
        <p className="text-[13px] font-semibold">Your checklist</p>
        <ul className="mt-2 space-y-1.5 text-xs">
          {[
            ["Prepare: Official transcript", true],
            ["Prepare: Statement of purpose", true],
            ["Confirm the closing date", false],
          ].map(([label, done]) => (
            <li key={label as string} className="flex items-center gap-2">
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  done ? "border-accent bg-accent text-white" : "border-border bg-white"
                }`}
                aria-hidden
              >
                {done ? <Check size={11} strokeWidth={3} /> : null}
              </span>
              <span className={done ? "text-muted line-through" : ""}>{label as string}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
