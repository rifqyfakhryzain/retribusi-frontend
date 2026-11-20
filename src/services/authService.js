import api from "./api";

/**
 * Modul Layanan Autentikasi
 * Menghubungkan ke Endpoint Backend Fase 1 (/api/auth/login)
 */
export const authService = {
  /**
   * Melakukan request login petugas/admin
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ token: string, user: { id: number, nama: string, username: string, role: string } }>}
   */
  async login(username, password) {
    const response = await api.post("/auth/login", { username, password });
    return response.data; // { status: "success", message: "...", data: { token, user } }
  },

  // Simpan data sesi ke localStorage
  saveSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  // Hapus data sesi dari localStorage
  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Ambil token dari localStorage
  getToken() {
    return localStorage.getItem("token");
  },

  // Ambil data user dari localStorage
  getUser() {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};

export default authService;
