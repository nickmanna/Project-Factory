import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Built output is loaded from disk by a WebView inside the macOS app
// (file://.../dashboard/index.html), not served from a domain root, so
// asset paths must be relative.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
  },
});
