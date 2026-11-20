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
      <header className="sticky top-0 z-30 px-3 pt-3">
        <div className="glass-shell mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3">
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

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="py-16 sm:py-24">
          <div className="glass-panel relative overflow-hidden rounded-[28px] px-7 py-12 sm:px-12 sm:py-16">
            <div className="absolute right-[-8rem] top-[-8rem] h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <h1 className="relative max-w-4xl text-4xl font-bold leading-[1.04] sm:text-6xl lg:text-7xl">Campus services, in one clear workspace.</h1>
          <p className="relative mt-6 max-w-2xl text-lg text-muted-foreground">Find notices, report issues, post items, and use campus resources without switching between separate tools.</p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Button asChild><Link to="/dashboard">Open dashboard</Link></Button>
            <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
          </div>
          </div>
        </section>

        <section className="py-12" aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="mb-6 text-2xl font-semibold">Campus modules</h2>
          <div className="glass-panel divide-y divide-white/8 overflow-hidden rounded-2xl">
            {modules.map((module) => (
              <Link key={module.href} to={module.href} className="group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.055]">
                <div className="glass-control flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <module.icon className="h-5 w-5 text-primary" />
                </div>
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
