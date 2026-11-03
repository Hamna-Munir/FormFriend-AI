import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <FileCheck2 size={18} aria-hidden />
          </span>
          FormFriend AI
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/demo/scholarship"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground sm:block"
          >
            Demo
          </Link>
          <Link href="/saved" className="rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground">
            Saved
          </Link>
          <ButtonLink href="/analyze" size="sm" variant="accent">
            Analyze a document
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
              <FileCheck2 size={15} aria-hidden />
            </span>
            FormFriend AI
          </Link>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            FormFriend AI helps you understand application documents. It can make mistakes, so
            always check deadlines and requirements against the original instructions. It never
            submits applications for you.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/analyze" className="text-muted hover:text-foreground">Analyze a document</Link>
          <Link href="/saved" className="text-muted hover:text-foreground">My opportunities</Link>
          <Link href="/demo/scholarship" className="text-muted hover:text-foreground">Sample: scholarship</Link>
          <Link href="/demo/internship" className="text-muted hover:text-foreground">Sample: internship</Link>
          <Link href="/demo/hackathon" className="text-muted hover:text-foreground">Sample: hackathon</Link>
        </nav>
      </div>
    </footer>
  );
}
