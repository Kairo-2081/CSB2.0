import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/editorial";
import { api } from "@/lib/http";
import { adminService } from "@/services/database.service";
import { shortDate } from "@/lib/dates";

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
  gone: boolean;
}

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

  const load = useCallback(async () => {
    try {
      const [r, d] = await Promise.all([api<ReportedPost[]>("/admin/reports"), adminService.removed()]);
      setReports(r);
      setRemoved(d);
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
          <ul aria-label="Reported posts" className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {reports.map((post) => (
              <li key={`${post.board}:${post.row_id}`} className="py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {BOARD_NAMES[post.board] ?? post.board} · {post.reports} {post.reports === 1 ? "report" : "reports"} ·{" "}
                  {post.reasons.map((r) => REASONS[r] ?? r).join(", ")}
                </p>
                <p className="mt-2 text-[16px]">{post.label ?? "Untitled"}{post.gone && <span className="ml-2 text-muted-foreground">(already removed)</span>}</p>
                {post.excerpt && <p className="mt-1 line-clamp-2 text-[14px] text-muted-foreground">{post.excerpt}</p>}
                {post.details.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-[#d6cec5]">
                    {post.details.map((d, i) => <li key={i}>“{d}”</li>)}
                  </ul>
                )}
                <p className="mt-2 text-[13px] text-muted-foreground">
                  Posted by {post.posted_by ?? "unknown"} · first reported {shortDate(post.first_reported)}
                </p>
                <div className="mt-3 flex gap-3">
                  <Button size="sm" variant="destructive" disabled={busy === post.row_id} onClick={() => resolve(post, "remove")}>Remove post</Button>
                  <Button size="sm" variant="ghost" disabled={busy === post.row_id} onClick={() => resolve(post, "dismiss")}>Keep it</Button>
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
          <ul aria-label="Removed posts" className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
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
    </div>
  );
}
