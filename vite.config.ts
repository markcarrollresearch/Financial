import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/recharts|d3-|victory|react-smooth|decimal/.test(id))
              return "charts";
            if (/react-dom|react\/|scheduler/.test(id)) return "react";
          }
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
