import { useEffect, useState } from "react";
import { api } from "@/lib/http";

/** Every module the server knows. The server's MODULES env var switches them on. */
export const ALL_MODULES = [
  "notices", "complaints", "marketplace", "lost-found", "bicycles", "blood-donation",
  "animal-welfare", "faculty-suggestions", "lend-borrow", "students",
] as const;
export type ModuleName = (typeof ALL_MODULES)[number];

/** The module a page path belongs to, if any ("/students" -> "students"). */
export function moduleForPath(path: string): ModuleName | null {
  const first = path.split("/")[1] ?? "";
  return (ALL_MODULES as readonly string[]).includes(first) ? (first as ModuleName) : null;
}

interface SiteConfig {
  modules: ModuleName[];
  emailVerification: "required" | "off";
  assistant?: "on" | "off";
}

let cached: Promise<SiteConfig> | null = null;
function loadConfig(): Promise<SiteConfig> {
  cached ??= api<SiteConfig>("/modules").catch(() => ({
    // If the check fails, show everything; the API still enforces it.
    modules: [...ALL_MODULES],
    emailVerification: "off" as const,
    assistant: "off" as const,
  }));
  return cached;
}

/** The enabled modules; every module until the server has answered. */
export function useModules(): {
  enabled: (path: string) => boolean;
  ready: boolean;
  emailVerificationRequired: boolean;
  assistant: boolean;
} {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  useEffect(() => {
    let alive = true;
    void loadConfig().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  const modules = config?.modules ?? null;
  return {
    ready: config !== null,
    emailVerificationRequired: config?.emailVerification === "required",
    assistant: config?.assistant === "on",
    enabled: (path: string) => {
      const name = moduleForPath(path);
      return name === null || modules === null || modules.includes(name);
    },
  };
}
