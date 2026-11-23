/**
 * Sends browser errors to /api/client-errors, where they join the server's
 * JSON log (msg "client error"). At most 10 reports per page load, and the
 * same message only once, so a loop of errors can't flood the log.
 */
const sent = new Set<string>();
let count = 0;

export type ErrorKind = "error" | "unhandledrejection" | "react";

export function reportError(kind: ErrorKind, error: unknown, component?: string) {
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error) ?? "Unknown error");
  const key = `${kind}:${err.message}`;
  if (sent.has(key) || count >= 10) return;
  sent.add(key);
  count += 1;
  const body = JSON.stringify({
    kind,
    message: (err.message || "Unknown error").slice(0, 500),
    stack: err.stack?.slice(0, 4000),
    url: window.location.pathname.slice(0, 500),
    component: component?.slice(0, 2000),
    release: import.meta.env.VITE_RELEASE?.slice(0, 40),
  });
  try {
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body,
    }).catch(() => {});
  } catch {
    /* never let reporting throw */
  }
}

/** Catch errors that escape React: script errors and rejected promises nobody handled. */
export function installGlobalErrorReporting() {
  window.addEventListener("error", (event) => {
    // Resource load failures (an image 404) have no error object; skip them.
    if (event.error) reportError("error", event.error);
  });
  window.addEventListener("unhandledrejection", (event) => reportError("unhandledrejection", event.reason));
}
