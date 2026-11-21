import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { authService, CentralAdminMetrics } from "@/services/auth.service";
import { Button } from "@/components/ui/button";

const numberFormat = new Intl.NumberFormat("en-BD");

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

  const largestUniversity = Math.max(
    1,
    ...(metrics?.universities.map((university) => university.studentCount) ?? [])
  );

  return (
    <MainLayout>
      <div className="min-h-screen px-5 py-8 text-foreground sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <PageHeader
            photo={{ src: "/campus/graded/buet-hero-panel.webp", alt: "A BUET building with a concrete block cantilevered above red brick", position: "35% 50%" }}
            eyebrow="Central administration"
            title="The university network."
            accent="BUET first."
            description="Student registrations by university. CSB 2.0 opens at BUET first; other public universities follow later."
            actions={
              <Button type="button" variant="outline" onClick={() => void loadMetrics()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
                Refresh figures
              </Button>
            }
          />

          <section
            aria-label="Network totals"
            className="glass-panel grid gap-px overflow-hidden rounded-xl sm:grid-cols-3"
          >
            <div className="p-5 sm:p-6">
              <p className="text-sm text-muted-foreground">Universities in the registry</p>
              <p className="mt-3 font-display text-5xl font-normal tracking-[-0.02em] text-foreground">
                {isLoading ? "—" : numberFormat.format(metrics?.universityCount ?? 0)}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-muted-foreground">Student accounts linked to a university</p>
              <p className="mt-3 font-display text-5xl font-normal tracking-[-0.02em] text-foreground">
                {isLoading ? "—" : numberFormat.format(metrics?.studentCount ?? 0)}
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-muted-foreground">Students registered this month</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-primary">
                {isLoading ? "—" : numberFormat.format(metrics?.studentsThisMonth ?? 0)}
              </p>
            </div>
          </section>

          <section className="glass-panel overflow-hidden rounded-xl">
            <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Student registrations by university</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Counts include accounts assigned to each university.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                {isLoading ? "Loading registry" : `${metrics?.universities.length ?? 0} universities`}
              </div>
            </div>

            {error && (
              <div className="m-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            {isLoading && !metrics ? (
              <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                Loading university figures…
              </div>
            ) : metrics?.universities.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <caption className="sr-only">Student account counts for each university in the central registry</caption>
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.035] text-xs font-medium text-muted-foreground">
                      <th scope="col" className="px-5 py-3 sm:px-6">University</th>
                      <th scope="col" className="px-5 py-3">Division</th>
                      <th scope="col" className="px-5 py-3">Students</th>
                      <th scope="col" className="px-5 py-3 text-right sm:px-6">Added this month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.universities.map((university) => (
                      <tr key={university.id} className="border-b border-white/[0.07] transition-colors hover:bg-white/[0.035] last:border-0">
                        <th scope="row" className="px-5 py-4 font-medium text-foreground sm:px-6">
                          <span className="block">{university.name}</span>
                          {university.shortName && (
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              {university.shortName}
                            </span>
                          )}
                        </th>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{university.division || "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-32 items-center gap-3">
                            <span className="w-10 text-sm font-medium tabular-nums text-foreground">
                              {numberFormat.format(university.studentCount)}
                            </span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                              <span
                                className="block h-full rounded-full bg-primary"
                                style={{ width: `${(university.studentCount / largestUniversity) * 100}%` }}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm tabular-nums text-muted-foreground sm:px-6">
                          <span className="inline-flex items-center justify-end gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {numberFormat.format(university.studentsThisMonth)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !error ? (
              <div className="px-6 py-16 text-center">
                <Building2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-3 font-medium text-foreground">No universities in the registry yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Universities will appear here as they are added.</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
