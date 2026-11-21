import { Link } from "react-router-dom";
import { Bike, Bell, BookOpen, ChevronRight, Droplets, Heart, MessageSquare, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

const modules = [
  { title: "Notices", description: "Read university announcements", href: "/notices", icon: Bell },
  { title: "Complaints", description: "Report and track campus issues", href: "/complaints", icon: MessageSquare },
  { title: "Lost and found", description: "Report or locate an item", href: "/lost-found", icon: Search },
  { title: "Lend and borrow", description: "Share useful items on campus", href: "/lend-borrow", icon: BookOpen },
  { title: "Marketplace", description: "Browse campus listings", href: "/marketplace", icon: ShoppingBag },
  { title: "Bicycles", description: "View and register bicycles", href: "/bicycles", icon: Bike },
  { title: "Blood donation", description: "View donor entries", href: "/blood-donation", icon: Droplets },
  { title: "Animal welfare", description: "Report an animal issue", href: "/animal-welfare", icon: Heart },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="brand-mark flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold" aria-hidden="true">C</span>
            <span className="text-base font-medium text-foreground">CSB 2.0</span>
          </Link>
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
            <Link to="/auth" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-4 py-16 sm:px-8 lg:min-h-[calc(100vh-64px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="stamp">Campus services · CSB 2.0</p>
            <h1 className="mt-6 text-[40px] font-medium leading-[1.06] tracking-[-0.025em] text-foreground sm:text-[56px] lg:text-[64px]">
              The campus noticeboard, and every request behind it
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-8 text-muted-foreground">
              Read notices, report campus issues, find items and share resources with your university community.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#services">Browse services</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <ActivityFeed
              limit={5}
              title="On the board now"
              description="The latest complaints, notices and lost and found posts"
              className="shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
            />
          </div>
        </section>

        <section id="services" aria-labelledby="services-heading" className="mx-auto max-w-[1280px] scroll-mt-20 px-4 pb-24 sm:px-8">
          <div className="flex flex-col gap-2 border-t border-border pt-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="services-heading" className="text-3xl font-medium leading-tight text-foreground">Campus services</h2>
              <p className="mt-2 text-sm text-muted-foreground">Choose a service to continue</p>
            </div>
            <p className="stamp">{modules.length} services</p>
          </div>

          <div className="glass-panel mt-8 grid overflow-hidden rounded-2xl sm:grid-cols-2">
            {modules.map((module, index) => (
              <Link
                key={module.href}
                to={module.href}
                className={`group flex min-w-0 items-center gap-4 px-6 py-5 transition-colors duration-150 hover:bg-white/[0.03] ${index > 0 ? "border-t border-border" : ""} ${index === 1 ? "sm:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l" : ""}`}
              >
                <module.icon className="h-4 w-4 shrink-0 text-subtle transition-colors duration-150 group-hover:text-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-foreground">{module.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{module.description}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-subtle transition-colors duration-150 group-hover:text-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 text-sm text-subtle sm:px-8">
          <span>CSB 2.0</span>
          <span>Campus services</span>
        </div>
      </footer>
    </div>
  );
}
