import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/report-error";

interface State {
  failed: boolean;
}

/**
 * If a page crashes while rendering, show a way out instead of a blank
 * screen, and report the crash with the component stack.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError("react", error, info.componentStack ?? undefined);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center text-foreground">
        <p className="font-display text-4xl">Something broke on this page.</p>
        <p className="max-w-md text-[15px] leading-7 text-muted-foreground">
          It has been reported. Reloading usually fixes it; nothing you posted is lost.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="button-primary rounded-md px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground"
          >
            Reload
          </button>
          <a href="/dashboard" className="rounded-md border border-foreground/30 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }
}
