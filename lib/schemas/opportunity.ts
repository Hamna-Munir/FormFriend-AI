import { z } from "zod";
import { AnalysisSchema, EvidenceSchema } from "./analysis";
import { EligibilityResponseSchema } from "./eligibility";

export const ChecklistGroupSchema = z.enum([
  "eligibility",
  "documents",
  "submission",
  "deadline",
  "fees",
  "questions",
  "general",
]);
export type ChecklistGroup = z.infer<typeof ChecklistGroupSchema>;

export const ChecklistItemSchema = z.object({
  /** Stable id derived from the analysis, so progress survives re-renders. */
  id: z.string(),
  title: z.string(),
  detail: z.string().nullable(),
  /** "from_document" tasks are backed by the document. "recommended" ones are our suggestions. */
  kind: z.enum(["from_document", "recommended"]),
  required: z.boolean(),
  group: ChecklistGroupSchema,
  evidence: EvidenceSchema.nullable(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const SavedOpportunitySchema = z.object({
  id: z.string(),
  savedAt: z.string(),
  origin: z.enum(["upload", "sample"]),
  sampleId: z.string().nullable(),
  analysis: AnalysisSchema,
  /** Extracted document text, kept so "Ask your document" can answer from it. */
  pages: z.array(z.object({ page: z.number(), text: z.string() })),
  /** False when the text was pasted, so there are no real page numbers to cite. */
  hasPageNumbers: z.boolean().default(true),
  checklist: z.array(ChecklistItemSchema),
  /** taskId -> completed */
  done: z.record(z.string(), z.boolean()),
  eligibility: EligibilityResponseSchema.nullable(),
  eligibilityCheckedAt: z.string().nullable(),
});
export type SavedOpportunity = z.infer<typeof SavedOpportunitySchema>;
