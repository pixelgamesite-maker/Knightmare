import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Railway provides the PORT, but Vite usually handles this automatically 
// or via the --port flag. We'll set a sensible default for local dev.
const port = Number(process.env.PORT) || 3000;

export default defineConfig({
  // Use "/" for standard deployments unless you have a specific sub-path
  base: "/", 
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Adjusted assets path to be relative to the project root
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  build: {
    // Standardizing output to 'dist' for easier Railway deployment
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0", // Essential for Railway to expose the service
  },
  preview: {
    port,
    host: "0.0.0.0",
  },
});
