import "server-only";
import {
  EligibilityModelSchema,
  eligibilityJsonSchema,
  profileIsEmpty,
  type CriterionInput,
  type CriterionResult,
  type EligibilityResponse,
  type Profile,
} from "@/lib/schemas/eligibility";
import { chatJson, MetaApiError } from "./meta-client";
import { computeOverall } from "@/lib/utils/overall";
import { ELIGIBILITY_SYSTEM_PROMPT, buildEligibilityUserMessage } from "./prompts";

function squash(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

const NO_INFO: CriterionResult["reason"] = {
  en: "Your profile does not give enough information to check this. Confirm it yourself against the original document.",
  ur: "Aap ki profile mein is ko check karne ke liye kaafi maloomat nahi hain. Asal document se khud confirm karein.",
};

function count(results: CriterionResult[]): EligibilityResponse["counts"] {
  return {
    met: results.filter((r) => r.verdict === "met").length,
    not_met: results.filter((r) => r.verdict === "not_met").length,
    needs_verification: results.filter((r) => r.verdict === "needs_verification").length,
  };
}

export async function matchEligibility(
  criteria: CriterionInput[],
  profile: Profile,
): Promise<EligibilityResponse> {
  // Nothing to compare against: do not ask the model to guess.
  if (profileIsEmpty(profile)) {
    const results = criteria.map((c) => ({
      criterionId: c.id,
      verdict: "needs_verification" as const,
      profileEvidence: null,
      reason: NO_INFO,
    }));
    return { results, overall: computeOverall(criteria, results), counts: count(results) };
  }

  const raw = await chatJson({
    messages: [
      { role: "system", content: ELIGIBILITY_SYSTEM_PROMPT },
      { role: "user", content: buildEligibilityUserMessage(criteria, profile) },
    ],
    schemaName: "EligibilityMatch",
    schema: eligibilityJsonSchema(),
  });

  let modelOut;
  try {
    modelOut = EligibilityModelSchema.parse(JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")));
  } catch {
    throw new MetaApiError("bad_output", "The AI answer could not be understood. Please try again.");
  }

  const profileText = squash(Object.values(profile).join(" "));
  const byId = new Map(modelOut.results.map((r) => [r.criterionId, r]));

  const results: CriterionResult[] = criteria.map((c) => {
    const r = byId.get(c.id);
    // The model skipped this criterion: say so instead of leaving a gap.
    if (!r) return { criterionId: c.id, verdict: "needs_verification", profileEvidence: null, reason: NO_INFO };

    // A "met" or "not met" verdict must point at text that really is in the student's profile.
    if (r.verdict !== "needs_verification") {
      const ev = r.profileEvidence ? squash(r.profileEvidence) : "";
      if (ev.length < 2 || !profileText.includes(ev)) {
        return { criterionId: c.id, verdict: "needs_verification", profileEvidence: null, reason: NO_INFO };
      }
    }
    return { criterionId: c.id, verdict: r.verdict, profileEvidence: r.profileEvidence, reason: r.reason };
  });

  return { results, overall: computeOverall(criteria, results), counts: count(results) };
}
