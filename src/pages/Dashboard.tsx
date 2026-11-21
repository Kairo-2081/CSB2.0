import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, Droplets, MessageSquare, Search, ShoppingBag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    { title: "Open complaints", count: counts?.complaints, href: "/complaints", icon: MessageSquare, lead: true },
    { title: "Latest notices", count: counts?.notices, href: "/notices", icon: Bell },
    { title: "Lost and found posts", count: counts?.lostFound, href: "/lost-found", icon: Search },
    { title: "Marketplace listings", count: counts?.marketplace, href: "/marketplace", icon: ShoppingBag },
    { title: "Blood donation entries", count: counts?.blood, href: "/blood-donation", icon: Droplets },
  ];
  const total = counts ? queue.reduce((sum, item) => sum + (item.count ?? 0), 0) : undefined;
  const format = (value: number) => value.toLocaleString("en-US");

  return (
    <MainLayout>
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-medium text-foreground">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Campus activity and open work
              {user?.universityName && <span className="text-subtle"> · {user.universityName}</span>}
            </p>
          </div>

          <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
            <Button asChild><Link to="/complaints">File a complaint</Link></Button>
            <Button asChild variant="outline"><Link to="/lost-found">Post a lost or found item</Link></Button>
            <Button asChild variant="outline"><Link to="/marketplace">Add a listing</Link></Button>
            <Button asChild variant="outline"><Link to="/lend-borrow">Lend and borrow</Link></Button>
          </nav>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <section aria-labelledby="work-queue" className="glass-panel overflow-hidden rounded-2xl">
            <header className="flex items-baseline justify-between gap-4 px-6 pb-4 pt-6">
              <div>
                <h2 id="work-queue" className="text-lg font-medium leading-tight">Work queue</h2>
                <p className="mt-1 text-sm text-muted-foreground">Live counts from campus services</p>
              </div>
              <span className="stamp shrink-0">{total === undefined ? "— records" : `${format(total)} records`}</span>
            </header>

            <ul className="border-t border-border">
              {queue.map((item) => {
                const share = total && item.count ? (item.count / total) * 100 : 0;
                return (
                  <li key={item.href} className="border-b border-border last:border-b-0">
                    <Link
                      to={item.href}
                      className="group grid h-16 grid-cols-[16px_minmax(0,1fr)_auto_16px] items-center gap-3 px-6 transition-colors duration-150 hover:bg-white/[0.03] sm:grid-cols-[16px_minmax(0,1fr)_160px_64px_16px] sm:gap-4"
                    >
                      <item.icon className="h-4 w-4 text-subtle transition-colors duration-150 group-hover:text-foreground" aria-hidden="true" />
                      <span className="truncate text-sm text-foreground">{item.title}</span>
                      <span className="hidden h-1 overflow-hidden rounded-full bg-secondary sm:block" aria-hidden="true">
                        <span
                          className={cn("block h-full rounded-full", item.lead ? "bg-primary" : "bg-muted-foreground/40")}
                          style={{ width: `${share}%` }}
                        />
                      </span>
                      <span
                        className={cn(
                          "text-right text-2xl font-medium leading-none tabular-nums",
                          item.lead ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {item.count === undefined ? "—" : format(item.count)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-subtle transition-colors duration-150 group-hover:text-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <ActivityFeed />
        </div>
      </div>
    </MainLayout>
  );
}
