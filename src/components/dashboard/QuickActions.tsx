import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Droplets,
  ArrowRight
} from "lucide-react";

const quickActions = [
  {
    title: "Report Lost Item",
    description: "Post about a lost or found item",
    href: "/lost-found",
    icon: Search,
  },
  {
    title: "File Complaint",
    description: "Submit a new complaint",
    href: "/complaints",
    icon: MessageSquare,
  },
  {
    title: "Sell Item",
    description: "List an item on marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
  },
  {
    title: "Blood Request",
    description: "Request or donate blood",
    href: "/blood-donation",
    icon: Droplets,
  },
];

export function QuickActions() {
  return (
    <Card variant="glass">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {quickActions.map((action, index) => (
          <Link key={action.href} to={action.href}>
            <Button
              variant="secondary"
              className="w-full justify-between h-auto py-4 px-5 group animate-slide-up min-h-[80px]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-base font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
