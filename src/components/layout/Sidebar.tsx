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
  Database,
  GraduationCap,
  User,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lost & Found",
    href: "/lost-found",
    icon: Search,
  },
  {
    title: "Queries",
    icon: MessageSquare,
    children: [
      { title: "Complaints", href: "/complaints" },
      { title: "Notices", href: "/notices" },
    ],
  },
  {
    title: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
  },
  {
    title: "Health",
    icon: Heart,
    children: [
      { title: "Animal Welfare", href: "/animal-welfare" },
      { title: "Blood Donation", href: "/blood-donation" },
    ],
  },
  {
    title: "Database",
    icon: Database,
    children: [
      { title: "Student Directory", href: "/students" },
      { title: "Faculty Suggestions", href: "/faculty-suggestions" },
    ],
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Queries", "Health", "Database"]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isChildActive = (children?: { href: string }[]) =>
    children?.some((child) => location.pathname === child.href);

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          C
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">CSB 2.0</h1>
          <p className="text-xs text-muted-foreground">University Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.title}>
              {item.href ? (
                <Link
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive(item.href) && "text-primary")} />
                  {item.title}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isChildActive(item.children)
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-5 w-5", isChildActive(item.children) && "text-primary")} />
                      {item.title}
                    </div>
                    {expandedItems.includes(item.title) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedItems.includes(item.title) && item.children && (
                    <ul className="ml-6 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              "flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              isActive(child.href)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                            )}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'Sign in to continue'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent"
        >
          <X className="h-4 w-4" />
        </button>
        <NavContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>
    </>
  );
}
