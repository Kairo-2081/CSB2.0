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
      <div className="min-h-screen bg-[#f3f6f1] px-5 py-8 text-[#18352b] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#b8d2c4] bg-white px-3 py-1 text-sm text-[#17694f]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Central administration
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#123f30] sm:text-4xl">
                The university network
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526a60] sm:text-base">
                A shared view of student registrations across Bangladesh’s public universities.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadMetrics()}
              disabled={isLoading}
              className="w-fit border-[#b8d2c4] bg-white text-[#17694f] hover:bg-[#e8f1eb]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh figures
            </Button>
          </header>

          <section
            aria-label="Network totals"
            className="grid gap-px overflow-hidden rounded-xl border border-[#d6e1d8] bg-[#d6e1d8] sm:grid-cols-3"
          >
            <div className="bg-white p-5 sm:p-6">
              <p className="text-sm text-[#5f756b]">Universities in the registry</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-[#123f30]">
                {isLoading ? "—" : numberFormat.format(metrics?.universityCount ?? 0)}
              </p>
            </div>
            <div className="bg-white p-5 sm:p-6">
              <p className="text-sm text-[#5f756b]">Student accounts linked to a university</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-[#123f30]">
                {isLoading ? "—" : numberFormat.format(metrics?.studentCount ?? 0)}
              </p>
            </div>
            <div className="bg-white p-5 sm:p-6">
              <p className="text-sm text-[#5f756b]">Students registered this month</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-[#17694f]">
                {isLoading ? "—" : numberFormat.format(metrics?.studentsThisMonth ?? 0)}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#d6e1d8] bg-white">
            <div className="flex flex-col gap-2 border-b border-[#e4ebe5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-[#18352b]">Student registrations by university</h2>
                <p className="mt-1 text-sm text-[#687c73]">
                  Counts include accounts assigned to each university.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-[#687c73]">
                <Building2 className="h-4 w-4 text-[#17694f]" aria-hidden="true" />
                {isLoading ? "Loading registry" : `${metrics?.universities.length ?? 0} universities`}
              </div>
            </div>

            {error && (
              <div className="m-5 rounded-lg border border-[#e7c7c3] bg-[#fff4f2] p-4 text-sm text-[#9b372b]" role="alert">
                {error}
              </div>
            )}

            {isLoading && !metrics ? (
              <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-[#687c73]">
                <Loader2 className="h-5 w-5 animate-spin text-[#17694f]" aria-hidden="true" />
                Loading university figures…
              </div>
            ) : metrics?.universities.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <caption className="sr-only">Student account counts for each university in the central registry</caption>
                  <thead>
                    <tr className="border-b border-[#e4ebe5] bg-[#f8faf7] text-xs font-medium text-[#687c73]">
                      <th scope="col" className="px-5 py-3 sm:px-6">University</th>
                      <th scope="col" className="px-5 py-3">Division</th>
                      <th scope="col" className="px-5 py-3">Students</th>
                      <th scope="col" className="px-5 py-3 text-right sm:px-6">Added this month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.universities.map((university) => (
                      <tr key={university.id} className="border-b border-[#edf1ed] last:border-0">
                        <th scope="row" className="px-5 py-4 font-medium text-[#18352b] sm:px-6">
                          <span className="block">{university.name}</span>
                          {university.shortName && (
                            <span className="mt-1 block text-xs font-normal text-[#75867e]">
                              {university.shortName}
                            </span>
                          )}
                        </th>
                        <td className="px-5 py-4 text-sm text-[#687c73]">{university.division || "—"}</td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-32 items-center gap-3">
                            <span className="w-10 text-sm font-medium tabular-nums text-[#18352b]">
                              {numberFormat.format(university.studentCount)}
                            </span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6eee8]">
                              <span
                                className="block h-full rounded-full bg-[#27835f]"
                                style={{ width: `${(university.studentCount / largestUniversity) * 100}%` }}
                                aria-hidden="true"
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm tabular-nums text-[#526a60] sm:px-6">
                          <span className="inline-flex items-center justify-end gap-2">
                            <Users className="h-4 w-4 text-[#81948a]" aria-hidden="true" />
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
                <Building2 className="mx-auto h-8 w-8 text-[#8ba398]" aria-hidden="true" />
                <h3 className="mt-3 font-medium text-[#18352b]">No universities in the registry yet</h3>
                <p className="mt-1 text-sm text-[#687c73]">Universities will appear here as they are added.</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
