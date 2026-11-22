import { io } from "socket.io-client";

/**
 * Socket.io Client Instance untuk Sinkronisasi Real-Time Dasbor UPTD
 * Menggunakan mode WebSocket murni dengan fallback polling dan reconnect otomatis tanpa henti.
 */
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  if (typeof apiUrl === "string" && apiUrl.startsWith("http")) {
    return apiUrl.replace(/\/api\/?$/, "");
  }
  // Jika URL relatif (/api), gunakan origin browser saat ini agar melalui proxy Vite (/socket.io)
  return typeof window !== "undefined" ? window.location.origin : undefined;
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity, // Terus mencoba menyambung kembali jika koneksi terputus
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ["websocket", "polling"], // Mengutamakan WebSocket langsung agar terhindar dari handshake reset
});

export default socket;
