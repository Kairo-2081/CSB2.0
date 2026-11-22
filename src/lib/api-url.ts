// Where the frontend sends API requests.
// - VITE_API_URL wins when set (frontend and API on different hosts).
// - In development the API runs separately on port 3001.
// - In a production build the same server serves the site and the API, so a
//   relative path works on any domain (Render, a custom domain, localhost).
export const API_URL: string =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001/api" : "/api");
