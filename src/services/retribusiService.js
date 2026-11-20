import api from "./api";

/**
 * Service Modul Retribusi, Geofencing & Setoran (Fase 5)
 */
export const retribusiService = {
  /**
   * Menyetorkan pembayaran retribusi lapak kios ke database Express & Neon DB
   * Memvalidasi digital signature, akurasi sinyal satelit, dan komputasi spasial Ray-Casting
   * 
   * @param {Object} data
   * @param {string} data.qr_token - Token Base64 HMAC lapak kios
   * @param {number} data.latitude - Titik latitude satelit saat scan
   * @param {number} data.longitude - Titik longitude satelit saat scan
   * @param {number} data.accuracy - Radius akurasi satelit (± meter)
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
   * Mengambil statistik ringkasan harian penagihan
   * @returns {Promise<Object>}
   */
  async getStatistikHariIni() {
    const response = await api.get("/retribusi/statistik");
    return response.data;
  },
};

export default retribusiService;
