import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { EligibilityPanel } from "@/components/eligibility/eligibility-panel";
import { SaveButton } from "@/components/saved/save-button";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DEMO_SAMPLES, getSample, samplePages } from "@/lib/demo/samples";

export function generateStaticParams() {
  return DEMO_SAMPLES.map((s) => ({ id: s.id }));
}

export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = getSample(id);
  if (!sample) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} aria-hidden /> Back
      </Link>

      <div className="mb-6 flex flex-wrap gap-2">
        {DEMO_SAMPLES.map((s) => (
          <Link
            key={s.id}
            href={`/demo/${s.id}`}
            aria-current={s.id === sample.id ? "page" : undefined}
            className={
              s.id === sample.id
                ? "rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-[#f0f3f8]"
            }
          >
            {s.title}
          </Link>
        ))}
      </div>

      <details className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-medium">View the original (fictional) document text</summary>
        <pre className="mt-3 whitespace-pre-wrap font-sans leading-relaxed text-muted">{sample.text}</pre>
      </details>

      <div className="mb-6">
        <SaveButton analysis={sample.analysis} pages={samplePages(sample)} origin="sample" sampleId={sample.id} />
      </div>

      <AnalysisView analysis={sample.analysis} sourceLabel="Sample result, not live AI output" />
      <div className="mt-6">
        <EligibilityPanel key={sample.id} analysis={sample.analysis} />
      </div>
      <div className="mt-6">
        <ChatPanel key={sample.id} pages={samplePages(sample)} />
      </div>
    </div>
  );
}
