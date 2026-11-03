import test from "node:test";
import assert from "node:assert/strict";
import { deadlineState, formatCountdown } from "@/lib/utils/dates";
import type { DateItem } from "@/lib/schemas/analysis";

const base: DateItem = {
  label: "closes",
  originalText: "x",
  normalizedISO: null,
  timezone: null,
  status: "not_specified",
  note: null,
  evidence: null,
};
const item = (over: Partial<DateItem>): DateItem => ({ ...base, ...over });
const now = new Date("2026-10-22T10:00:00+05:00");

const cases: Array<[string, Partial<DateItem>, string]> = [
  ["exact future with offset gives a countdown", { status: "verified", normalizedISO: "2027-03-15T17:00:00+05:00" }, "countdown"],
  ["exact past with offset is passed", { status: "verified", normalizedISO: "2026-10-01T17:00:00+05:00" }, "passed"],
  ["Z timestamp counts down", { status: "verified", normalizedISO: "2026-10-23T00:00:00Z" }, "countdown"],
  ["date only, far future: approximate only", { status: "verified", normalizedISO: "2027-03-15" }, "approx"],
  ["date only, tomorrow: cannot say if open", { status: "verified", normalizedISO: "2026-10-23" }, "check_zone"],
  ["date only, today: cannot say if open", { status: "verified", normalizedISO: "2026-10-22" }, "check_zone"],
  ["date only, long ago: passed by date", { status: "verified", normalizedISO: "2026-09-01" }, "passed_by_date"],
  ["time without a zone is not trusted as exact", { status: "verified", normalizedISO: "2027-03-15T17:00:00" }, "approx"],
  ["ambiguous status never counts down", { status: "ambiguous", normalizedISO: null }, "unreliable"],
  ["verified without a date is unreliable", { status: "verified", normalizedISO: null }, "unreliable"],
  ["not specified is unreliable", { status: "not_specified" }, "unreliable"],
  ["garbage ISO is unreliable", { status: "verified", normalizedISO: "tomorrow" }, "unreliable"],
  ["ambiguous status wins even if an ISO is present", { status: "ambiguous", normalizedISO: "2027-03-15T17:00:00+05:00" }, "unreliable"],
];

for (const [name, over, want] of cases) {
  test(`deadlineState: ${name}`, () => {
    assert.equal(deadlineState(item(over), now).kind, want);
  });
}

test("formatCountdown", () => {
  assert.equal(formatCountdown(2 * 86_400_000 + 3 * 3_600_000), "2 days, 3 hours");
  assert.equal(formatCountdown(86_400_000 + 3_600_000), "1 day, 1 hour");
  assert.equal(formatCountdown(5 * 3_600_000 + 10 * 60_000), "5 hours, 10 min");
  assert.equal(formatCountdown(30_000), "1 min");
});
