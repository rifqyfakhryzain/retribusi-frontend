import api from "./api";

/**
 * Service Modul Kios & Kriptografi QR Code
 * Menyediakan pemanggilan API endpoint /api/qrcode
 */
export const kiosService = {
  /**
   * Mengambil seluruh daftar kios beserta gambar QR Code siap cetak
   * @returns {Promise<Array>} Daftar kios dengan qr_image_url
   */
  async getAllKios() {
    const response = await api.get("/qrcode/kios");
    return response.data;
  },

  /**
   * Mengambil detail kios berdasarkan ID
   * @param {number|string} id - ID kios
   * @returns {Promise<Object>} Data kios & gambar QR
   */
  async getKiosById(id) {
    const response = await api.get(`/qrcode/kios/${id}`);
    return response.data;
  },

  /**
   * Menerbitkan kios baru dengan tanda tangan digital HMAC (Khusus Admin)
   * @param {Object} kiosData - { kode_kios, nama_pemilik, jenis_dagangan, lantai, tarif_retribusi }
   * @returns {Promise<Object>} Kios baru beserta token dan gambar QR
   */
  async generateKios(kiosData) {
    const response = await api.post("/qrcode/generate", kiosData);
    return response.data;
  },

  /**
   * Memverifikasi keaslian token QR Code saat dipindai kamera (Petugas / Admin)
   * @param {string} qrToken - Token Base64 dari QR Code
   * @returns {Promise<Object>} Hasil verifikasi kios asli
   */
  async verifyQr(qrToken) {
    const response = await api.post("/qrcode/verify", { qr_token: qrToken });
    return response.data;
  },
};

export default kiosService;
