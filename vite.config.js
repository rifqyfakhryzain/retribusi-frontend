import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true, // Membuka akses jaringan lokal untuk pengujian di HP
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            // Mencegah log noise ECONNRESET saat browser me-refresh halaman
            if (err.code === "ECONNRESET" || err.code === "EPIPE") return;
            console.warn("[vite] socket proxy notice:", err.message);
          });
        },
      },
    },
  },
});
