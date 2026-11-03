import type { CriterionInput, CriterionResult, OverallStatus } from "@/lib/schemas/eligibility";

/** Overall status is computed here, never by the model. */
export function computeOverall(criteria: CriterionInput[], results: CriterionResult[]): OverallStatus {
  if (criteria.length === 0) return "no_criteria_found";
  const mandatory = new Set(criteria.filter((c) => c.mandatory).map((c) => c.id));
  const mandatoryResults = results.filter((r) => mandatory.has(r.criterionId));
  if (mandatoryResults.some((r) => r.verdict === "not_met")) return "not_eligible_per_criteria";
  if (mandatoryResults.some((r) => r.verdict === "needs_verification")) return "cannot_confirm";
  if (mandatoryResults.length === 0) return "cannot_confirm";
  return "meets_listed_criteria";
}
