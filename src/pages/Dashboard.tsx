import { api } from "@/lib/http";
import { useModules } from "@/lib/modules";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Kicker, SectionTitle } from "@/components/editorial";
import { StatusDot } from "@/components/ui/status-dot";
import { shortDate } from "@/lib/dates";
import { statusLabel, toneFor } from "@/lib/status";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  title: string;
  created_at?: string;
  status?: string;
  category?: string;
  item_type?: string;
  is_sold?: boolean;
}

interface Feeds {
  complaints: Row[];
  notices: Row[];
  lostFound: Row[];
  marketplace: Row[];
}


function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  const evening = hour >= 17 || hour < 5;
  return {
    greeting: hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : "Good evening",
    label: hour >= 5 && hour < 12 ? "Morning" : hour >= 12 && hour < 17 ? "Afternoon" : "Evening",
    // A daytime or dusk view of campus, mirrored in a puddle, to match the hour.
    photo: evening ? "/campus/bands/buet-dusk-reflection.webp" : "/campus/bands/buet-day-reflection.webp",
    alt: evening
      ? "BUET buildings at dusk, reflected in standing water"
      : "BUET buildings on a clear day, reflected in standing water",
  };
}

export default function Dashboard() {
  const { enabled } = useModules();
  const { user } = useAuth();
  const timeOfDay = getTimeOfDay();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const [feeds, setFeeds] = useState<Feeds | null>(null);

  useEffect(() => {
    // Lists come back 100 at a time at most; the counts below show "100+" past that.
    const get = (path: string) => api<Row[]>(`/${path}?limit=100`).catch(() => [] as Row[]);
    Promise.all([get("complaints"), get("notices"), get("lost-found"), get("marketplace")]).then(
      ([complaints, notices, lostFound, marketplace]) => setFeeds({ complaints, notices, lostFound, marketplace }),
    );
  }, []);

  const openComplaints = feeds?.complaints.filter((c) => c.status !== "resolved") ?? [];
  const counts = [
    { label: "Open complaints", value: feeds ? openComplaints.length : null, href: "/complaints" },
    { label: "Notices", value: feeds?.notices.length ?? null, href: "/notices" },
    { label: "Lost and found posts", value: feeds?.lostFound.length ?? null, href: "/lost-found" },
    { label: "For sale", value: feeds ? feeds.marketplace.filter((m) => !m.is_sold).length : null, href: "/marketplace" },
  ];

  const latest = feeds
    ? [
        ...feeds.notices.map((n) => ({ ...n, kind: `Notice${n.category ? ` · ${n.category}` : ""}`, href: "/notices" })),
        ...feeds.lostFound.map((l) => ({ ...l, kind: l.item_type === "found" ? "Found" : "Lost", href: "/lost-found" })),
        ...feeds.marketplace.filter((m) => !m.is_sold).map((m) => ({ ...m, kind: "Marketplace", href: "/marketplace" })),
      ]
        .filter((r) => r.created_at)
        .sort((x, y) => new Date(y.created_at!).getTime() - new Date(x.created_at!).getTime())
        .slice(0, 6)
    : [];

  return (
    <MainLayout>
      <div className="page-container">
        <PageHeader
          eyebrow={`${timeOfDay.label}${user ? (user.role === "admin" ? " · Admin" : " · Student") : ""}`}
          title={`${timeOfDay.greeting}${firstName ? "," : "."}`}
          accent={firstName ? `${firstName}.` : undefined}
          description="Here's what's open on campus right now."
          photo={{ src: timeOfDay.photo, alt: timeOfDay.alt }}
          actions={
            <>
              <Button asChild><Link to="/lost-found"><Search aria-hidden="true" /> Report a lost item</Link></Button>
              <Button asChild variant="outline"><Link to="/lend-borrow"><BookOpen aria-hidden="true" /> Lend an item</Link></Button>
            </>
          }
        />

        <ul aria-label="Open on campus" className="grid grid-cols-2 border-y border-white/10 lg:grid-cols-4">
          {counts.filter((c) => enabled(c.href)).map((c, i) => (
            <li key={c.label} className={["border-white/10", i % 2 ? "border-l" : "", i >= 2 ? "border-t lg:border-t-0" : "", i === 2 ? "lg:border-l" : ""].join(" ")}>
              <Link to={c.href} className="group flex h-full flex-col gap-3.5 px-5 py-7 transition-colors hover:bg-white/[0.025] sm:px-6">
                <span className="flex items-start justify-between">
                  <span className="font-display text-5xl leading-none tabular-nums">{c.value === null ? "—" : c.value >= 100 ? "100+" : c.value}</span>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section aria-labelledby="latest">
            <SectionTitle
              id="latest"
              action={<Link to="/notices" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent hover:text-foreground">All notices</Link>}
            >
              Latest on campus
            </SectionTitle>
            {latest.length > 0 ? (
              <ol className="divide-y divide-white/[0.07]">
                {latest.map((row) => (
                  <li key={`${row.href}-${row.id}`}>
                    <Link to={row.href} className="group grid grid-cols-[64px_minmax(0,1fr)_16px] items-baseline gap-5 py-5">
                      <span className="font-display text-xl leading-tight text-accent">{shortDate(row.created_at)}</span>
                      <span className="min-w-0">
                        <Kicker className="capitalize">{row.kind}</Kicker>
                        <span className="mt-1.5 block text-base leading-6">{row.title}</span>
                      </span>
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-[#8d857c] transition-colors group-hover:text-foreground" />
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-10 text-[15px] text-muted-foreground">{feeds ? "Nothing posted yet. New notices, lost items and listings show up here." : "Loading…"}</p>
            )}
          </section>

          <section aria-labelledby="open-complaints">
            <SectionTitle id="open-complaints">Open complaints</SectionTitle>
            {openComplaints.length > 0 ? (
              <ul className="divide-y divide-white/[0.07]">
                {openComplaints.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-5">
                    <Link to="/complaints" className="block text-[15px] leading-[22px] hover:text-white">{c.title}</Link>
                    <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusDot tone={toneFor(c.status)} className="text-xs text-muted-foreground">{statusLabel(c.status)}</StatusDot>
                      <span className="opacity-50">·</span>
                      <span className="capitalize">{c.category}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-[15px] text-muted-foreground">{feeds ? "No open complaints right now." : "Loading…"}</p>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
