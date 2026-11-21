import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#07070d]">
      <img
        src="/campus/buet-day-reflection.webp"
        alt=""
        className="auth-photo absolute inset-0 -z-20 h-full w-full object-cover opacity-60 blur-[2px]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#07070d] via-[#07070d]/80 to-[#07070d]/60" />

      <header className="px-5 pt-6 sm:px-10">
        <Link to="/" className="flex w-fit items-center gap-3">
          <span className="brand-mark flex h-9 w-9 items-center justify-center text-lg leading-none">C</span>
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-foreground">CSB 2.0</span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 py-16 sm:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Error 404 <span aria-hidden="true" className="mx-2 opacity-50">•</span> <code className="font-sans normal-case tracking-normal">{location.pathname}</code>
        </p>
        <h1 className="mt-5 font-display text-5xl font-normal leading-[1] tracking-[-0.02em] text-foreground sm:text-7xl">
          This page isn't
          <br />
          <span className="text-accent/80">on campus.</span>
        </h1>
        <div aria-hidden="true" className="mt-8 h-px w-10 bg-foreground/50" />
        <p className="mt-6 max-w-md text-[15px] leading-7 text-muted-foreground">
          The link may be old or mistyped. Head back to the start, or open your dashboard.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-md bg-primary px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-[#bca08a]"
          >
            Back to start
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-md border border-foreground/30 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:border-foreground/70"
          >
            Open dashboard
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
