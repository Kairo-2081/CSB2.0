import { useEffect, useState } from "react";
import { Bell, MessageSquare, Search } from "lucide-react";

interface FeedItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  kind: "complaint" | "notice" | "lost-found";
}

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${baseUrl}/complaints`).then((response) => response.ok ? response.json() : []),
      fetch(`${baseUrl}/notices`).then((response) => response.ok ? response.json() : []),
      fetch(`${baseUrl}/lost-found`).then((response) => response.ok ? response.json() : []),
    ]).then(([complaints, notices, lostFound]) => {
      const merged: FeedItem[] = [
        ...complaints.map((item: any) => ({
          id: `complaint-${item.id}`,
          title: item.title,
          description: item.category ? `${item.category} complaint` : "Complaint",
          createdAt: item.created_at,
          kind: "complaint" as const,
        })),
        ...notices.map((item: any) => ({
          id: `notice-${item.id}`,
          title: item.title,
          description: item.category || "Notice",
          createdAt: item.created_at,
          kind: "notice" as const,
        })),
        ...lostFound.map((item: any) => ({
          id: `lost-found-${item.id}`,
          title: item.title,
          description: item.status || "Lost and found",
          createdAt: item.created_at,
          kind: "lost-found" as const,
        })),
      ];
      setItems(merged
        .filter((item) => item.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10));
    }).catch(() => setError("Could not load recent activity"));
  }, []);

  const iconFor = (kind: FeedItem["kind"]) =>
    kind === "complaint" ? MessageSquare : kind === "notice" ? Bell : Search;

  const currentYear = new Date().getFullYear();
  const stamp = (value: string) => {
    const date = new Date(value);
    const day = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(date.getFullYear() !== currentYear && { year: "numeric" }),
    });
    const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} · ${time}`;
  };

  return (
    <section aria-labelledby="latest-activity" className="glass-panel overflow-hidden rounded-2xl">
      <header className="px-6 pb-4 pt-6">
        <h2 id="latest-activity" className="text-lg font-medium leading-tight">Latest activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Complaints, notices and lost and found</p>
      </header>

      <div className="border-t border-border">
        {error && <p className="px-6 py-4 text-sm text-destructive">{error}</p>}
        {items.length === 0 && !error && <p className="px-6 py-4 text-sm text-muted-foreground">No recent activity</p>}
        <ol>
          {items.map((item) => {
            const Icon = iconFor(item.kind);
            return (
              <li key={item.id} className="grid grid-cols-[16px_minmax(0,1fr)_auto] gap-3 border-b border-border px-6 py-3 last:border-b-0">
                <Icon className="mt-0.5 h-4 w-4 text-subtle" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{item.title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground first-letter:uppercase">{item.description}</p>
                </div>
                <time dateTime={item.createdAt} className="stamp mt-0.5 whitespace-nowrap">{stamp(item.createdAt)}</time>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
