import { SavedOpportunitySchema, type SavedOpportunity } from "@/lib/schemas/opportunity";
import type { Analysis } from "@/lib/schemas/analysis";
import type { EligibilityResponse } from "@/lib/schemas/eligibility";
import { buildChecklist } from "@/lib/utils/checklist";

const KEY = "formfriend:opportunities:v1";

export type StoreResult<T> = { ok: true; value: T } | { ok: false; reason: "quota" | "unavailable" };

/** Reads every saved opportunity. Entries that fail validation are skipped, never crash the page. */
export function listOpportunities(): SavedOpportunity[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: SavedOpportunity[] = [];
    for (const item of arr) {
      const parsed = SavedOpportunitySchema.safeParse(item);
      if (parsed.success) out.push(parsed.data);
    }
    return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

function writeAll(list: SavedOpportunity[]): StoreResult<true> {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return { ok: true, value: true };
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
    return { ok: false, reason: quota ? "quota" : "unavailable" };
  }
}

export function getOpportunity(id: string): SavedOpportunity | null {
  return listOpportunities().find((o) => o.id === id) ?? null;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function saveOpportunity(input: {
  origin: "upload" | "sample";
  sampleId: string | null;
  analysis: Analysis;
  pages: Array<{ page: number; text: string }>;
  hasPageNumbers?: boolean;
}): StoreResult<SavedOpportunity> {
  const all = listOpportunities();

  // Saving the same sample twice just opens the existing copy (and keeps its progress).
  if (input.sampleId) {
    const existing = all.find((o) => o.sampleId === input.sampleId);
    if (existing) return { ok: true, value: existing };
  }

  const record: SavedOpportunity = {
    id: newId(),
    savedAt: new Date().toISOString(),
    origin: input.origin,
    sampleId: input.sampleId,
    analysis: input.analysis,
    pages: input.pages,
    hasPageNumbers: input.hasPageNumbers ?? true,
    checklist: buildChecklist(input.analysis),
    done: {},
    eligibility: null,
    eligibilityCheckedAt: null,
  };
  const res = writeAll([record, ...all]);
  return res.ok ? { ok: true, value: record } : res;
}

function update(id: string, fn: (o: SavedOpportunity) => SavedOpportunity): StoreResult<SavedOpportunity> {
  const all = listOpportunities();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return { ok: false, reason: "unavailable" };
  const next = fn(all[idx]);
  all[idx] = next;
  const res = writeAll(all);
  return res.ok ? { ok: true, value: next } : res;
}

export function setTaskDone(id: string, taskId: string, done: boolean) {
  return update(id, (o) => ({ ...o, done: { ...o.done, [taskId]: done } }));
}

export function setEligibility(id: string, result: EligibilityResponse) {
  return update(id, (o) => ({ ...o, eligibility: result, eligibilityCheckedAt: new Date().toISOString() }));
}

export function deleteOpportunity(id: string): boolean {
  const all = listOpportunities();
  return writeAll(all.filter((o) => o.id !== id)).ok;
}
