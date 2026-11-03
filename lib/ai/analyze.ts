import "server-only";
import { AnalysisSchema, analysisJsonSchema, type Analysis } from "@/lib/schemas/analysis";
import { chatJson, CONTEXT_CHARS, MetaApiError } from "./meta-client";
import { selectPages } from "./select";
import { ANALYZE_SYSTEM_PROMPT, buildAnalyzeUserMessage } from "./prompts";
import { verifyAnalysis, type SourcePage } from "./verify";

export type AnalyzeInput = {
  pages: SourcePage[];
  /** "paste" has no real page numbers. */
  source: "pdf" | "ocr" | "paste";
};

export type AnalyzeResult = {
  analysis: Analysis;
  warnings: string[];
};

function parseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

/** Short, document-free description of what was wrong, to help the model fix its output. */
function describeIssues(err: unknown): string {
  if (err instanceof SyntaxError) return "The output was not valid JSON.";
  const issues = (err as { issues?: Array<{ path: PropertyKey[]; message: string }> })?.issues;
  if (!issues) return "The output did not match the schema.";
  return issues
    .slice(0, 6)
    .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export async function analyzeDocument(input: AnalyzeInput): Promise<AnalyzeResult> {
  const hasPageNumbers = input.source !== "paste";
  const schema = analysisJsonSchema();
  // Long documents are trimmed to the pages most likely to hold deadlines, eligibility and documents.
  const sent = selectPages(
    input.pages,
    "application deadline closing date eligibility requirements required documents fee how to submit selection",
    CONTEXT_CHARS,
  );
  const userMessage = buildAnalyzeUserMessage(sent, hasPageNumbers);

  const baseMessages = [
    { role: "system" as const, content: ANALYZE_SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  let parsed: Analysis | null = null;
  let lastIssue = "";

  // One retry: if the first answer is invalid, tell the model what was wrong and ask again.
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const messages =
      attempt === 0
        ? baseMessages
        : [
            ...baseMessages,
            {
              role: "user" as const,
              content: `Your previous answer was rejected: ${lastIssue} Return corrected JSON only.`,
            },
          ];
    const raw = await chatJson({ messages, schemaName: "ApplicationAnalysis", schema });
    try {
      parsed = AnalysisSchema.parse(parseJson(raw));
    } catch (err) {
      lastIssue = describeIssues(err);
    }
  }

  if (!parsed) {
    throw new MetaApiError(
      "bad_output",
      "The AI answer could not be understood. Please try again, or paste a shorter section of the document.",
    );
  }

  const { analysis, unverifiedCount } = verifyAnalysis(parsed, input.pages, hasPageNumbers);
  const warnings: string[] = [];
  if (unverifiedCount > 0) {
    warnings.push(
      `${unverifiedCount} quoted passage(s) could not be matched to your document and are marked as unverified. Check them against the original.`,
    );
  }
  return { analysis, warnings };
}
