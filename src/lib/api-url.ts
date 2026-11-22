// Where the frontend sends API requests.
// - VITE_API_URL wins when set (frontend and API on different hosts; the API
//   must then list this site in CORS_ORIGINS).
// - Otherwise "/api" on the same origin: in production the server serves the
//   site, and in development Vite proxies /api to the API on port 3001, so
//   the session cookie is always first-party.
export const API_URL: string = import.meta.env.VITE_API_URL || "/api";
