import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, FilterBar, RowList } from "@/components/editorial";
import { DirectoryUser, directoryService } from "@/services/database.service";

export default function Students() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [error, setError] = useState("");

  // The server returns only your university, 100 at a time, and includes
  // phone and email only for people who chose to share them.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      directoryService
        .list({ q: search.trim() || undefined, limit: 100 })
        .then((list) => {
          setUsers(list);
          setError("");
        })
        .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load the directory"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

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
          description={
            <>
              Students at your university. Phone and email appear only for people who chose to share them.{" "}
              <Link to="/profile" className="text-accent underline-offset-4 hover:underline">Change yours in your profile.</Link>
            </>
          }
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
                <li key={user.id} className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-5 gap-y-1 py-4 md:grid-cols-[44px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_100px] md:gap-6">
                  <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/45 font-display text-lg text-accent">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="font-display text-xl">{user.name}</span>
                  <span className="col-start-2 text-sm text-[#d6cec5] md:col-start-auto">{user.department || "Department not set"}</span>
                  <span className="col-start-2 text-sm text-muted-foreground md:col-start-auto">
                    {user.phone || user.email ? (
                      <>
                        {user.phone && <a href={`tel:${user.phone}`} className="block hover:text-foreground">{user.phone}</a>}
                        {user.email && <a href={`mailto:${user.email}`} className="block truncate hover:text-foreground">{user.email}</a>}
                      </>
                    ) : (
                      "Contact not shared"
                    )}
                  </span>
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
