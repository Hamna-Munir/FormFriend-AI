import type { Analysis } from "@/lib/schemas/analysis";
import type { ChecklistGroup, ChecklistItem } from "@/lib/schemas/opportunity";

/** Fee texts that mean "nothing to pay or unknown", so no task is needed. */
const NO_FEE = /^(not specified|none|no\b|free\b|n\/a)/i;

export const GROUP_LABEL: Record<ChecklistGroup, string> = {
  eligibility: "Confirm you are eligible",
  documents: "Prepare your documents",
  submission: "Submit the application",
  deadline: "Deadline",
  fees: "Fees",
  questions: "Questions to ask the organizer",
  general: "Before you submit",
};

export const GROUP_ORDER: ChecklistGroup[] = [
  "eligibility",
  "documents",
  "submission",
  "deadline",
  "fees",
  "questions",
  "general",
];

/**
 * Builds the checklist from what the document says. Every task either comes from the
 * document ("from_document", with its quote) or is clearly labelled "recommended".
 * Pure and deterministic: the same analysis always gives the same ids.
 */
export function buildChecklist(a: Analysis): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const c of a.eligibility.filter((c) => c.mandatory).slice(0, 8)) {
    items.push({
      id: `elig:${c.id}`,
      title: `Confirm: ${c.requirement}`,
      detail: c.explanation.en,
      kind: "from_document",
      required: true,
      group: "eligibility",
      evidence: c.evidence,
    });
  }

  for (const d of a.requiredDocuments) {
    items.push({
      id: `doc:${d.id}`,
      title: `Prepare: ${d.name}`,
      detail: d.explanation.en,
      kind: "from_document",
      required: d.mandatory,
      group: "documents",
      evidence: d.evidence,
    });
  }

  a.submissionInstructions.forEach((s, i) => {
    items.push({
      id: `submit:${i}`,
      title: s.step,
      detail: null,
      kind: "from_document",
      required: true,
      group: "submission",
      evidence: s.evidence,
    });
  });

  const closes = a.dates.filter((d) => d.label === "closes");
  if (closes.length === 0) {
    items.push({
      id: "deadline:missing",
      title: "Find the closing date: the document does not state one",
      detail: "Check the organizer's website or ask them directly.",
      kind: "recommended",
      required: true,
      group: "deadline",
      evidence: null,
    });
  }
  closes.forEach((d, i) => {
    const reliable = d.status === "verified";
    items.push({
      id: `deadline:${i}`,
      title: reliable
        ? `Submit before the deadline: ${d.originalText}`
        : `Confirm the exact closing date and time zone (document says: “${d.originalText}”)`,
      detail: reliable
        ? d.timezone
          ? `Time zone stated: ${d.timezone}.`
          : "No time zone is given. Aim to submit well before the day ends."
        : (d.note ?? "The date is not exact, so check it with the organizer."),
      kind: "from_document",
      required: true,
      group: "deadline",
      evidence: d.evidence,
    });
  });

  if (a.fees.text && !NO_FEE.test(a.fees.text.trim())) {
    items.push({
      id: "fees",
      title: `Check the fee: ${a.fees.text}`,
      detail: null,
      kind: "from_document",
      required: false,
      group: "fees",
      evidence: a.fees.evidence,
    });
  }

  a.unresolved.slice(0, 8).forEach((u, i) => {
    items.push({
      id: `ask:${i}`,
      title: `Ask the organizer: ${u}`,
      detail: "The document does not answer this.",
      kind: "recommended",
      required: false,
      group: "questions",
      evidence: null,
    });
  });

  items.push({
    id: "final-review",
    title: "Re-read the original instructions once before you submit",
    detail: "FormFriend AI can make mistakes. The original document is the final word.",
    kind: "recommended",
    required: false,
    group: "general",
    evidence: null,
  });

  return items;
}

export function progress(items: ChecklistItem[], done: Record<string, boolean>) {
  const total = items.length;
  const completed = items.filter((i) => done[i.id]).length;
  return { total, completed, pct: total === 0 ? 0 : Math.round((completed / total) * 100) };
}
