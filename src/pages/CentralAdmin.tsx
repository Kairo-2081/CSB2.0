import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
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
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-6">
          <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="stamp mb-3 inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Central administration
              </p>
              <h1 className="text-3xl font-medium leading-tight text-foreground">
                The university network
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                A shared view of student registrations across Bangladesh’s public universities
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadMetrics()}
              disabled={isLoading}
              className="w-fit"
            >
              <RefreshCw className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
              Refresh figures
            </Button>
          </header>

          <section
            aria-label="Network totals"
            className="glass-panel grid divide-y divide-border overflow-hidden rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          >
            <div className="p-6">
              <p className="text-sm text-muted-foreground">Universities in the registry</p>
              <p className="mt-3 text-4xl font-medium leading-none tabular-nums text-foreground">
                {isLoading ? "—" : numberFormat.format(metrics?.universityCount ?? 0)}
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">Student accounts linked to a university</p>
              <p className="mt-3 text-4xl font-medium leading-none tabular-nums text-foreground">
                {isLoading ? "—" : numberFormat.format(metrics?.studentCount ?? 0)}
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">Students registered this month</p>
              <p className="mt-3 text-4xl font-medium leading-none tabular-nums text-primary">
                {isLoading ? "—" : numberFormat.format(metrics?.studentsThisMonth ?? 0)}
              </p>
            </div>
          </section>

          <section className="glass-panel overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-2 border-b border-border px-6 pb-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-medium leading-tight text-foreground">Student registrations by university</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Counts include accounts assigned to each university.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 text-subtle" aria-hidden="true" />
                {isLoading ? "Loading registry" : `${metrics?.universities.length ?? 0} universities`}
              </div>
            </div>

            {error && (
              <div className="m-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            {isLoading && !metrics ? (
              <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-subtle" aria-hidden="true" />
                Loading university figures
              </div>
            ) : metrics?.universities.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <caption className="sr-only">Student account counts for each university in the central registry</caption>
                  <thead>
                    <tr className="border-b border-border text-xs text-subtle">
                      <th scope="col" className="h-10 px-6">University</th>
                      <th scope="col" className="h-10 px-4">Division</th>
                      <th scope="col" className="h-10 px-4">Students</th>
                      <th scope="col" className="h-10 px-6 text-right">Added this month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.universities.map((university) => (
                      <tr key={university.id} className="border-b border-border transition-colors duration-150 hover:bg-white/[0.03] last:border-0">
                        <th scope="row" className="px-6 py-4 font-medium text-foreground">
                          <span className="block">{university.name}</span>
                          {university.shortName && (
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              {university.shortName}
                            </span>
                          )}
                        </th>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{university.division || "—"}</td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-32 items-center gap-3">
                            <span className="w-10 font-mono text-[13px] tabular-nums text-foreground">
                              {numberFormat.format(university.studentCount)}
                            </span>
                            <span className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                              <span
                                className="block h-full rounded-full bg-primary"
                                style={{ width: `${(university.studentCount / largestUniversity) * 100}%` }}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
                          <span className="inline-flex items-center justify-end gap-2">
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
                <Building2 className="mx-auto h-5 w-5 text-subtle" aria-hidden="true" />
                <h3 className="mt-3 font-medium text-foreground">No universities in the registry yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Universities appear here as they are added</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
