import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Bike,
  ShoppingBag,
  Heart,
  Droplets,
  Database,
  Shield,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  Lock
} from "lucide-react";

const features = [
  { icon: Search, title: "Lost & Found", description: "Report and find lost items", href: "/lost-found" },
  { icon: MessageSquare, title: "Complaints", description: "Submit and track issues", href: "/complaints" },
  { icon: Bike, title: "Bicycle Sharing", description: "Book campus bicycles", href: "/bicycles" },
  { icon: ShoppingBag, title: "Marketplace", description: "Buy and sell items", href: "/marketplace" },
  { icon: Heart, title: "Animal Welfare", description: "Report animal issues", href: "/animal-welfare" },
  { icon: Droplets, title: "Blood Donation", description: "Request or donate blood", href: "/blood-donation" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-glow">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">CSB 2.0</h1>
              <p className="text-xs text-muted-foreground">University Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="glow" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="info" className="mb-6 gap-1.5 animate-fade-in">
          <Sparkles className="h-3 w-3" />
          Version 2.0 Now Live
        </Badge>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
          University Management
          <br />
          <span className="gradient-text">Reimagined</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
          A modern, secure, and scalable platform for managing campus life. 
          From lost items to blood donations — everything in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <Link to="/dashboard">
            <Button variant="glow" size="xl" className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="xl" className="gap-2">
              <Lock className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-16 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">100+</p>
            <p className="text-sm text-muted-foreground">Students</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">50+</p>
            <p className="text-sm text-muted-foreground">Faculty</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">10+</p>
            <p className="text-sm text-muted-foreground">Modules</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comprehensive modules designed to streamline university operations and enhance student experience.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Link key={feature.href} to={feature.href}>
              <Card 
                variant="interactive" 
                className="h-full group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="relative container mx-auto px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card variant="glass" className="p-6 animate-slide-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Compliant</h3>
            <p className="text-sm text-muted-foreground">
              Role-based access control, encrypted data, and complete audit logging for all activities.
            </p>
          </Card>

          <Card variant="glass" className="p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Real-time Updates</h3>
            <p className="text-sm text-muted-foreground">
              Instant notifications, live activity feeds, and real-time status updates across all modules.
            </p>
          </Card>

          <Card variant="glass" className="p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">For Everyone</h3>
            <p className="text-sm text-muted-foreground">
              Designed for students, faculty, and administrators with tailored interfaces for each role.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                C
              </div>
              <span className="text-sm text-muted-foreground">CSB 2.0 © 2025</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built by The Redemption
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
