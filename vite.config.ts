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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Isola libs pesadas em chunks dedicados — só baixam quando a feature é usada.
        // React + Radix continuam no chunk principal (evita ciclo de dep que quebrou produção).
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("d3-")) return "charts-vendor";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("dompurify")) return "pdf-vendor";
          if (id.includes("leaflet") || id.includes("@react-leaflet")) return "maps-vendor";
          if (id.includes("@hello-pangea/dnd")) return "dnd-vendor";
          if (id.includes("react-markdown") || id.includes("remark") || id.includes("micromark") || id.includes("mdast") || id.includes("unist") || id.includes("hast")) return "markdown-vendor";
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "date-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("@fontsource")) return "fonts";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("embla-carousel")) return "carousel-vendor";
          if (id.includes("qrcode")) return "qr-vendor";
        },
      },
    },
  },
}));
