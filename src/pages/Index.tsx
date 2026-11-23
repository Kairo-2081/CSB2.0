import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { API_URL } from "@/lib/api-url";
import { useModules } from "@/lib/modules";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUpRight,
  Bell,
  Bike,
  BookOpen,
  Building2,
  KeyRound,
  LayoutGrid,
  ShieldCheck,
  Droplets,
  Heart,
  MessageSquare,
  PackageSearch,
  Search,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";


const modules = [
  { title: "Notices", description: "Read announcements from across campus", href: "/notices", icon: Bell },
  { title: "Lost and found", description: "Report or locate an item", href: "/lost-found", icon: Search },
  { title: "Lend and borrow", description: "Share useful items with other BUET students", href: "/lend-borrow", icon: BookOpen },
  { title: "Marketplace", description: "Buy and sell within campus", href: "/marketplace", icon: ShoppingBag },
  { title: "Complaints", description: "Report and track campus issues", href: "/complaints", icon: MessageSquare },
  { title: "Bicycles", description: "View and register bicycles", href: "/bicycles", icon: Bike },
  { title: "Blood donation", description: "Find and offer donors", href: "/blood-donation", icon: Droplets },
  { title: "Animal welfare", description: "Report an animal that needs help", href: "/animal-welfare", icon: Heart },
];

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Notices", href: "/notices" },
  { label: "Lost & found", href: "/lost-found" },
  { label: "Lend & borrow", href: "/lend-borrow" },
];

type CampusStats = {
  members: number;
  notices: number;
  openLostItems: number;
  itemsToBorrow: number;
};

type StatsState = { status: "loading" } | { status: "ready"; stats: CampusStats } | { status: "error" };

