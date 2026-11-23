import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/lib/modules";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Bell,
  Bike,
  ShoppingBag,
  Heart,
  Droplets,
  User,
  Menu,
  X,
  LogOut,
  Building2,
  GraduationCap,
  BookOpen,
  ChartNoAxesColumn,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { hueFor } from "@/lib/board-hues";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Notices", href: "/notices", icon: Bell },
  { title: "Lost and found", href: "/lost-found", icon: Search },
  { title: "Lend and borrow", href: "/lend-borrow", icon: BookOpen },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { title: "Complaints", href: "/complaints", icon: MessageSquare },
  { title: "Bicycles", href: "/bicycles", icon: Bike },
  { title: "Blood donation", href: "/blood-donation", icon: Droplets },
  { title: "Animal welfare", href: "/animal-welfare", icon: Heart },
  { title: "Faculty suggestions", href: "/faculty-suggestions", icon: GraduationCap },
  { title: "Student directory", href: "/students", icon: User },
  { title: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { enabled } = useModules();
  const visibleNavItems: NavItem[] = [
    ...navItems.filter((item) => enabled(item.href)),
  ];
  const adminNavItems: NavItem[] = user?.role === "admin"
    ? [
        { title: "Overview", href: "/admin", icon: ChartNoAxesColumn },
        { title: "University network", href: "/central-admin", icon: Building2 },
      ]
    : [];
  const activeTitle = [...visibleNavItems, ...adminNavItems].find((item) => item.href === location.pathname)?.title ?? "Campus services";

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const NavList = ({ items }: { items: NavItem[] }) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = location.pathname === item.href;
        return (
          <li key={item.href} className="hue-scope" style={{ "--hue": hueFor(item.href) } as React.CSSProperties}>
            <Link
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-[color,background-color,transform] duration-200",
                active
                  ? "bg-third/10 font-semibold text-third-ink"
                  : "text-foreground/75 hover:translate-x-0.5 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-[background-color,transform] duration-200 group-hover:scale-110",
                  active ? "bg-third text-background" : "bg-third/15 text-third-ink",
                )}
              >
                <item.icon className="h-4 w-4" />
              </span>
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex h-20 items-center gap-3 px-5" onClick={() => setIsMobileOpen(false)}>
        <span className="brand-mark flex h-9 w-9 items-center justify-center text-lg leading-none">C</span>
        <span>
          <span className="block text-sm font-medium uppercase tracking-[0.22em] text-foreground">CSB 2.0</span>
          <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">BUET campus</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mx-2 mb-4 h-px bg-foreground/[0.07]" />
        <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Services</p>
        <NavList items={visibleNavItems} />
        {adminNavItems.length > 0 && (
          <>
            <p className="mb-3 mt-7 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Administration</p>
            <NavList items={adminNavItems} />
          </>
        )}
      </nav>

      <div className="border-t border-foreground/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 font-display text-base text-accent">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name || "Guest user"}</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{user?.role || "Sign in to continue"}</p>
          </div>
          <ThemeToggle className="h-8 px-2" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 bg-gradient-to-b from-background to-background/0 px-4 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-foreground/30 bg-background/40 backdrop-blur-sm"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase leading-none tracking-[0.2em] text-muted-foreground">CSB 2.0 · BUET</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{activeTitle}</p>
        </div>
        <ThemeToggle className="ml-auto h-9 shrink-0 bg-background/40 px-2.5 backdrop-blur-sm" />
        {user?.name && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 font-display text-base text-accent" aria-hidden="true">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </header>

      {isMobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-foreground/[0.06] bg-sidebar transition-transform duration-200 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-[110%]",
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <NavContent />
      </aside>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-foreground/[0.06] bg-sidebar lg:flex">
        <NavContent />
      </aside>
    </>
  );
}
