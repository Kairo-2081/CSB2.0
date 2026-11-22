import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Switches between the dark and light themes. While the switch happens, the
 * html element carries .theme-switching so colours ease across instead of
 * snapping (index.css; skipped when the reader prefers reduced motion).
 */
export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isLight = mounted && resolvedTheme === "light";
  const next = isLight ? "dark" : "light";

  const toggle = () => {
    const root = document.documentElement;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 320);
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={cn(
        "group inline-flex h-9 items-center gap-2 rounded-full border border-foreground/15 px-2.5 text-muted-foreground transition-colors hover:border-foreground/35 hover:text-foreground",
        className,
      )}
    >
      <span className="relative block h-4 w-4">
        <Sun aria-hidden="true" className={cn("absolute inset-0 h-4 w-4 transition-all duration-300", isLight ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} />
        <Moon aria-hidden="true" className={cn("absolute inset-0 h-4 w-4 transition-all duration-300", isLight ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      </span>
      {withLabel && <span className="text-[11px] font-medium uppercase tracking-[0.14em]">{isLight ? "Light" : "Dark"}</span>}
    </button>
  );
}
