import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Standalone admin console for auth-service. Talks to it directly — no
// gateway/BFF in front.
//
// Two ways to choose the backend, and they are not interchangeable:
//
//   AUTH_PROXY_TARGET    where this dev server forwards /auth/* (default: a
//                        local auth-service on :8100). The browser only ever
//                        talks to this dev server, so the hop to the target
//                        is server-side and CORS does not apply. Use this to
//                        develop against a DEPLOYED auth-service.
//
//   VITE_AUTH_BASE_URL   baked into the bundle as an absolute base URL, so
//                        the browser calls that host directly. Needed when
//                        this console is itself deployed — and then the
//                        target's AUTHSVC_CORS_ORIGINS must list this app's
//                        origin, or the browser blocks every call.
//
// Port 5176 keeps it clear of the sibling knowledge-ingest-ui (:5174).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authTarget = env.AUTH_PROXY_TARGET || "http://localhost:8100";

  return {
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
          target: authTarget,
          changeOrigin: true,
          // Verify TLS when the target is https — it is a real deployment,
          // not a self-signed dev box.
          secure: true,
        },
      },
    },
  };
});
