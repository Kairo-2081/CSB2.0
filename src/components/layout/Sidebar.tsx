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
  { title: "Lost and found", href: "/lost-found", icon: Search },
  { title: "Complaints", href: "/complaints", icon: MessageSquare },
  { title: "Notices", href: "/notices", icon: Bell },
  { title: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { title: "Bicycles", href: "/bicycles", icon: Bike },
  { title: "Lend and borrow", href: "/lend-borrow", icon: BookOpen },
  { title: "Animal welfare", href: "/animal-welfare", icon: Heart },
  { title: "Blood donation", href: "/blood-donation", icon: Droplets },
  { title: "Student directory", href: "/students", icon: User },
  { title: "Faculty suggestions", href: "/faculty-suggestions", icon: GraduationCap },
  { title: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const visibleNavItems: NavItem[] =
    user?.role === "admin"
      ? [{ title: "University network", href: "/central-admin", icon: Building2 }, ...navItems]
      : navItems;
  const activeTitle = visibleNavItems.find((item) => item.href === location.pathname)?.title ?? "Campus services";

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role ? "Student" : "Sign in to continue";

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-3 px-4">
        <div className="brand-mark flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold" aria-hidden="true">
          C
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-foreground">CSB 2.0</p>
          <p className="text-xs text-subtle">Campus services</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-2" aria-label="Main">
        <ul className="space-y-0.5">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-sidebar-accent text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                      : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      active ? "text-primary" : "text-subtle group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground" aria-hidden="true">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium text-foreground">{user?.name || "Guest user"}</p>
          <p className="truncate text-xs text-subtle">{roleLabel}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 leading-tight">
          <p className="text-xs text-subtle">CSB 2.0</p>
          <p className="truncate text-sm font-medium text-foreground">{activeTitle}</p>
        </div>
        {user?.name && (
          <span className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground" aria-hidden="true">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </header>

      {isMobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <NavContent />
      </aside>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
        <NavContent />
      </aside>
    </>
  );
}
