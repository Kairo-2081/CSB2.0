import type { StatusTone } from "@/components/ui/status-dot";

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
