import { z } from "zod";
import { BilingualSchema } from "./analysis";

const short = (max: number) => z.string().trim().max(max);

/** What the student tells us about themselves. Everything is optional and free text. */
export const ProfileSchema = z.object({
  educationLevel: short(60),
  degree: short(120),
  fieldOfStudy: short(120),
  country: short(80),
  graduationYear: short(10),
  skills: short(600),
  other: short(600),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const EMPTY_PROFILE: Profile = {
  educationLevel: "",
  degree: "",
  fieldOfStudy: "",
  country: "",
  graduationYear: "",
  skills: "",
  other: "",
};

export function profileIsEmpty(p: Profile): boolean {
  return Object.values(p).every((v) => v.trim() === "");
}

export const VerdictSchema = z.enum(["met", "not_met", "needs_verification"]);
export type Verdict = z.infer<typeof VerdictSchema>;

/** A criterion as sent to the matcher. The full document is NOT sent. */
export const CriterionInputSchema = z.object({
  id: short(40),
  category: short(30),
  requirement: short(500),
  mandatory: z.boolean(),
});
export type CriterionInput = z.infer<typeof CriterionInputSchema>;

export const EligibilityRequestSchema = z.object({
  criteria: z.array(CriterionInputSchema).min(1).max(40),
  profile: ProfileSchema,
});

/** What the model must return. */
export const EligibilityModelSchema = z.object({
  results: z.array(
    z.object({
      criterionId: z.string(),
      verdict: VerdictSchema,
      /** Exact text copied from the student's profile that the verdict is based on, or null. */
      profileEvidence: z.string().nullable(),
      reason: BilingualSchema,
    }),
  ),
});

/** What the client receives, after server-side checks. */
export const CriterionResultSchema = z.object({
  criterionId: z.string(),
  verdict: VerdictSchema,
  profileEvidence: z.string().nullable(),
  reason: BilingualSchema,
});
export type CriterionResult = z.infer<typeof CriterionResultSchema>;

export type OverallStatus =
  | "not_eligible_per_criteria"
  | "cannot_confirm"
  | "meets_listed_criteria"
  | "no_criteria_found";

export type EligibilityResponse = {
  results: CriterionResult[];
  overall: OverallStatus;
  counts: { met: number; not_met: number; needs_verification: number };
};

export function eligibilityJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(EligibilityModelSchema, { io: "input" }) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

export const EligibilityResponseSchema = z.object({
  results: z.array(CriterionResultSchema),
  overall: z.enum(["not_eligible_per_criteria", "cannot_confirm", "meets_listed_criteria", "no_criteria_found"]),
  counts: z.object({ met: z.number(), not_met: z.number(), needs_verification: z.number() }),
});
