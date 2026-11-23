import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/editorial";
import { api } from "@/lib/http";
import { adminService } from "@/services/database.service";
import { shortDate } from "@/lib/dates";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReportedPost {
  board: string;
  row_id: string;
  reports: number;
  reasons: string[];
  details: string[];
  first_reported: string;
  label: string | null;
  excerpt: string;
  posted_by: string | null;
  owner_id: string | null;
  owner_suspended: boolean;
  hidden: boolean;
  gone: boolean;
}

interface Suspended {
  id: string;
  name: string;
  department: string | null;
  suspended_at: string;
  reason: string | null;
}

interface LogEntry {
  id: string;
  at: string;
  action: "auto_hide" | "remove" | "dismiss" | "restore" | "delete_post" | "suspend" | "unsuspend";
  board: string | null;
  detail: string | null;
  actor: string;
  target: string | null;
}

const ACTIONS: Record<LogEntry["action"], string> = {
  auto_hide: "hid a post after 3 reports",
  remove: "removed a reported post",
  dismiss: "kept a reported post",
  restore: "restored a post",
  delete_post: "deleted a post",
  suspend: "suspended",
  unsuspend: "lifted the suspension of",
};

interface Removed {
  board: "notices" | "complaints";
  id: string;
  title: string;
  deleted_at: string;
  deleted_by: string | null;
}

const BOARD_NAMES: Record<string, string> = {
  notices: "Notice", complaints: "Complaint", faculty_suggestions: "Faculty suggestion", marketplace: "Marketplace",
  lost_found: "Lost and found", bicycles: "Bicycle", blood_donation: "Blood donation", animal_welfare: "Animal welfare",
};
const REASONS: Record<string, string> = {
  spam: "Spam", harassment: "Harassment", personal_info: "Personal details", false: "False",
  inappropriate: "Inappropriate", other: "Other",
};

