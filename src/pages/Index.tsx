import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Bike,
  Bell,
  BookOpen,
  Droplets,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Search,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen p-2 sm:p-3">
      <div className="app-stage landing-stage mx-auto max-w-[1600px] overflow-hidden">
        <header className="sticky top-0 z-30 px-4 pt-4 sm:px-8">
          <div className="glass-shell mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:rounded-full sm:px-5">
            <Link to="/" className="flex shrink-0 items-center gap-3">
              <span className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">C</span>
              <span>
                <span className="block font-semibold leading-tight">CSB 2.0</span>
                <span className="hidden text-xs text-muted-foreground sm:block">Campus services</span>
              </span>
            </Link>
            <nav aria-label="Account" className="flex shrink-0 items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="w-10 px-0 sm:w-auto sm:px-3">
                <Link to="/dashboard" aria-label="Open dashboard">
                  <LayoutDashboard aria-hidden="true" />
                  <span className="hidden sm:inline">Open dashboard</span>
                </Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-7xl">
          <section className="landing-hero flex min-h-[min(74vh,760px)] flex-col items-center justify-center px-6 py-24 text-center sm:px-12">
            <div className="relative z-10 max-w-4xl">
              <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
                Campus services,
                <br className="hidden sm:block" /> one place to start.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Read notices, report campus issues, find items, and share resources with your university community.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <a href="#services">
                    Browse services
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </div>
            </div>
          </section>

          <section id="services" aria-labelledby="services-heading" className="scroll-mt-24 px-5 pb-16 sm:px-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="services-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Campus services
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a service to continue.</p>
              </div>
            </div>

            <div className="glass-panel grid overflow-hidden rounded-2xl sm:grid-cols-2">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  to={module.href}
                  className="group flex min-w-0 items-center gap-4 border-b border-white/[0.07] p-5 transition-colors duration-200 hover:bg-white/[0.045] sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-r-white/[0.07]"
                >
                  <span className="glass-control flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-primary transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                    <module.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{module.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{module.description}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        </main>

        <footer className="relative z-10 border-t border-white/[0.07] px-5 py-5 text-sm text-muted-foreground sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <span>CSB 2.0</span>
            <span>Campus services</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
