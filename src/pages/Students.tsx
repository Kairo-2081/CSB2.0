import { API_URL } from "@/lib/api-url";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, FilterBar, RowList } from "@/components/editorial";

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  phone?: string;
  department?: string;
}

export default function Students() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/auth/users`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the directory");
        return response.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load the directory"));
  }, []);

  const filtered = users.filter((user) => {
    const matchesText = `${user.name} ${user.department || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesText && (role === "all" || user.role === role);
  });

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-corridor.webp", alt: "A shaded BUET corridor with one person walking at the far end" }}
          eyebrow="People"
          title="Student directory."
          accent="Your campus, by name."
          description="People registered on CSB 2.0. Contact details are not shown here."
        />

        <section aria-label="Directory">
          <FilterBar
            label="Show"
            tabs={[
              { value: "all", label: "Everyone", count: users.length },
              { value: "student", label: "Students" },
              { value: "admin", label: "Admins" },
            ]}
            value={role}
            onChange={setRole}
            search={search}
            onSearch={setSearch}
            searchLabel="Search by name or department"
          />
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          {filtered.length > 0 ? (
            <RowList label="People">
              {filtered.map((user) => (
                <li key={user.id} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-5 gap-y-1 py-4 md:grid-cols-[44px_minmax(0,1.3fr)_minmax(0,1fr)_120px] md:gap-6">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/45 font-display text-lg text-accent">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="font-display text-xl">{user.name}</span>
                  <span className="col-start-2 text-sm text-[#d6cec5] md:col-start-auto">{user.department || "Department not set"}</span>
                  <span className="col-start-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:col-start-auto md:text-right">
                    {user.role === "admin" ? "Admin" : "Student"}
                  </span>
                </li>
              ))}
            </RowList>
          ) : (
            <EmptyState title={users.length === 0 ? "No one here yet." : "No one matches."} text={users.length === 0 ? undefined : "Try another name or department."} />
          )}
        </section>
      </div>
    </MainLayout>
  );
}
