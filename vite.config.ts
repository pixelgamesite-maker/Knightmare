import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Prioritize the environment variable provided by Railway, 
// but default to 8080 to match your networking configuration.
const port = Number(process.env.PORT) || 8080;

export default defineConfig({
  base: "/", 
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@assets": path.resolve(import.meta.dirname, "./attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0", // Required for Railway to route traffic
  },
  preview: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    // This allows the specific Railway host shown in d51deb3d-af84-4b46-ae2f-103102a42390
    allowedHosts: true, 
  },
});
