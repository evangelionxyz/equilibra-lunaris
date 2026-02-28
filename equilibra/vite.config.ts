import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Load .env files from the repo root instead of the frontend/ folder
  envDir: "../",
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ["monasterial-luella-rigid.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        cookieDomainRewrite: "",
        followRedirects: false,
      },
    },
  },
});
