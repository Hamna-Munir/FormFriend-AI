import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">That page does not exist. Try one of these instead.</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href="/analyze" variant="accent">Analyze a document</ButtonLink>
        <ButtonLink href="/saved" variant="outline">My opportunities</ButtonLink>
      </div>
    </div>
  );
}
