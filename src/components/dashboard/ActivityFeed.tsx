import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Search, 
  MessageSquare, 
  Bike, 
  ShoppingBag, 
  Heart, 
  Droplets,
  Clock
} from "lucide-react";

interface Activity {
  id: string;
  type: "lost_found" | "complaint" | "bicycle" | "marketplace" | "animal" | "blood";
  title: string;
  description: string;
  timestamp: string;
  status?: "pending" | "resolved" | "active";
}

const activities: Activity[] = [
  {
    id: "1",
    type: "lost_found",
    title: "Lost Student ID Card",
    description: "Found near the library entrance",
    timestamp: "5 min ago",
    status: "active",
  },
  {
    id: "2",
    type: "complaint",
    title: "AC not working in Lab 204",
    description: "Academic complaint submitted",
    timestamp: "15 min ago",
    status: "pending",
  },
  {
    id: "4",
    type: "blood",
    title: "Urgent: O+ Blood Required",
    description: "City Hospital, Contact: +91 98765 43210",
    timestamp: "2 hours ago",
    status: "active",
  },
  {
    id: "5",
    type: "marketplace",
    title: "Engineering Books for Sale",
    description: "3rd semester textbooks - ₹500",
    timestamp: "3 hours ago",
  },
];

const typeConfig = {
  lost_found: { icon: Search, color: "text-primary" },
  complaint: { icon: MessageSquare, color: "text-warning" },
  bicycle: { icon: Bike, color: "text-success" },
  marketplace: { icon: ShoppingBag, color: "text-accent" },
  animal: { icon: Heart, color: "text-destructive" },
  blood: { icon: Droplets, color: "text-destructive" },
};

const statusConfig = {
  pending: { label: "Pending", variant: "warning" as const },
  resolved: { label: "Resolved", variant: "success" as const },
  active: { label: "Active", variant: "info" as const },
};

export function ActivityFeed() {
  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Badge variant="secondary" className="text-xs">
          Live
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const { icon: Icon, color } = typeConfig[activity.type];
          return (
            <div
              key={activity.id}
              className={cn(
                "flex gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors animate-fade-in",
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card", color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.status && (
                    <Badge variant={statusConfig[activity.status].variant} className="text-xs">
                      {statusConfig[activity.status].label}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {activity.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
