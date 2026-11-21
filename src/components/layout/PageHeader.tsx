import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Short section label shown above the title, e.g. "Campus services". */
  eyebrow?: string;
  title: ReactNode;
  /** Optional second line, set in the muted sand tone like the landing headline. */
  accent?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * The page title block used across the signed-in app. It carries the landing
 * page's editorial voice (spaced capitals, serif display title, a thin rule)
 * into every module so the product reads as one piece.
 */
export function PageHeader({ eyebrow, title, accent, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-6 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          BUET
          {eyebrow && (
            <>
              <span aria-hidden="true" className="mx-2 text-muted-foreground/50">•</span>
              {eyebrow}
            </>
          )}
        </p>
        <h1 className="mt-4 font-display text-4xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground sm:text-5xl">
          {title}
          {accent && (
            <>
              {" "}
              <span className="text-accent/80">{accent}</span>
            </>
          )}
        </h1>
        <div aria-hidden="true" className="mt-5 h-px w-10 bg-foreground/40" />
        {description && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
