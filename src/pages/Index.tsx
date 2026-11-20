import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Search, MessageSquare, Bike, ShoppingBag, Bell, Heart, Droplets } from "lucide-react";

const modules = [
  { title: "Lost and found", description: "Report or locate campus items", href: "/lost-found", icon: Search },
  { title: "Complaints", description: "File and track an issue", href: "/complaints", icon: MessageSquare },
  { title: "Bicycle sharing", description: "View and register bicycles", href: "/bicycles", icon: Bike },
  { title: "Marketplace", description: "Buy and sell items", href: "/marketplace", icon: ShoppingBag },
  { title: "Notices", description: "Read official announcements", href: "/notices", icon: Bell },
  { title: "Blood donation", description: "View donation entries", href: "/blood-donation", icon: Droplets },
  { title: "Animal welfare", description: "Report an animal issue", href: "/animal-welfare", icon: Heart },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">C</div>
            <div>
              <p className="font-semibold">CSB 2.0</p>
              <p className="text-xs text-muted-foreground">Campus services</p>
            </div>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
            <Button asChild><Link to="/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="border-b border-border py-16">
          <p className="mb-3 text-sm font-medium text-primary">Campus services</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Find campus information and get everyday requests handled.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">CSB 2.0 brings the university's notices and student services into one place.</p>
          <div className="mt-8 flex gap-3">
            <Button asChild><Link to="/dashboard">Open dashboard</Link></Button>
            <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
          </div>
        </section>

        <section className="py-12" aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="mb-6 text-2xl font-semibold">Campus modules</h2>
          <div className="divide-y divide-border rounded-md border border-border">
            {modules.map((module) => (
              <Link key={module.href} to={module.href} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40">
                <module.icon className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h3 className="font-medium">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
