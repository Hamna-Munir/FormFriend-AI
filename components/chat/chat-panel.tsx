"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, MessageSquare, Quote, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { MAX_QUESTION_CHARS, type AnswerStatus, type ChatResponse } from "@/lib/schemas/chat";

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; result: ChatResponse; question: string }
  | { role: "error"; text: string };

const SUGGESTIONS = [
  "What documents do I need?",
  "What is the deadline?",
  "Does this accept international students?",
  "What should I prepare first?",
  "Am I eligible for this?",
];

const STATUS_UI: Record<AnswerStatus, { label: string; tone: "ok" | "warn" | "danger"; Icon: typeof CheckCircle2 }> = {
  grounded: { label: "Backed by your document", tone: "ok", Icon: CheckCircle2 },
  not_in_document: { label: "Not in the document", tone: "warn", Icon: HelpCircle },
  unverified: { label: "Could not verify against the document", tone: "danger", Icon: AlertTriangle },
};

type ApiResponse = ({ ok: true } & ChatResponse) | { ok: false; message: string };

export function ChatPanel({
  pages,
  hasPageNumbers = true,
}: {
  pages: Array<{ page: number; text: string }>;
  hasPageNumbers?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ur, setUr] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [messages, busy]);

  const ask = async (raw: string) => {
    const question = raw.trim();
    if (question.length < 3 || busy) return;

    // The last few answered turns give the model context for follow-up questions.
    const history = messages
      .flatMap((m, i) => {
        const prev = messages[i - 1];
        return m.role === "assistant" && prev?.role === "user"
          ? [{ question: m.question.slice(0, MAX_QUESTION_CHARS), answer: m.result.answer.en.slice(0, 1200) }]
          : [];
      })
      .slice(-4);

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, pages, hasPageNumbers }),
      });
      const data = (await res.json().catch(() => null)) as ApiResponse | null;
      if (!data) throw new Error("The server sent an unexpected response. Please try again.");
      if (!data.ok) throw new Error(data.message);
      setMessages((m) => [
        ...m,
        { role: "assistant", question, result: { status: data.status, answer: data.answer, citations: data.citations } },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "error", text: e instanceof Error ? e.message : "Something went wrong. Please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card lift="none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle hint="Answers come only from this document, with the quote they are based on. If the document does not say, we will tell you.">
          <span className="inline-flex items-center gap-2">
            <MessageSquare size={20} className="text-accent" aria-hidden /> Ask your document
          </span>
        </SectionTitle>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ur} onChange={(e) => setUr(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            Roman Urdu
          </label>
          {messages.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={busy}>
              <Trash2 size={14} aria-hidden /> Clear
            </Button>
          ) : null}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-sm text-muted">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void ask(s)}
                disabled={busy}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4" aria-live="polite" aria-busy={busy}>
        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-white">{m.text}</p>
              </div>
            );
          }
          if (m.role === "error") {
            return (
              <div key={i} role="alert" className="flex gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
                <span>{m.text}</span>
              </div>
            );
          }
          const ui = STATUS_UI[m.result.status];
          return (
            <div key={i} className="max-w-[95%] rounded-2xl rounded-bl-sm border border-border bg-surface p-4">
              <Badge tone={ui.tone}>
                <ui.Icon size={12} aria-hidden /> {ui.label}
              </Badge>
              {m.result.status === "unverified" ? (
                <p className="mt-2 text-xs text-danger">
                  We could not match this answer to a quote in your document. Do not rely on it. Check the original.
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed">{ur ? m.result.answer.ur : m.result.answer.en}</p>
              {m.result.citations.map((c, j) => (
                <blockquote key={j} className="mt-2 flex gap-2 border-l-2 border-accent/40 pl-3 text-xs leading-relaxed text-muted">
                  <Quote size={12} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    “{c.quote}”{c.page ? <span className="ml-1 whitespace-nowrap">· page {c.page}</span> : null}
                  </span>
                </blockquote>
              ))}
            </div>
          );
        })}
        {busy ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={15} className="animate-spin" aria-hidden /> Reading your document…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="mt-4 flex gap-2"
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask a question about this document
        </label>
        <input
          id="chat-input"
          value={input}
          maxLength={MAX_QUESTION_CHARS}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document"
          disabled={busy}
          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-muted focus:border-accent"
        />
        <Button type="submit" variant="accent" disabled={busy || input.trim().length < 3} aria-label="Send question">
          <Send size={16} aria-hidden />
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </form>
    </Card>
  );
}
