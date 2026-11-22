import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const visibleNavItems: NavItem[] =
    user?.role === "admin"
      ? [...navItems, { title: "University network", href: "/central-admin", icon: Building2 }]
      : navItems;
  const activeTitle = visibleNavItems.find((item) => item.href === location.pathname)?.title ?? "Campus services";

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

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
        <div className="mx-2 mb-4 h-px bg-white/[0.07]" />
        <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">Services</p>
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-150",
                    active
                      ? "text-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-primary"
                      : "text-[#b7aea4] hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 font-display text-base text-accent">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name || "Guest user"}</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{user?.role || "Sign in to continue"}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 bg-gradient-to-b from-[#07070d] to-[#07070d]/0 px-4 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-foreground/30 bg-black/30 backdrop-blur-sm"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase leading-none tracking-[0.2em] text-muted-foreground">CSB 2.0 · BUET</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{activeTitle}</p>
        </div>
        {user?.name && (
          <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 font-display text-base text-accent" aria-hidden="true">
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
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/[0.06] bg-[#09090d] transition-transform duration-200 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-[110%]",
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <NavContent />
      </aside>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-[#09090d] lg:flex">
        <NavContent />
      </aside>
    </>
  );
}
