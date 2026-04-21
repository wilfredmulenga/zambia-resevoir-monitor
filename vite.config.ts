/**
 * vite.config.ts
 *
 * Vite config for the React frontend:
 * - Root: client/ directory
 * - Builds to public/ (served by Express in production)
 * - Dev server proxies /api to Express on port 3000
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "client",
  build: {
    outDir: "../public",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
