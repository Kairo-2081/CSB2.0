import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader, Toolbar } from "@/components/layout/Page";
import { FilterGroup } from "@/components/layout/FilterGroup";
import { formatCount } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

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
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
    fetch(`${baseUrl}/auth/users`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the directory");
        return response.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load the directory"));
  }, []);

  const filtered = users.filter((user) => {
    const matchesText = `${user.name} ${user.email} ${user.department || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesText && (role === "all" || user.role === role);
  });

  return (
    <MainLayout>
      <Page>
        <PageHeader
          title="Student directory"
          description="People registered at your university, with their department and role"
          meta={formatCount(users.length, "person", "people")}
        />

        <Toolbar>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input type="search" aria-label="Search people" className="pl-9" placeholder="Name, email or department" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <FilterGroup
            label="Role"
            value={role}
            onChange={setRole}
            options={[{ value: "all", label: "All" }, { value: "student", label: "Students" }, { value: "admin", label: "Admins" }]}
          />
        </Toolbar>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="glass-panel overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-xs text-subtle">
              <tr>
                <th scope="col" className="h-10 px-6 font-normal">Name</th>
                <th scope="col" className="h-10 px-4 font-normal">Email</th>
                <th scope="col" className="h-10 px-4 font-normal">Department</th>
                <th scope="col" className="h-10 px-6 text-right font-normal">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((person) => (
                <tr key={person.id} className="transition-colors duration-150 hover:bg-white/[0.03]">
                  <td className="h-14 px-6">
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground" aria-hidden="true">
                        {person.name?.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">{person.name}</span>
                    </span>
                  </td>
                  <td className="px-4 font-mono text-[13px] text-muted-foreground">{person.email}</td>
                  <td className="px-4 text-muted-foreground">{person.department || "—"}</td>
                  <td className="px-6 text-right">
                    <Badge variant={person.role === "admin" ? "default" : "outline"}>{person.role === "admin" ? "Admin" : "Student"}</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">No people match this search</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Page>
    </MainLayout>
  );
}