/** Reported posts at the admin's university, plus removed notices and complaints to restore. */
export function ModerationQueue() {
  const [reports, setReports] = useState<ReportedPost[] | null>(null);
  const [removed, setRemoved] = useState<Removed[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [suspended, setSuspended] = useState<Suspended[] | null>(null);
  const [log, setLog] = useState<LogEntry[] | null>(null);
  const [showAllLog, setShowAllLog] = useState(false);
  const [suspending, setSuspending] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    try {
      const [r, d, su, lg] = await Promise.all([
        api<ReportedPost[]>("/admin/reports"),
        adminService.removed(),
        api<Suspended[]>("/admin/suspended"),
        api<LogEntry[]>("/admin/moderation-log"),
      ]);
      setReports(r);
      setRemoved(d);
      setSuspended(su);
      setLog(lg);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the moderation queue");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (post: ReportedPost, action: "dismiss" | "remove") => {
    if (action === "remove" && !window.confirm(`Remove “${post.label ?? "this post"}”?`)) return;
    setBusy(post.row_id);
    try {
      await api("/admin/reports/resolve", { method: "POST", body: { board: post.board, row_id: post.row_id, action } });
      toast.success(action === "remove" ? "Post removed" : "Reports dismissed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the reports");
    } finally {
      setBusy(null);
    }
  };

  const suspend = async () => {
    if (!suspending) return;
    setBusy(suspending.id);
    try {
      await api(`/admin/users/${suspending.id}/suspend`, { method: "POST", body: { reason } });
      toast.success(`${suspending.name} is suspended and signed out`);
      setSuspending(null);
      setReason("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not suspend");
    } finally {
      setBusy(null);
    }
  };

  const unsuspend = async (person: Suspended) => {
    setBusy(person.id);
    try {
      await api(`/admin/users/${person.id}/unsuspend`, { method: "POST" });
      toast.success(`${person.name} can sign in again`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not lift the suspension");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (item: Removed) => {
    setBusy(item.id);
    try {
      await adminService.restore(item.board, item.id);
      toast.success("Restored");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-16 grid gap-14 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section aria-labelledby="reports">
        <SectionTitle id="reports">Reported posts</SectionTitle>
        {reports === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">Nothing reported. When students flag a post, it shows up here.</p>
        ) : (
          <ul aria-label="Reported posts" className="stagger divide-y divide-foreground/[0.07] border-y border-foreground/[0.07]">
            {reports.map((post) => (
              <li key={`${post.board}:${post.row_id}`} className="py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {BOARD_NAMES[post.board] ?? post.board} · {post.reports} {post.reports === 1 ? "report" : "reports"} ·{" "}
                  {post.reasons.map((r) => REASONS[r] ?? r).join(", ")}
                </p>
                <p className="mt-2 text-[16px]">
                  {post.label ?? "Untitled"}
                  {post.gone && <span className="ml-2 text-muted-foreground">(already removed)</span>}
                  {post.hidden && !post.gone && (
                    <span className="ml-2 inline-block rounded-full bg-warning/15 px-2.5 py-0.5 align-middle text-[11px] font-semibold text-warning">
                      Hidden automatically
                    </span>
                  )}
                </p>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-[14px] text-muted-foreground">{post.excerpt}</p>}
                {post.details.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-foreground/75">
                    {post.details.map((d, i) => <li key={i}>“{d}”</li>)}
                  </ul>
                )}
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Posted by {post.posted_by ?? "unknown"} · first reported {shortDate(post.first_reported)}
                </p>
                <div className="mt-3 flex gap-3">
                  <Button size="sm" variant="destructive" disabled={busy === post.row_id} onClick={() => resolve(post, "remove")}>Remove post</Button>
                  <Button size="sm" variant="ghost" disabled={busy === post.row_id} onClick={() => resolve(post, "dismiss")}>
                    {post.hidden ? "Keep and show it" : "Keep it"}
                  </Button>
                  {post.owner_id && !post.owner_suspended && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setSuspending({ id: post.owner_id!, name: post.posted_by ?? "this student" })}>
                      Suspend poster
                    </Button>
                  )}
                  {post.owner_suspended && <span className="self-center text-[13px] text-muted-foreground">Poster suspended</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="removed">
        <SectionTitle id="removed">Recently removed</SectionTitle>
        {removed === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : removed.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">Removed notices and complaints appear here and can be restored.</p>
        ) : (
          <ul aria-label="Removed posts" className="stagger divide-y divide-foreground/[0.07] border-y border-foreground/[0.07]">
            {removed.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{item.title}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {BOARD_NAMES[item.board]} · removed {shortDate(item.deleted_at)}{item.deleted_by ? ` by ${item.deleted_by}` : ""}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={busy === item.id} onClick={() => restore(item)}>Restore</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="suspended">
        <SectionTitle id="suspended">Suspended accounts</SectionTitle>
        {suspended === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : suspended.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">No one is suspended. Suspend a poster from a reported post.</p>
        ) : (
          <ul aria-label="Suspended accounts" className="stagger divide-y divide-foreground/[0.07] border-y border-foreground/[0.07]">
            {suspended.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{person.name}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {shortDate(person.suspended_at)}{person.reason ? ` · ${person.reason}` : ""}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={busy === person.id} onClick={() => unsuspend(person)}>Lift</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="modlog">
        <SectionTitle id="modlog">Moderation log</SectionTitle>
        {log === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : log.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">Every removal, suspension and automatic hide will be recorded here.</p>
        ) : (
          <>
            <ol aria-label="Moderation log" className="divide-y divide-foreground/[0.07] border-y border-foreground/[0.07]">
              {(showAllLog ? log : log.slice(0, 12)).map((entry) => (
                <li key={entry.id} className="py-3 text-[14px]">
                  <span className="font-medium">{entry.actor}</span> {ACTIONS[entry.action]}
                  {entry.target ? <> <span className="font-medium">{entry.target}</span></> : null}
                  {entry.board ? <span className="text-muted-foreground"> · {BOARD_NAMES[entry.board] ?? entry.board}</span> : null}
                  {entry.detail && entry.action === "suspend" ? <span className="text-muted-foreground"> · “{entry.detail}”</span> : null}
                  <span className="block text-[12px] text-muted-foreground">{shortDate(entry.at)}</span>
                </li>
              ))}
            </ol>
            {log.length > 12 && (
              <Button size="sm" variant="ghost" className="mt-3" onClick={() => setShowAllLog((v) => !v)}>
                {showAllLog ? "Show fewer" : `Show all ${log.length}`}
              </Button>
            )}
          </>
        )}
      </section>

      <Dialog open={suspending !== null} onOpenChange={(open) => !open && setSuspending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {suspending?.name}?</DialogTitle>
            <DialogDescription>
              They are signed out everywhere and can't sign in or post until you lift it. Their posts stay up; remove them separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Reason (kept in the moderation log)</Label>
            <Textarea id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Repeated scam listings" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuspending(null)}>Cancel</Button>
            <Button variant="destructive" disabled={reason.trim().length < 3 || busy === suspending?.id} onClick={suspend}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
