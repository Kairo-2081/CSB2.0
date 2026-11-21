import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bell, BookOpen, Droplets, MessageSquare, Search, ShoppingBag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface QueueCounts {
  complaints: number;
  notices: number;
  lostFound: number;
  marketplace: number;
  blood: number;
}

interface ComplaintRecord {
  status?: string;
}

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  const evening = hour >= 17 || hour < 5;
  return {
    greeting: hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : "Good evening",
    label: hour >= 5 && hour < 12 ? "Morning" : hour >= 12 && hour < 17 ? "Afternoon" : "Evening",
    // A daytime or dusk view of campus, mirrored in a puddle, to match the hour.
    photo: evening ? "/campus/graded/buet-dusk-reflection.webp" : "/campus/graded/buet-day-reflection.webp",
    alt: evening
      ? "BUET buildings at dusk, reflected in standing water"
      : "BUET buildings on a clear day, reflected in standing water",
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const timeOfDay = getTimeOfDay();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const [counts, setCounts] = useState<QueueCounts | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${baseUrl}/complaints`).then((response) => response.ok ? response.json() : []),
      fetch(`${baseUrl}/notices`).then((response) => response.ok ? response.json() : []),
      fetch(`${baseUrl}/lost-found`).then((response) => response.ok ? response.json() : []),
      fetch(`${baseUrl}/marketplace`).then((response) => response.ok ? response.json() : []),
      fetch(`${baseUrl}/blood-donation`).then((response) => response.ok ? response.json() : []),
    ]).then(([complaints, notices, lostFound, marketplace, blood]) => {
      setCounts({
        complaints: complaints.filter((item: ComplaintRecord) => item.status !== "resolved").length,
        notices: notices.length,
        lostFound: lostFound.length,
        marketplace: marketplace.length,
        blood: blood.length,
      });
    }).catch(() => setCounts(null));
  }, []);

  const queue = [
    { title: "Open complaints", count: counts?.complaints, href: "/complaints", icon: MessageSquare },
    { title: "Latest notices", count: counts?.notices, href: "/notices", icon: Bell },
    { title: "Lost and found posts", count: counts?.lostFound, href: "/lost-found", icon: Search },
    { title: "Marketplace listings", count: counts?.marketplace, href: "/marketplace", icon: ShoppingBag },
    { title: "Blood donation entries", count: counts?.blood, href: "/blood-donation", icon: Droplets },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8 lg:p-10">
        <header className="dashboard-hero overflow-hidden rounded-xl">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
            <div className="relative z-10 flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  BUET <span aria-hidden="true" className="mx-2 opacity-50">•</span> {timeOfDay.label}
                  {user && (
                    <>
                      <span aria-hidden="true" className="mx-2 opacity-50">•</span>
                      {user.role === "admin" ? "Admin" : "Student"}
                    </>
                  )}
                </p>
                <h1 className="mt-4 font-display text-4xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
                  {timeOfDay.greeting}
                  {firstName ? "," : "."}
                  {firstName && (
                    <>
                      <br />
                      <span className="text-accent/80">{firstName}.</span>
                    </>
                  )}
                </h1>
                <div aria-hidden="true" className="mt-6 h-px w-10 bg-foreground/40" />
                <p className="mt-4 max-w-md text-[15px] leading-7 text-muted-foreground">Here's what's open on campus right now.</p>
              </div>

              <section aria-labelledby="quick-actions">
                <h2 id="quick-actions" className="sr-only">Quick actions</h2>
                <div className="flex flex-wrap gap-2">
                  <Button asChild><Link to="/lost-found"><Search aria-hidden="true" /> Post a lost or found item</Link></Button>
                  <Button asChild variant="outline"><Link to="/lend-borrow"><BookOpen aria-hidden="true" /> Lend and borrow</Link></Button>
                  <Button asChild variant="outline"><Link to="/marketplace"><ShoppingBag aria-hidden="true" /> Add a listing</Link></Button>
                  <Button asChild variant="outline"><Link to="/complaints"><MessageSquare aria-hidden="true" /> File a complaint</Link></Button>
                </div>
              </section>
            </div>

            <figure className="page-photo-frame relative hidden min-h-[320px] lg:block">
              <img src={timeOfDay.photo} alt={timeOfDay.alt} className="absolute inset-0 h-full w-full object-cover" />
            </figure>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <section aria-labelledby="work-queue" className="glass-panel overflow-hidden rounded-xl">
            <header className="flex items-end justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div>
                <h2 id="work-queue" className="font-display text-2xl font-normal tracking-[-0.01em]">Work queue</h2>
                <p className="mt-1 text-sm text-muted-foreground">Live counts from campus services</p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:inline">Updated from current records</span>
            </header>
            <div className="divide-y divide-white/[0.07]">
              {queue.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.035] sm:px-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-accent">
                    <item.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">View current records</span>
                  </span>
                  <span className="min-w-10 text-right font-display text-2xl tabular-nums text-foreground">
                    {item.count === undefined ? "—" : item.count}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <ActivityFeed />
        </div>
      </div>
    </MainLayout>
  );
}
