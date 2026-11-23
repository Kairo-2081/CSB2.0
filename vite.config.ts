import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Same-origin API in development, so the session cookie is first-party.
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: false },
    },
  },
  // Which build an error report came from: Render sets RENDER_GIT_COMMIT at build time.
  define: {
    "import.meta.env.VITE_RELEASE": JSON.stringify((process.env.RENDER_GIT_COMMIT || "dev").slice(0, 7)),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
