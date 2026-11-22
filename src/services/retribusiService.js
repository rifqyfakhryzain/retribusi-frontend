import api from "./api";

/**
 * Service Modul Retribusi, Geofencing & Setoran (Fase 5 & 6)
 */
export const retribusiService = {
  /**
   * Menyetorkan pembayaran retribusi lapak kios ke database Express & Neon DB
   * @param {Object} data - { qr_token, latitude, longitude, accuracy }
   * @returns {Promise<Object>} Data transaksi sah
   */
  async bayarRetribusi({ qr_token, latitude, longitude, accuracy }) {
    const response = await api.post("/retribusi/bayar", {
      qr_token,
      latitude,
      longitude,
      accuracy,
    });
    return response.data;
  },

  /**
   * Mengambil riwayat setoran petugas yang sedang login
   * @returns {Promise<Object>}
   */
  async getRiwayatPetugas() {
    const response = await api.get("/retribusi/riwayat");
    return response.data;
  },

  /**
   * Mengambil seluruh log transaksi untuk Dasbor Monitoring Real-Time (Admin UPTD)
   * @param {Object} [params] - { tanggal, limit }
   * @returns {Promise<Object>}
   */
  async getAllTransactions(params = {}) {
    const response = await api.get("/retribusi/semua", { params });
    return response.data;
  },

  /**
   * Mengambil statistik ringkasan harian penagihan
   * @param {string} [tanggal] - Format YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  async getStatistikHariIni(tanggal) {
    const response = await api.get("/retribusi/statistik", {
      params: tanggal ? { tanggal } : {},
    });
    return response.data;
  },
};

export default retribusiService;
