"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { deadlineState, formatCountdown } from "@/lib/utils/dates";
import type { DateItem } from "@/lib/schemas/analysis";

/** Shows a countdown only when the deadline can be trusted. Otherwise says why not. */
export function DeadlineCountdown({ item }: { item: DateItem }) {
  // `now` starts null so server and client render the same HTML (no hydration mismatch).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;
  const s = deadlineState(item, now);

  let text: string;
  let tone = "text-muted";
  switch (s.kind) {
    case "countdown":
      text = `Closes in ${formatCountdown(s.ms)}`;
      tone = s.ms < 3 * 86_400_000 ? "text-warn font-medium" : "text-ok font-medium";
      break;
    case "passed":
      text = "This deadline has passed.";
      tone = "text-danger font-medium";
      break;
    case "passed_by_date":
      text = "This date appears to have passed. Confirm with the organizer before relying on it.";
      tone = "text-danger font-medium";
      break;
    case "approx":
      text = `About ${s.days} days away by calendar date. The exact cutoff time and time zone are not stated.`;
      break;
    case "check_zone":
      text = "This date is today or very close, and no time zone is given, so we cannot tell if it is still open. Check the organizer's page now.";
      tone = "text-warn font-medium";
      break;
    case "unreliable":
      text = s.reason;
      break;
  }

  return (
    <p className={`mt-2 flex items-start gap-1.5 text-sm ${tone}`} aria-live="polite">
      <Clock size={15} className="mt-0.5 shrink-0" aria-hidden />
      <span>{text}</span>
    </p>
  );
}
