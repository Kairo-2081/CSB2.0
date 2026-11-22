import { useCallback, useEffect, useState } from "react";
import { FlaskConical, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { adminService, type AdminOverview as Overview } from "@/services/database.service";
import { sampleOverview } from "@/lib/overview-sample";
import { CHART } from "@/lib/overview-format";
import { BoardTable, KpiCard, Segmented, ShareDonut, TrendCard, WeekdayBars } from "@/components/admin/overview";

type Months = 3 | 6 | 12;
const RANGES: { value: Months; label: string }[] = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

const pct = (n: number) => `${n.toFixed(1)}%`;

/**
 * Admin overview: sign-ups, posts and reports for the admin's university.
 * With little real activity the charts are flat, so "Sample data" swaps in
 * made-up figures to preview the page; a banner says so while it is on.
 */
export default function AdminOverview() {
  const [months, setMonths] = useState<Months>(12);
  const [sample, setSample] = useState(false);
  const [live, setLive] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLive(await adminService.overview(months));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the overview.");
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    void load();
  }, [load]);

  const data = sample ? sampleOverview(months) : live;
  const k = data?.kpis;
  const handledShare = k && k.reports.value ? (k.reports.handled / k.reports.value) * 100 : 100;

  return (
    <MainLayout>
      <div className="page-container pt-20 lg:pt-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">BUET · Administration</p>
            <h1 className="mt-3 font-display text-[clamp(2.6rem,4.4vw,3.75rem)] leading-none tracking-[-0.02em]">Campus overview</h1>
            <p className="mt-3 text-[15px] text-muted-foreground">
              Sign-ups, posts and reports across every board, last {months} months.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label data-plain className="flex items-center gap-2.5 rounded-full border border-foreground/10 px-3.5 py-2 text-sm text-muted-foreground">
              <FlaskConical aria-hidden="true" className="h-4 w-4" />
              Sample data
              <Switch checked={sample} onCheckedChange={setSample} aria-label="Show sample data" />
            </label>
            <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading} aria-label="Refresh figures" className="rounded-full">
              <RefreshCw aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : ""} />
            </Button>
            <Segmented<Months> label="Range" value={months} onChange={setMonths} options={RANGES} />
          </div>
        </header>

        {sample && (
          <p role="status" className="animate-enter rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            Sample data. These figures are made up to preview the charts; they are not BUET's. Switch off “Sample data” to see the real figures.
          </p>
        )}
        {error && !sample && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        {!data || !k ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-shimmer h-[176px] rounded-2xl" />)}
            <div className="skeleton-shimmer h-[420px] rounded-2xl sm:col-span-2 xl:col-span-3" />
            <div className="skeleton-shimmer h-[420px] rounded-2xl sm:col-span-2 xl:col-span-1" />
          </div>
        ) : (
          <>
            <div key={`${months}-${sample}`} className="stagger grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="New students" value={k.students.value} previous={k.students.previous} spark={data.series.map((r) => r.signups)} color={CHART.saffron} months={months} />
              <KpiCard label="Posts" value={k.posts.value} previous={k.posts.previous} spark={data.series.map((r) => r.posts)} color={CHART.green} months={months} />
              <KpiCard label="Students posting" value={k.activePosters.value} previous={k.activePosters.previous} spark={data.series.map((r) => r.posts)} color={CHART.blue} months={months} />
              <KpiCard
                label="Reports handled"
                value={handledShare}
                format={pct}
                color={CHART.green}
                months={months}
                footer={
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.07]">
                      <div className="animate-grow-x h-full rounded-full bg-success" style={{ width: `${handledShare}%` }} />
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      {k.reports.handled} of {k.reports.value} reports handled · {k.reports.open} open now
                    </p>
                  </div>
                }
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <TrendCard data={data} />
              <ShareDonut data={data} />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <WeekdayBars data={data} />
              <BoardTable data={data} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
