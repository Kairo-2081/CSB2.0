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

let cached: Promise<ModuleName[]> | null = null;
function loadModules(): Promise<ModuleName[]> {
  cached ??= api<{ modules: ModuleName[] }>("/modules")
    .then((d) => d.modules)
    .catch(() => [...ALL_MODULES]); // if the check fails, show everything; the API still enforces it
  return cached;
}

/** The enabled modules; every module until the server has answered. */
export function useModules(): { enabled: (path: string) => boolean; ready: boolean } {
  const [modules, setModules] = useState<ModuleName[] | null>(null);
  useEffect(() => {
    let alive = true;
    void loadModules().then((m) => alive && setModules(m));
    return () => {
      alive = false;
    };
  }, []);
  return {
    ready: modules !== null,
    enabled: (path: string) => {
      const name = moduleForPath(path);
      return name === null || modules === null || modules.includes(name);
    },
  };
}
