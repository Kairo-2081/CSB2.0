import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "open" | "progress" | "resolved" | "urgent" | "closed";

const toneColour: Record<StatusTone, string> = {
  open: "bg-accent",
  progress: "bg-warning",
  resolved: "bg-success",
  urgent: "bg-destructive",
  closed: "bg-[#6f685f]",
};

/** Status as a small dot and a word. The design uses this instead of coloured pills. */
export function StatusDot({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-[#d6cec5]", className)}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneColour[tone])} />
      {children}
    </span>
  );
}

/** Maps the status words stored in the database to a tone. */
export function toneFor(status?: string | null): StatusTone {
  const s = (status ?? "").toLowerCase();
  if (["resolved", "returned", "completed", "closed", "fulfilled", "done", "found"].includes(s)) return s === "closed" ? "closed" : "resolved";
  if (["in_progress", "in progress", "in-progress", "in_use", "in use", "lent", "borrowed", "approved", "reviewed", "assigned"].includes(s)) return "progress";
  if (["maintenance", "in repair", "unavailable", "withdrawn"].includes(s)) return "closed";
  if (["urgent", "critical", "emergency", "rejected"].includes(s)) return "urgent";
  return "open";
}

/** "in_progress" -> "In progress" */
export function statusLabel(status?: string | null) {
  const s = (status ?? "open").replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
