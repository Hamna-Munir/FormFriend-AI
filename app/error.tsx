"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <AlertTriangle size={40} className="mx-auto text-warn" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted">
        The page hit an unexpected problem. Your saved opportunities are not affected. Try again, or go
        back to the start.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="accent" onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">Home</ButtonLink>
      </div>
    </div>
  );
}
