import { z } from "zod";

/** A quote copied from the source document that backs up a claim. */
export const EvidenceSchema = z.object({
  quote: z.string().min(1).max(600),
  page: z.number().int().positive().nullable(),
  /**
   * Set by the server after checking the quote against the source text.
   * The model never produces this field.
   */
  verified: z.boolean().optional(),
});

/** explicit = stated in the document; inferred = AI interpretation; unclear = needs checking. */
export const BasisSchema = z.enum(["explicit", "inferred", "needs_verification"]);

export const BilingualSchema = z.object({
  en: z.string(),
  /** Roman Urdu explanation */
  ur: z.string(),
});

export const OpportunityTypeSchema = z.enum([
  "scholarship",
  "internship",
  "competition",
  "hackathon",
  "other",
]);

export const DateItemSchema = z.object({
  label: z.enum(["opens", "closes", "other"]),
  /** Exactly how the document words the date. */
  originalText: z.string(),
  /** ISO 8601 date/time, ONLY if the document makes it unambiguous. Otherwise null. */
  normalizedISO: z.string().nullable(),
  /** Time zone as written in the document, or null if absent. */
  timezone: z.string().nullable(),
  status: z.enum(["verified", "ambiguous", "not_specified"]),
  note: z.string().nullable(),
  evidence: EvidenceSchema.nullable(),
});

export const EligibilityCriterionSchema = z.object({
  id: z.string(),
  category: z.enum(["academic", "age", "nationality", "location", "experience", "other"]),
  requirement: z.string(),
  mandatory: z.boolean(),
  basis: BasisSchema,
  evidence: EvidenceSchema.nullable(),
  explanation: BilingualSchema,
});

export const RequiredDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mandatory: z.boolean(),
  basis: BasisSchema,
  evidence: EvidenceSchema.nullable(),
  explanation: BilingualSchema,
});

export const LinkSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const AnalysisSchema = z.object({
  opportunity: z.object({
    name: z.string(),
    type: OpportunityTypeSchema,
    organizer: z.string().nullable(),
    summary: BilingualSchema,
  }),
  dates: z.array(DateItemSchema),
  eligibility: z.array(EligibilityCriterionSchema),
  requiredDocuments: z.array(RequiredDocumentSchema),
  submissionInstructions: z.array(
    z.object({
      step: z.string(),
      evidence: EvidenceSchema.nullable(),
    }),
  ),
  fees: z.object({
    text: z.string(),
    evidence: EvidenceSchema.nullable(),
  }),
  selectionProcess: z.array(
    z.object({
      step: z.string(),
      evidence: EvidenceSchema.nullable(),
    }),
  ),
  links: z.array(LinkSchema),
  /** Things the document does not settle. Shown to the student as open questions. */
  unresolved: z.array(z.string()),
});

/** JSON Schema sent to the model. Server-only fields (`verified`) are removed. */
export function analysisJsonSchema(): Record<string, unknown> {
  const strip = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(strip);
    if (node && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === "properties" && v && typeof v === "object") {
          const props = { ...(v as Record<string, unknown>) };
          delete props.verified;
          out[k] = strip(props);
        } else if (k === "required" && Array.isArray(v)) {
          out[k] = v.filter((x) => x !== "verified");
        } else {
          out[k] = strip(v);
        }
      }
      return out;
    }
    return node;
  };
  const schema = z.toJSONSchema(AnalysisSchema, { io: "input" }) as Record<string, unknown>;
  delete schema.$schema;
  return strip(schema) as Record<string, unknown>;
}

export type Evidence = z.infer<typeof EvidenceSchema>;
export type Basis = z.infer<typeof BasisSchema>;
export type DateItem = z.infer<typeof DateItemSchema>;
export type EligibilityCriterion = z.infer<typeof EligibilityCriterionSchema>;
export type RequiredDocument = z.infer<typeof RequiredDocumentSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
