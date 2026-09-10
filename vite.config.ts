import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Admin console for auth-service — reached THROUGH the API gateway, never
// directly. The gateway is the only thing on the platform that talks to
// auth-service, in development as well as when deployed (vercel.json rewrites
// /auth/* to the gateway too), and that symmetry is the point: a dev server
// that bypassed it would exercise a path production does not have.
//
// Two ways to choose the backend, and they are not interchangeable:
//
//   GATEWAY_PROXY_TARGET where this dev server forwards /auth/* (default: a
//                        local API gateway on :8000, which routes /auth to
//                        auth-service). The browser only ever talks to this
//                        dev server, so the hop to the target is server-side
//                        and CORS does not apply. Point it at a deployed
//                        gateway to develop against real accounts.
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
  // AUTH_PROXY_TARGET is still honoured so an existing .env keeps working,
  // but it now names a GATEWAY rather than auth-service itself.
  const authTarget =
    env.GATEWAY_PROXY_TARGET || env.AUTH_PROXY_TARGET || "http://localhost:8000";

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
