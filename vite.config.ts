import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Standalone admin console for auth-service. Talks to it directly — no
// gateway/BFF in front. Set VITE_AUTH_BASE_URL to point at a deployed
// instance; leave it unset and the dev proxy below forwards /auth/* to a
// local auth-service on :8100.
//
// Port 5176 keeps it clear of the sibling knowledge-ingest-ui (:5174).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 5176,
    proxy: {
      "/auth": {
        target: "http://localhost:8100",
        changeOrigin: true,
      },
    },
  },
});
