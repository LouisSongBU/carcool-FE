import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 默认即可
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        // 不要写 rewrite，这样 /api 会原样传到后端
      },
    },
  },
});
