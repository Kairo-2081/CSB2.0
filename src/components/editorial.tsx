import { useState, type ReactNode } from "react";
import { Flag, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { monthFmt } from "@/lib/dates";
import { CountUp } from "@/components/motion/CountUp";

/**
 * Building blocks for the editorial list pages: hairline rows, serif dates,
 * underline tabs, a counts strip and object tiles. See the Foundations board
 * in the design canvas for the rules behind them.
 */


/** Big serif day over a spaced-capital month. */
export function DateBlock({ date, className }: { date?: string | null; className?: string }) {
  const d = date ? new Date(date) : null;
  const valid = d && !Number.isNaN(d.getTime());
  return (
    <span className={cn("block", className)}>
      <span className="block font-display text-[40px] leading-none">{valid ? d.getDate() : "—"}</span>
      <span className="mt-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {valid ? monthFmt.format(d) : ""}
      </span>
    </span>
  );
}

/** Small spaced-capital label above a row title. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground", className)}>
      {children}
    </span>
  );
}

/** A list of rows separated by hairlines. */
export function RowList({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ol aria-label={label} className={cn("stagger divide-y divide-foreground/[0.07] border-b border-foreground/[0.07]", className)}>
      {children}
    </ol>
  );
}

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Underline tabs with a search field beside them, over a hairline. */
export function FilterBar<T extends string>({
  tabs,
  value,
  onChange,
  search,
  onSearch,
  searchLabel = "Search",
  label,
}: {
  tabs: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  search?: string;
  onSearch?: (value: string) => void;
  searchLabel?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-4 border-b border-foreground/10 md:flex-row md:items-end md:justify-between">
      <div role="tablist" aria-label={label} className="-mb-px flex gap-7 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={cn(
                "shrink-0 border-b pb-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {typeof tab.count === "number" && <span className="ml-1.5 text-muted-foreground">· {tab.count}</span>}
            </button>
          );
        })}
      </div>
      {onSearch && (
        <label className="relative mb-0 block md:mb-3">
          <span className="sr-only">{searchLabel}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchLabel}
            className="h-11 w-full rounded-md border border-foreground/[0.14] bg-foreground/[0.03] pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-72"
          />
        </label>
      )}
    </div>
  );
}

export interface Count {
  value: ReactNode;
  label: string;
  marker?: ReactNode;
}

/** The landing's stats strip: big serif numbers between hairlines. */
export function CountStrip({ items, label }: { items: Count[]; label: string }) {
  return (
    <ul aria-label={label} className="stagger grid grid-cols-2 border-y border-foreground/10 lg:grid-cols-4">
      {items.map((item, i) => (
        <li
          key={item.label}
          className={cn(
            "px-0 py-6 sm:px-6",
            i % 2 === 1 && "border-l border-foreground/10 pl-5",
            i >= 2 && "border-t border-foreground/10 lg:border-t-0",
            i === 2 && "lg:border-l lg:pl-6",
            i === 0 && "sm:pl-0",
          )}
        >
          <span className="block font-display text-4xl leading-none sm:text-5xl">
            {typeof item.value === "number" ? <CountUp value={item.value} /> : item.value}
          </span>
          <span className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {item.marker}
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Saffron glows of different strength over the card colour, so tiles work in both themes.
const tileTones = [0.16, 0.07, 0.13, 0.05, 0.11, 0.09];

/** A warm tile with a large serif initial, used when a listing has no photo. */
export function ObjectTile({ title, category, index = 0 }: { title: string; category?: string; index?: number }) {
  return (
    <span
      className="lift group relative flex aspect-[4/3] items-end justify-end overflow-hidden rounded-md border border-foreground/[0.07] p-5"
      style={{ background: `radial-gradient(120% 90% at 100% 100%, hsl(var(--primary) / calc(${tileTones[index % tileTones.length]} * var(--tile-boost))), hsl(var(--card)) 70%)` }}
    >
      <span aria-hidden="true" className="font-display text-8xl leading-none text-foreground/[0.18] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105">
        {title.trim().charAt(0).toUpperCase() || "·"}
      </span>
      {category && (
        <span className="absolute left-4 top-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">{category}</span>
      )}
    </span>
  );
}

/** Empty state: a serif line and one action, between hairlines. */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="border-y border-foreground/[0.07] py-16 text-center">
      <p className="animate-enter-scale font-display text-3xl">{title}</p>
      {text && <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-muted-foreground">{text}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** Section heading over a hairline, as in "Latest on campus". */
export function SectionTitle({ id, children, action }: { id: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-foreground/10 pb-4">
      <h2 id={id} className="font-display text-[30px] font-normal tracking-[-0.01em]">
        {children}
      </h2>
      {action}
    </div>
  );
}

/**
 * "Post anonymously" for forms where the poster's name is shown. The server
 * still records who posted, for ownership and moderation; only the shown
 * name changes.
 */
export function AnonymousToggle({
  checked,
  onChange,
  disabled,
  hint = "Other students see “Anonymous”. Your account is still recorded, so administrators can act on abuse.",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border px-4 py-3">
      <Checkbox
        id="post-anonymously"
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
        className="mt-0.5"
      />
      <div>
        <label data-plain htmlFor="post-anonymously" className="text-sm font-medium">
          Post anonymously
        </label>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

const REPORT_REASONS: [string, string][] = [
  ["spam", "Spam or repeated posting"],
  ["harassment", "Harassment or bullying"],
  ["personal_info", "Shares someone's personal details"],
  ["false", "False or misleading"],
  ["inappropriate", "Inappropriate content"],
  ["other", "Something else"],
];

/** "Report" on a post that is not yours. Sends it to the admins' moderation queue. */
export function ReportButton({ board, rowId }: { board: string; rowId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/reports", {
        method: "POST",
        body: { board, row_id: rowId, reason, details: details.trim() || undefined },
      });
      toast.success(res.message);
      setOpen(false);
      setDetails("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="Report this post"
        className="text-muted-foreground hover:text-foreground">
        <Flag className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>An administrator at your university will review it. The poster is not told who reported.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Why?</legend>
              {REPORT_REASONS.map(([value, label]) => (
                <label key={value} data-plain className="flex items-center gap-3 text-[15px]">
                  <input type="radio" name="reason" value={value} checked={reason === value}
                    onChange={() => setReason(value)} className="accent-[hsl(var(--primary))]" />
                  {label}
                </label>
              ))}
            </fieldset>
            <div>
              <label htmlFor="report-details" className="mb-1 block text-sm font-medium">Anything else (optional)</label>
              <Textarea id="report-details" maxLength={500} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send report"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
