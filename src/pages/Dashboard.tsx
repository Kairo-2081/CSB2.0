import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        complaints: complaints.filter((item: any) => item.status !== "resolved").length,
        notices: notices.length,
        lostFound: lostFound.length,
        marketplace: marketplace.length,
        blood: blood.length,
      });
    }).catch(() => setCounts(null));
  }, []);

  const queue = [
    { title: "Open complaints", count: counts?.complaints, href: "/complaints" },
    { title: "Latest notices", count: counts?.notices, href: "/notices" },
    { title: "Lost and found posts", count: counts?.lostFound, href: "/lost-found" },
    { title: "Marketplace listings", count: counts?.marketplace, href: "/marketplace" },
    { title: "Blood donation entries", count: counts?.blood, href: "/blood-donation" },
  ];

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Campus activity and open work</p>
          </div>
          {user && <Badge variant="secondary">{user.role === "admin" ? "Admin" : "Student"}</Badge>}
        </div>

        <section aria-labelledby="work-queue">
          <h2 id="work-queue" className="mb-3 text-lg font-semibold">Work queue</h2>
          <div className="glass-panel divide-y divide-white/8 overflow-hidden rounded-2xl">
            {queue.map((item) => (
              <Link key={item.href} to={item.href} className="flex items-center justify-between px-5 py-4 transition-colors duration-150 hover:bg-white/[0.055]">
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-muted-foreground">
                  {item.count === undefined ? "Loading" : `${item.count}`}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <ActivityFeed />

        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/complaints">File a complaint</Link></Button>
          <Button asChild variant="outline"><Link to="/lost-found">Post a lost or found item</Link></Button>
          <Button asChild variant="outline"><Link to="/marketplace">Add a listing</Link></Button>
        </div>
      </div>
    </MainLayout>
  );
}
