import { MainLayout } from "@/components/layout/MainLayout";
import { Page, PageHeader } from "@/components/layout/Page";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const fields = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email, mono: true },
    { label: "Phone", value: user.phone, mono: true },
    { label: "Department", value: user.department },
    { label: "University", value: user.universityName },
    { label: "Role", value: user.role === "admin" ? "Admin" : "Student" },
  ];

  return (
    <MainLayout>
      <Page>
        <PageHeader title="Profile" description="Your account details as the university sees them" />

        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-2xl font-medium text-foreground" aria-hidden="true">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="mt-5 text-xl font-medium text-foreground">{user.name}</h2>
            <p className="mt-1 truncate font-mono text-[13px] text-muted-foreground">{user.email}</p>
            <Badge variant={user.role === "admin" ? "default" : "outline"} className="mt-4">
              <Shield aria-hidden="true" />
              {user.role === "admin" ? "Admin" : "Student"}
            </Badge>
          </section>

          <section aria-labelledby="personal-information" className="glass-panel overflow-hidden rounded-2xl">
            <h2 id="personal-information" className="px-6 pb-4 pt-6 text-lg font-medium leading-tight">Personal information</h2>
            <dl className="divide-y divide-border border-t border-border">
              {fields.map((field) => (
                <div key={field.label} className="grid gap-1 px-6 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-sm text-muted-foreground">{field.label}</dt>
                  <dd className={`truncate text-sm ${field.value ? "text-foreground" : "text-subtle"} ${field.mono && field.value ? "font-mono text-[13px]" : ""}`}>
                    {field.value || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </Page>
    </MainLayout>
  );
}