function useCampusStats(): StatsState {
  const [state, setState] = useState<StatsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/public/campus-stats`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body) => setState({ status: "ready", stats: body.stats }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, []);

  return state;
}

const numberFormat = new Intl.NumberFormat("en-US");

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: number | string | null; label: string }) {
  return (
    <li className="flex min-w-0 items-center gap-4 py-5 sm:px-6 sm:first:pl-0">
      <Icon className="h-7 w-7 shrink-0 text-primary/80" strokeWidth={1.25} aria-hidden="true" />
      <div className="min-w-0">
        <div className="font-display text-3xl leading-none text-foreground tabular-nums">
          {value === null ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" /> : typeof value === "number" ? numberFormat.format(value) : value}
        </div>
        <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/75">{label}</div>
      </div>
    </li>
  );
}

const liveStats: { key: keyof CampusStats; icon: LucideIcon; label: string }[] = [
  { key: "members", icon: Users, label: "BUET members" },
  { key: "notices", icon: Bell, label: "Notices posted" },
  { key: "openLostItems", icon: PackageSearch, label: "Lost items open" },
  { key: "itemsToBorrow", icon: BookOpen, label: "Items to borrow" },
];

// Facts that are true from the code itself, shown until the campus has real activity.
// Never replace these with invented counts.
const launchFacts: { icon: LucideIcon; value: string; label: string }[] = [
  { icon: Building2, value: "BUET", label: "Launch campus" },
  { icon: LayoutGrid, value: String(modules.length), label: "Campus services" },
  { icon: KeyRound, value: "1", label: "Sign-in for all of them" },
  { icon: ShieldCheck, value: "0", label: "Made-up numbers" },
];

export default function Index() {
  const { enabled } = useModules();
  const stats = useCampusStats();
  const ready = stats.status === "ready" ? stats.stats : null;
  // Show live counts only once at least two of them have something to report.
  const nonZero = ready ? liveStats.filter((s) => ready[s.key] > 0) : [];
  const showLive = stats.status === "loading" || nonZero.length >= 2;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden lg:min-h-[max(720px,min(100svh,960px))]">
        {/* Campus photograph, graded down so the type sits on a dusk-toned field */}
        <picture>
          <source media="(min-width: 960px)" srcSet="/campus/buet-hero.webp" />
          <img
            src="/campus/buet-hero-960.webp"
            alt="A BUET campus building: a cantilevered concrete block above red brick and colourful stripes, under a bright sky"
            fetchPriority="high"
            className="landing-photo absolute inset-0 -z-20 h-full w-full object-cover object-[38%_center] lg:left-auto lg:right-0 lg:w-[80%] lg:object-[12%_center]"
          />
        </picture>
        <div aria-hidden="true" className="landing-photo-shade absolute inset-0 -z-10" />

        <header className="relative z-20 px-5 pt-5 sm:px-10 sm:pt-7">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-foreground/70 font-display text-lg leading-none">C</span>
              <span className="text-sm font-medium uppercase tracking-[0.22em]">CSB 2.0</span>
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
              {navLinks.filter((link) => enabled(link.href)).map((link) =>
                link.href.startsWith("#") ? (
                  <a key={link.label} href={link.href} className="landing-nav-link">{link.label}</a>
                ) : (
                  <Link key={link.label} to={link.href} className="landing-nav-link">{link.label}</Link>
                ),
              )}
            </nav>
            <div className="flex items-center gap-3">
            <ThemeToggle className="h-[38px] bg-background/30 px-2.5 backdrop-blur-sm" />
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md border border-foreground/40 bg-background/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] backdrop-blur-sm transition-colors hover:border-foreground/80 hover:bg-background/50"
            >
              Sign in
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-5 pb-10 pt-24 sm:px-10 lg:justify-center lg:pb-36 lg:pt-10">
          <div className="max-w-[640px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/75">
              BUET <span aria-hidden="true" className="mx-2 text-foreground/75/50">•</span> Notices
              <span aria-hidden="true" className="mx-2 text-foreground/75/50">•</span> Lost &amp; found
              <span aria-hidden="true" className="mx-2 text-foreground/75/50">•</span> Lending
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.75rem,6.4vw,5.25rem)] font-normal leading-[0.98] tracking-[-0.02em]">
              Campus life,
              <br />
              in one place.
              <br />
              <span className="text-primary">Built for BUET.</span>
            </h1>
            <div aria-hidden="true" className="mt-8 h-px w-10 bg-foreground/50" />
            <p className="mt-6 max-w-[440px] text-[15px] leading-7 text-foreground/75">
              Notices, lost and found, lending and the campus marketplace for BUET students. One sign-in, and every post comes from someone on your campus.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                to="/auth"
                className="inline-flex items-center gap-3 rounded-md bg-primary px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-[0_12px_40px_rgba(242,169,59,0.25)] transition-colors hover:bg-[#f6bb5c]"
              >
                Get started
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <a href="#services" className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/90">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/45 transition-colors group-hover:border-foreground/90">
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </span>
                Browse services
              </a>
            </div>
          </div>
        </div>

        {(
          <div className="relative z-10 border-t border-foreground/10 bg-gradient-to-t from-background/80 to-transparent px-5 sm:px-10 lg:absolute lg:inset-x-0 lg:bottom-0">
            <ul className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 lg:grid-cols-4 lg:divide-x lg:divide-foreground/12" aria-label={showLive ? "Live counts from CSB 2.0 at BUET" : "About CSB 2.0 at BUET"}>
              {showLive
                ? (ready ? nonZero : liveStats).map((s) => (
                    <Stat key={s.key} icon={s.icon} value={ready ? ready[s.key] : null} label={s.label} />
                  ))
                : launchFacts.map((f) => <Stat key={f.label} icon={f.icon} value={f.value} label={f.label} />)}
            </ul>
          </div>
        )}

        <a
          href="#services"
          aria-label="Scroll to services"
          className="absolute bottom-8 right-8 z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-foreground/35 bg-background/30 backdrop-blur-sm transition-colors hover:border-foreground/80 lg:flex"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      <main id="services" className="scroll-mt-6 px-5 py-20 sm:px-10 lg:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-foreground/75">Campus services</p>
              <h2 className="mt-4 font-display text-4xl font-normal leading-[1.05] tracking-[-0.015em] sm:text-5xl">
                Everything on campus,
                <br />
                <span className="text-primary">one sign-in.</span>
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-7 text-foreground/75">
                Choose a service to continue. You'll be asked to sign in first.
              </p>
            </div>

            <ul className="grid border-t border-foreground/10 sm:grid-cols-2">
              {modules.filter((module) => enabled(module.href)).map((module) => (
                <li key={module.href} className="border-b border-foreground/10 sm:odd:border-r sm:odd:border-r-foreground/10">
                  <Link to={module.href} className="group flex h-full items-start gap-4 p-5 transition-colors hover:bg-foreground/[0.04] sm:p-6">
                    <module.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{module.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-foreground/75">{module.description}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/75 transition-colors group-hover:text-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-foreground/10 px-5 py-6 text-sm text-foreground/75 sm:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="uppercase tracking-[0.18em] text-[11px]">CSB 2.0</span>
          <span className="flex items-center gap-5">
            <span>Starting at BUET. More campuses later.</span>
            <Link to="/privacy" className="text-foreground/75 underline-offset-4 hover:underline">Privacy</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
