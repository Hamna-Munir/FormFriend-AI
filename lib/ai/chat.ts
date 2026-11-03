import "server-only";
import { ChatModelSchema, chatJsonSchema, type ChatRequest, type ChatResponse } from "@/lib/schemas/chat";
import { chatJson, CONTEXT_CHARS, MetaApiError } from "./meta-client";
import { buildChatUserMessage, CHAT_SYSTEM_PROMPT } from "./prompts";
import { selectPages } from "./select";
import { locateQuote } from "./verify";

/** About 8k tokens of document per question. */
const CONTEXT_BUDGET = 30_000;

export async function answerQuestion(req: ChatRequest): Promise<ChatResponse> {
  const context = selectPages(req.pages, req.question, Math.min(CONTEXT_BUDGET, CONTEXT_CHARS));

  const raw = await chatJson({
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: buildChatUserMessage(context, req.hasPageNumbers, req.history, req.question) },
    ],
    schemaName: "DocumentAnswer",
    schema: chatJsonSchema(),
  });

  let out;
  try {
    out = ChatModelSchema.parse(JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")));
  } catch {
    throw new MetaApiError("bad_output", "The AI answer could not be understood. Please ask again.");
  }

  if (!out.grounded) {
    return { status: "not_in_document", answer: out.answer, citations: [] };
  }

  // Keep only quotes that really appear in the document. Check against the FULL document,
  // not just the pages the model saw, so a correct quote is never dropped.
  const citations: ChatResponse["citations"] = [];
  for (const c of out.citations.slice(0, 3)) {
    const found = locateQuote(c.quote, req.pages, req.hasPageNumbers);
    if (found.verified) citations.push({ quote: c.quote, page: found.page });
  }

  return { status: citations.length > 0 ? "grounded" : "unverified", answer: out.answer, citations };
}
