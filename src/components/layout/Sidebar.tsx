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

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="glass-control flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-primary">
          C
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">CSB 2.0</h1>
          <p className="text-xs text-muted-foreground">Campus services</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mx-2 mb-3 h-px bg-white/8" />
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "glass-control text-foreground"
                      : "text-sidebar-foreground hover:bg-white/[0.055] hover:text-foreground",
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

      <div className="m-3 rounded-xl border border-white/10 bg-white/[0.055] p-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="glass-control flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-primary">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.name || "Guest user"}</p>
            <p className="text-xs text-muted-foreground">{user?.role || "Sign in to continue"}</p>
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
      <button
        onClick={() => setIsMobileOpen(true)}
        className="glass-control fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "glass-shell fixed inset-y-3 left-3 z-50 w-64 rounded-2xl transition-transform duration-200 lg:hidden",
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

      <aside className="glass-shell fixed inset-y-3 left-3 z-40 hidden w-64 flex-col rounded-2xl lg:flex">
        <NavContent />
      </aside>
    </>
  );
}
