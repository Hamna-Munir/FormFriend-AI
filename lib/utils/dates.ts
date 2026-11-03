import type { DateItem } from "@/lib/schemas/analysis";

export type DeadlineState =
  /** Exact instant known (date, time and offset). Safe to count down. */
  | { kind: "countdown"; ms: number }
  /** Exact instant known and it is in the past. */
  | { kind: "passed" }
  /** Only a calendar date is known, so the cutoff moment depends on an unknown time zone. */
  | { kind: "approx"; days: number }
  /** Date is close but the time zone is unknown, so we cannot say whether it is still open. */
  | { kind: "check_zone" }
  /** Calendar date is clearly in the past (more than a day ago in any time zone). */
  | { kind: "passed_by_date" }
  /** We refuse to compute anything. */
  | { kind: "unreliable"; reason: string };

const HAS_OFFSET = /(Z|[+-]\d{2}:\d{2})$/;
const DATE_PART = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_DAY = 86_400_000;

/**
 * Decides what we may honestly say about a deadline.
 * Never assumes a time zone and never treats an ambiguous date as reliable.
 */
export function deadlineState(d: DateItem, now: Date): DeadlineState {
  if (d.status !== "verified" || !d.normalizedISO) {
    return {
      kind: "unreliable",
      reason:
        d.status === "ambiguous"
          ? "This date is ambiguous, so no countdown is shown."
          : "No date was found, so no countdown is shown.",
    };
  }

  const iso = d.normalizedISO;

  if (iso.includes("T") && HAS_OFFSET.test(iso)) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return { kind: "unreliable", reason: "The date could not be read." };
    const ms = t - now.getTime();
    return ms > 0 ? { kind: "countdown", ms } : { kind: "passed" };
  }

  // Date only (or time without a zone): compare calendar days in the viewer's zone and be modest.
  const m = DATE_PART.exec(iso);
  if (!m) return { kind: "unreliable", reason: "The date could not be read." };
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - today) / MS_DAY);

  if (days < -1) return { kind: "passed_by_date" };
  if (days <= 1) return { kind: "check_zone" };
  return { kind: "approx", days };
}

export function formatCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"}`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}, ${minutes} min`;
  return `${Math.max(minutes, 1)} min`;
}
