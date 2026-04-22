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
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router") || /node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return "react-vendor";
          }
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@tanstack/react-query")) return "query-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          // Todos os pacotes @radix-ui em um único chunk — separá-los quebra
          // utilitários internos (ex: react-use-is-hydrated) que dependem do
          // React estar no mesmo escopo de módulo.
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("@fontsource")) return "fonts";
        },
      },
    },
  },
}));
