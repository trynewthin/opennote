import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) return "vendor-react"
          if (id.includes("/react-router")) return "vendor-router"
          if (id.includes("/@base-ui/") || id.includes("/lucide-react/") || id.includes("/class-variance-authority/") || id.includes("/clsx/") || id.includes("/tailwind-merge/")) return "vendor-ui"
          if (id.includes("/@tauri-apps/")) return "vendor-tauri"
        },
      },
    },
  },
})
