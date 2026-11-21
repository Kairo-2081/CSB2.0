import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Bell, BookOpen, Droplets, MessageSquare, Search, ShoppingBag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
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

export default function Dashboard() {
  const { user } = useAuth();
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
        <header className="dashboard-hero rounded-[28px] p-5 sm:p-7 lg:p-9">
          <div className="relative z-10 space-y-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Dashboard</h1>
                <p className="mt-2 text-muted-foreground">Campus activity and open work</p>
              </div>
              {user && (
                <Badge variant="secondary" className="glass-control w-fit rounded-full px-3 py-1.5">
                  {user.role === "admin" ? "Admin" : "Student"}
                </Badge>
              )}
            </div>

            <section aria-labelledby="quick-actions" className="border-t border-white/[0.12] pt-5">
              <h2 id="quick-actions" className="mb-3 text-sm font-medium text-secondary-foreground">Quick actions</h2>
              <div className="flex flex-wrap gap-2">
                <Button asChild><Link to="/complaints">File a complaint</Link></Button>
                <Button asChild variant="outline"><Link to="/lost-found">Post a lost or found item</Link></Button>
                <Button asChild variant="outline"><Link to="/marketplace"><ShoppingBag aria-hidden="true" /> Add a listing</Link></Button>
                <Button asChild variant="outline"><Link to="/lend-borrow"><BookOpen aria-hidden="true" /> Lend and borrow</Link></Button>
              </div>
            </section>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <section aria-labelledby="work-queue" className="glass-panel overflow-hidden rounded-2xl">
            <header className="flex items-end justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-6">
              <div>
                <h2 id="work-queue" className="text-xl font-semibold">Work queue</h2>
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
                  <span className="glass-control flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                    <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">View current records</span>
                  </span>
                  <span className="glass-control min-w-10 rounded-full px-3 py-1 text-center text-sm font-medium tabular-nums text-foreground">
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
