import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "open" | "progress" | "resolved" | "urgent" | "closed";

const toneColour: Record<StatusTone, string> = {
  open: "bg-accent",
  progress: "bg-warning",
  resolved: "bg-success",
  urgent: "bg-destructive",
  closed: "bg-muted-foreground/60",
};

/** Status as a small dot and a word. The design uses this instead of coloured pills. */
export function StatusDot({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-foreground/75", className)}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneColour[tone])} />
      {children}
    </span>
  );
}
