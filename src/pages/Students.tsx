import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student directory</h1>
          <p className="mt-1 text-muted-foreground">People registered in the system</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email or department" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          {["all", "student", "admin"].map((filter) => (
            <Button key={filter} size="sm" variant={role === filter ? "default" : "secondary"} onClick={() => setRole(filter)}>
              {filter === "all" ? "All" : filter === "admin" ? "Admins" : "Students"}
            </Button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="glass-panel overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.035] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-t border-white/8 transition-colors hover:bg-white/[0.035]">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.department || "-"}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{user.role === "admin" ? "Admin" : "Student"}</Badge></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
