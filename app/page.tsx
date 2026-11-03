import { CalendarClock, Languages, Quote, UserCheck } from "lucide-react";
import { EvidenceDiagram } from "@/components/illustrations/evidence-diagram";
import { HeroDocument } from "@/components/illustrations/hero-document";
import { HackathonArt, InternshipArt, ScholarshipArt } from "@/components/illustrations/sample-art";
import { PrepareArt, UnderstandArt, UploadArt } from "@/components/illustrations/step-art";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_SAMPLES } from "@/lib/demo/samples";

const steps = [
  {
    Art: UploadArt,
    title: "Upload",
    text: "Drop in a PDF, a screenshot or a photo of the instructions. Or paste the text.",
  },
  {
    Art: UnderstandArt,
    title: "Understand",
    text: "See eligibility, documents, fees and dates in plain language. Each one comes with a quote from the original.",
  },
  {
    Art: PrepareArt,
    title: "Prepare",
    text: "Check yourself against the criteria and follow a checklist built from the real requirements.",
  },
];

const principles = [
  {
    icon: Quote,
    title: "Every claim has a quote",
    text: "Requirements link back to the exact sentence and page they came from.",
  },
  {
    icon: CalendarClock,
    title: "Deadlines are never guessed",
    text: "If a date has no year or time zone, we say so instead of filling the gap.",
  },
  {
    icon: UserCheck,
    title: "Honest eligibility",
    text: "Each criterion is met, not met, or needs verification. Never a vague “you qualify”.",
  },
  {
    icon: Languages,
    title: "English and Roman Urdu",
    text: "Plain explanations in English, with a Roman Urdu option on every answer.",
  },
];

const sampleArt = { scholarship: ScholarshipArt, internship: InternshipArt, hackathon: HackathonArt } as const;
const samplePanel = {
  scholarship: "bg-accent-soft",
  internship: "bg-warn-soft",
  hackathon: "bg-violet-soft",
} as const;

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="dots pointer-events-none absolute inset-0 h-[560px]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:pt-20">
          <div>
            <Badge tone="accent">For students applying to opportunities</Badge>
            <h1 className="mt-5 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Understand the form before you submit it.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Students lose scholarships and internships over confusing instructions and missed
              documents. FormFriend AI reads the application for you, explains the hard parts, and
              turns the requirements into a checklist you can finish.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/analyze" variant="accent" size="lg">
                Analyze a document
              </ButtonLink>
              <ButtonLink href="/demo/scholarship" variant="outline" size="lg">
                See a sample result
              </ButtonLink>
            </div>
            <p className="mt-5 max-w-md text-sm text-muted">
              Works with PDFs, screenshots and pasted text. Nothing is submitted for you.
            </p>
          </div>
          <HeroDocument />
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
            From a confusing PDF to a checklist you can finish
          </h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title}>
                <Card lift="strong" className="h-full">
                  <div className="lift-icon flex h-28 items-center justify-center rounded-xl bg-background">
                    <div className="h-24 w-36">
                      <s.Art />
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-medium text-accent">Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
          A wrong answer about a deadline is worse than no answer.
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">
          So the app checks its own work. If it cannot find a claim in your document, it tells you
          instead of presenting it as fact.
        </p>
        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EvidenceDiagram />
          </div>
          <ul className="grid gap-3 lg:col-span-2">
            {principles.map((p) => (
              <li key={p.title}>
                <Card lift="strong" className="flex gap-4 !p-4">
                  <span className="lift-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <p.icon size={20} aria-hidden />
                  </span>
                  <span>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{p.text}</p>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Try it on a sample document</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Fictional documents with a prepared reference result. They are labelled as samples and
            are not live AI output.
          </p>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {DEMO_SAMPLES.map((s) => {
              const Art = sampleArt[s.kind];
              const closes = s.analysis.dates.find((d) => d.label === "closes");
              const verified = closes?.status === "verified";
              return (
                <li key={s.id}>
                  <Card lift="strong" className="flex h-full flex-col !p-0 overflow-hidden">
                    <div className={`lift-icon flex h-32 items-center justify-center ${samplePanel[s.kind]}`}>
                      <div className="h-20 w-28">
                        <Art />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="capitalize">{s.kind}</Badge>
                        <Badge tone={verified ? "ok" : "warn"}>
                          Deadline {verified ? "verified" : "ambiguous"}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted">{s.blurb}</p>
                      <p className="mt-3 text-sm">
                        <span className="font-medium">Tests: </span>
                        <span className="text-muted">{s.tests}</span>
                      </p>
                      <div className="mt-5 flex-1" />
                      <ButtonLink href={`/demo/${s.id}`} variant="outline" size="sm">
                        Open sample
                      </ButtonLink>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-white sm:px-14">
          <svg className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-10" viewBox="0 0 200 200" fill="none" aria-hidden>
            <circle cx="100" cy="100" r="95" stroke="white" strokeWidth="2" />
            <circle cx="100" cy="100" r="65" stroke="white" strokeWidth="2" />
            <circle cx="100" cy="100" r="35" stroke="white" strokeWidth="2" />
          </svg>
          <h2 className="relative max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight sm:text-4xl">
            Have an application open right now?
          </h2>
          <p className="relative mt-3 max-w-lg text-white/80">
            Upload it, check the deadline, and know what to prepare before you start filling anything in.
          </p>
          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/analyze" variant="outline" size="lg" className="border-white bg-white text-foreground hover:bg-white/90">
              Analyze a document
            </ButtonLink>
            <ButtonLink href="/saved" variant="ghost" size="lg" className="text-white hover:bg-white/10">
              My opportunities
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
