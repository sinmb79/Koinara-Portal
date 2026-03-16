import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { global: "globalThis" },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("ethers")) return "web3-vendor"
          if (id.includes("react-router") || id.includes("react-hot-toast")) return "ui-vendor"
          if (id.includes("react")) return "react-vendor"
        },
      },
    },
  },
})
