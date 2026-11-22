import { API_URL } from "@/lib/api-url";

/** An API error with the HTTP status, so callers can tell 401 from 403. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Fired when the server says the session is gone; AuthContext signs out. */
export const UNAUTHORIZED_EVENT = "csb:unauthorized";

/**
 * Every API call goes through here. The session travels in an HttpOnly
 * cookie, so there is no token to attach and nothing for a script to steal.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error) ||
      (res.status === 429 ? "Too many attempts. Please wait and try again." : `Request failed (${res.status})`);
    if (res.status === 401 && !path.startsWith("/auth/login")) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, message);
  }
  return data as T;
}
