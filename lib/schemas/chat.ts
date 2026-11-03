import { z } from "zod";
import { BilingualSchema } from "./analysis";

export const MAX_QUESTION_CHARS = 500;

export const ChatTurnSchema = z.object({
  question: z.string().trim().min(1).max(MAX_QUESTION_CHARS),
  /** The English answer that was shown, kept only as conversation context. */
  answer: z.string().trim().max(1200),
});

export const ChatRequestSchema = z.object({
  question: z.string().trim().min(3).max(MAX_QUESTION_CHARS),
  history: z.array(ChatTurnSchema).max(4).default([]),
  pages: z
    .array(z.object({ page: z.number().int().positive().max(10_000), text: z.string().max(60_000) }))
    .min(1)
    .max(60),
  /** False for pasted text: there are no real page numbers to cite. */
  hasPageNumbers: z.boolean(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** What the model must return. */
export const ChatModelSchema = z.object({
  grounded: z.boolean(),
  answer: BilingualSchema,
  citations: z.array(z.object({ quote: z.string(), page: z.number().int().positive().nullable() })),
});

export type AnswerStatus =
  /** Backed by at least one quote that was found in the document. */
  | "grounded"
  /** The document does not answer the question. */
  | "not_in_document"
  /** The model claimed the document says so, but no quote could be matched. Treat with caution. */
  | "unverified";

export type ChatResponse = {
  status: AnswerStatus;
  answer: { en: string; ur: string };
  citations: Array<{ quote: string; page: number | null }>;
};

export function chatJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(ChatModelSchema, { io: "input" }) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}
