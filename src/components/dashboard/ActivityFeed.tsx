import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-2xl font-normal tracking-[-0.01em]">Latest activity</CardTitle></CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {items.length === 0 && !error && <p className="text-sm text-muted-foreground">No recent activity</p>}
        <div className="divide-y divide-border">
          {items.map((item) => {
            const Icon = iconFor(item.kind);
            return (
              <div key={item.id} className="flex gap-3 py-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
