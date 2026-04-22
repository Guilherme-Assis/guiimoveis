import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Substitui framer-motion por um shim leve (~1KB) que apenas remove props de animação.
      "framer-motion": path.resolve(__dirname, "./src/lib/motion-shim.tsx"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Stability first: let Vite/Rollup decide chunk boundaries for React/Radix.
        // The previous manual chunking introduced a circular dependency between
        // react-vendor and radix-vendor in production, which broke publish runtime.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("@fontsource")) return "fonts";
        },
      },
    },
  },
}));
