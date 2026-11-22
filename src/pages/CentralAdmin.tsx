import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { authService, CentralAdminMetrics } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { CountUp } from "@/components/motion/CountUp";

const numberFormat = new Intl.NumberFormat("en-BD");
// Registration is limited by OPEN_UNIVERSITIES on the server; BUET is the launch campus.
const isOpen = (university: { shortName?: string | null }) => university.shortName === "BUET";

export default function CentralAdmin() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CentralAdminMetrics | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError("");
    try {
      setMetrics(await authService.getCentralAdminMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load university metrics.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);


  return (
    <MainLayout>
      <div className="text-foreground">
        <div className="page-container">
          <PageHeader
            photo={{ src: "/campus/bands/buet-hero.webp", alt: "A BUET building with a concrete block cantilevered above red brick" }}
            eyebrow="Central administration"
            title="Network and moderation."
            accent="BUET first."
            description="Student registrations by university, reported posts, and removed posts you can restore."
            actions={
              <Button type="button" variant="outline" onClick={() => void loadMetrics()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                Refresh figures
              </Button>
            }
          />

          <ul aria-label="Network totals" className="stagger grid border-y border-foreground/10 sm:grid-cols-3">
            {[
              { label: "Universities open", value: metrics ? metrics.universities.filter(isOpen).length : null },
              { label: "Students registered", value: metrics?.studentCount ?? null },
              { label: "Registered this month", value: metrics?.studentsThisMonth ?? null },
            ].map((item, i) => (
              <li key={item.label} className={i ? "border-t border-foreground/10 py-7 sm:border-l sm:border-t-0 sm:px-6" : "py-7 sm:pr-6"}>
                <span className="block font-display text-5xl leading-none tabular-nums">
                  {isLoading || item.value === null ? "—" : <CountUp value={item.value} />}
                </span>
                <span className="mt-3.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{item.label}</span>
              </li>
            ))}
          </ul>

          <section aria-labelledby="universities">
            <SectionTitle id="universities">Universities</SectionTitle>
            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}
            {isLoading && !metrics ? (
              <p className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Loading university figures…
              </p>
            ) : metrics?.universities.length ? (
              <ol className="stagger divide-y divide-foreground/[0.07]">
                {metrics.universities.map((university) => (
                  <li key={university.id} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-6 gap-y-2 py-5 md:grid-cols-[96px_minmax(0,1fr)_140px_120px_100px]">
                    <span className="font-display text-[22px] text-accent">{university.shortName || "—"}</span>
                    <span className="text-[15px]">{university.name}</span>
                    <span className="col-start-2 text-[13px] text-muted-foreground md:col-start-auto">{university.division || "—"}</span>
                    <span className="col-start-2 text-[13px] tabular-nums text-muted-foreground md:col-start-auto">
                      {numberFormat.format(university.studentCount)} students
                    </span>
                    <span className="col-start-2 md:col-start-auto md:justify-self-end">
                      <StatusDot tone={isOpen(university) ? "resolved" : "closed"} className="text-[13px]">
                        {isOpen(university) ? "Open" : "Later"}
                      </StatusDot>
                    </span>
                  </li>
                ))}
              </ol>
            ) : !error ? (
              <p className="py-12 text-[15px] text-muted-foreground">No universities in the registry yet.</p>
            ) : null}
          </section>

          <ModerationQueue />
        </div>
      </div>
    </MainLayout>
  );
}
