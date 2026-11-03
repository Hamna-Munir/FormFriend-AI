import { cn } from "@/lib/utils/cn";

/**
 * lift: how the card moves when you hover it.
 *  - "subtle" (default): a small raise, for content cards
 *  - "strong": a clear raise with an icon nudge, for cards that are the main thing to click
 *  - "none": no movement, for cards that contain forms (a form should not move while you type)
 */
export function Card({
  className,
  children,
  lift = "subtle",
}: {
  className?: string;
  children: React.ReactNode;
  lift?: "none" | "subtle" | "strong";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 sm:p-6",
        lift === "strong" && "lift",
        lift === "subtle" && "lift-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
  icon: Icon,
}: {
  children: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Icon size={17} aria-hidden />
          </span>
        ) : null}
        {children}
      </h2>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
