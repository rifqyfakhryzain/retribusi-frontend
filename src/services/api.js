import axios from "axios";

/**
 * Konfigurasi Axios Client Instance
 * Menghubungkan Frontend ke Backend Express di Port 3000
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor Request: Otomatis menyematkan Bearer Token jika tersimpan di localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor Response: Memudahkan penanganan error dari server & auto logout jika 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tangani jika server backend mati / jaringan bermasalah
    if (!error.response) {
      return Promise.reject(
        new Error("Gagal terhubung ke server backend (Pastikan server Express port 3000 aktif)")
      );
    }

    // Tangani jika token kedaluwarsa / tidak valid (kecuali saat submit di form login)
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Jika pengguna sedang tidak berada di halaman login, arahkan ke login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
