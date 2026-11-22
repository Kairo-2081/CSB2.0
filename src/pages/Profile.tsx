import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionTitle } from "@/components/editorial";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const details: [string, string | undefined][] = [
    ["Email", user.email],
    ["Department", user.department],
    ["University", user.universityName],
    ["Phone", user.phone],
    ["Home district", user.homeDistrict],
    ["Current residence", user.currentResidence],
  ];

  const visibility: [string, string][] = [
    ["Student directory", "Your name, department and role. Not your email or phone."],
    ["Your posts", "The name you enter when you post. Several forms let you post as Anonymous."],
    ["Listings you add", "A phone number only when you type one into that listing, so buyers or finders can call you."],
  ];

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          photo={{ src: "/campus/bands/buet-tower.webp", alt: "A tall white BUET building with horizontal bands of windows" }}
          eyebrow={user.role === "admin" ? "Account · Admin" : "Account · Student"}
          title={`${user.name}.`}
          accent={user.department || user.universityName || undefined}
          description="Your details, and where they appear on CSB 2.0."
        />

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section aria-labelledby="details">
            <SectionTitle id="details">Details</SectionTitle>
            <dl className="divide-y divide-white/[0.07] border-b border-white/[0.07]">
              {details.map(([label, value]) => (
                <div key={label} className="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
                  <dt className="pt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
                  <dd className={value ? "text-[15px]" : "text-[15px] text-[#8d857c]"}>{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="visibility">
            <SectionTitle id="visibility">Who sees what</SectionTitle>
            <dl className="divide-y divide-white/[0.07]">
              {visibility.map(([title, text]) => (
                <div key={title} className="py-5">
                  <dt className="text-[15px]">{title}</dt>
                  <dd className="mt-1 text-[13px] leading-5 text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
