import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/Card";
import kiosService from "../../services/kiosService";
import {
  Building2,
  DollarSign,
  Users,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Activity,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Plus,
  Search,
  Printer,
  X,
  Store,
} from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "kios"

  // State Data Kios (Fase 3)
  const [kiosList, setKiosList] = useState([]);
  const [isLoadingKios, setIsLoadingKios] = useState(false);
  const [kiosError, setKiosError] = useState("");
  const [searchKios, setSearchKios] = useState("");
  const [filterLantai, setFilterLantai] = useState("ALL");

  // State Modal Preview QR
  const [selectedKios, setSelectedKios] = useState(null);

  // State Modal Tambah Kios
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKiosForm, setNewKiosForm] = useState({
    kode_kios: "",
    nama_pemilik: "",
    jenis_dagangan: "",
    lantai: "LANTAI_1",
    tarif_retribusi: 5000,
  });
  const [isSubmittingKios, setIsSubmittingKios] = useState(false);
  const [addKiosError, setAddKiosError] = useState("");
  const [addKiosSuccess, setAddKiosSuccess] = useState("");

  const fetchKios = async () => {
    setIsLoadingKios(true);
    setKiosError("");
    try {
      const response = await kiosService.getAllKios();
      setKiosList(response.data || []);
    } catch (err) {
      setKiosError(err.response?.data?.message || err.message || "Gagal memuat data kios");
    } finally {
      setIsLoadingKios(false);
    }
  };

  useEffect(() => {
    fetchKios();
  }, []);

  const handleCreateKios = async (e) => {
    e.preventDefault();
    setAddKiosError("");
    setAddKiosSuccess("");

    if (!newKiosForm.kode_kios.trim()) {
      setAddKiosError("Kode kios wajib diisi (Contoh: K-LT1-03)");
      return;
    }
    if (!newKiosForm.nama_pemilik.trim()) {
      setAddKiosError("Nama pemilik lapak wajib diisi");
      return;
    }
    if (!newKiosForm.jenis_dagangan.trim()) {
      setAddKiosError("Jenis dagangan wajib diisi");
      return;
    }
    if (!newKiosForm.tarif_retribusi || Number(newKiosForm.tarif_retribusi) <= 0) {
      setAddKiosError("Tarif retribusi harus berupa angka positif (lebih dari 0)");
      return;
    }

    setIsSubmittingKios(true);

    try {
      const res = await kiosService.generateKios(newKiosForm);
      setAddKiosSuccess(`Kios ${res.data?.kode_kios} berhasil diterbitkan dengan QR Token aman!`);
      // Reset form & reload
      setNewKiosForm({
        kode_kios: "",
        nama_pemilik: "",
        jenis_dagangan: "",
        lantai: "LANTAI_1",
        tarif_retribusi: 5000,
      });
      fetchKios();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddKiosSuccess("");
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Gagal menerbitkan QR kios. Pastikan server backend aktif.";
      setAddKiosError(errorMsg);
    } finally {
      setIsSubmittingKios(false);
    }
  };

  const filteredKios = kiosList.filter((k) => {
    const matchSearch =
      k.kode_kios.toLowerCase().includes(searchKios.toLowerCase()) ||
      k.nama_pemilik.toLowerCase().includes(searchKios.toLowerCase()) ||
      k.jenis_dagangan.toLowerCase().includes(searchKios.toLowerCase());
    const matchLantai = filterLantai === "ALL" || k.lantai === filterLantai;
    return matchSearch && matchLantai;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar Admin */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-pasar-600 text-white flex items-center justify-center shadow-md shadow-pasar-600/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-gray-900">
                UPTD Pasar Cicalengka
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                ADMINISTRATOR
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Sistem Pemantauan e-Retribusi & Deteksi Fraud (Anti-Pungli)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.nama}</p>
            <p className="text-xs text-gray-500 font-mono">@{user?.username}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={logout}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Banner Selamat Datang */}
        <div className="bg-gradient-to-r from-pasar-600 to-pasar-700 rounded-2xl text-white p-6 shadow-lg shadow-pasar-600/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white mb-2">
              <Activity className="h-3.5 w-3.5 text-pasar-200" />
              Monitoring Real-Time Aktif
            </span>
            <h2 className="text-2xl font-bold">
              Selamat Datang di Dasbor Kontrol, {user?.nama}!
            </h2>
            <p className="text-pasar-100 text-sm mt-1 max-w-xl">
              Pantau seluruh pergerakan setoran retribusi petugas di lapangan dan kelola stiker QR kriptografi pedagang.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              className="bg-white/10 hover:bg-white/20 text-white border-0"
              onClick={() => {
                fetchKios();
              }}
            >
              Segarkan Data
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "overview"
                ? "border-pasar-600 text-pasar-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Activity className="h-4 w-4" />
            Monitoring Real-Time
          </button>
          <button
            onClick={() => setActiveTab("kios")}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "kios"
                ? "border-pasar-600 text-pasar-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <QrCode className="h-4 w-4" />
            Katalog Kios & Cetak QR Stiker (Fase 3)
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
              {kiosList.length}
            </span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & LIVE MONITORING */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Ringkasan Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Kartu 1: Total Retribusi */}
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Setoran Hari Ini
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      Rp 1.450.000
                    </p>
                    <span className="text-xs text-pasar-600 font-medium inline-flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> +14.2% dari target
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-pasar-50 text-pasar-600 flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Kartu 2: Kios Terdaftar & Aktif */}
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kios Terdaftar (DB)
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {kiosList.length} Lapak
                    </p>
                    <span className="text-xs text-emerald-600 mt-1 block">
                      Semua ber-QR HMAC resmi
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Store className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Kartu 3: Deteksi Fraud */}
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deteksi Fraud (GPS / QR)
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      0 Pelanggaran
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Semua transaksi lolos HMAC
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Kartu 4: WebSocket Real-time */}
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Socket.io Server
                    </p>
                    <p className="text-lg font-bold text-amber-600 mt-1">
                      Siap di Fase 6
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Sinkronisasi instan &lt; 2 detik
                    </span>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabel Penagihan Terkini */}
            <Card>
              <CardHeader>
                <CardTitle>Log Transaksi Terakhir (Live Monitoring)</CardTitle>
                <CardDescription>
                  Riwayat transaksi penagihan petugas lapangan di Pasar Cicalengka
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-700">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100 font-semibold">
                      <tr>
                        <th className="px-6 py-3.5">ID Kios</th>
                        <th className="px-6 py-3.5">Nama Pedagang</th>
                        <th className="px-6 py-3.5">Zona / Lantai</th>
                        <th className="px-6 py-3.5">Nominal</th>
                        <th className="px-6 py-3.5">Status Lokasi (Geofence)</th>
                        <th className="px-6 py-3.5">Status Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50/70">
                        <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                          K-LT1-01
                        </td>
                        <td className="px-6 py-4">Bapak Suhendar (Sayur Mayur)</td>
                        <td className="px-6 py-4">Lantai 1 - Blok Sayur</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          Rp 5.000
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Valid (Radius 2m)
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pasar-100 text-pasar-800">
                            LUNAS
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50/70">
                        <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                          K-BSM-01
                        </td>
                        <td className="px-6 py-4">Ibu Hj. Siti (Daging Ayam)</td>
                        <td className="px-6 py-4">Basement - Blok Basah</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          Rp 10.000
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CheckCircle2 className="h-3 w-3" /> Bypass Basement
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pasar-100 text-pasar-800">
                            LUNAS
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: KATALOG KIOS & CETAK QR STIKER */}
        {activeTab === "kios" && (
          <div className="space-y-6">
            {kiosError && <Alert type="error">{kiosError}</Alert>}

            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari kode kios, nama, jenis..."
                    value={searchKios}
                    onChange={(e) => setSearchKios(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pasar-500 focus:border-pasar-500"
                  />
                </div>
                <select
                  value={filterLantai}
                  onChange={(e) => setFilterLantai(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pasar-500 bg-white"
                >
                  <option value="ALL">Semua Lantai</option>
                  <option value="BASEMENT">Basement (Blindspot)</option>
                  <option value="LANTAI_1">Lantai 1</option>
                  <option value="LANTAI_2">Lantai 2</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsAddModalOpen(true)}
              >
                Terbitkan Kios Baru
              </Button>
            </div>

            {/* Kios Cards Grid */}
            {isLoadingKios ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-pasar-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Memuat data kios dari database cloud...</p>
              </div>
            ) : filteredKios.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Store className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">Tidak ada kios yang cocok</p>
                <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter lantai</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKios.map((kios) => (
                  <Card key={kios.id} className="hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-base text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                            {kios.kode_kios}
                          </span>
                          {kios.lantai === "BASEMENT" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              Basement (Blindspot)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                              {kios.lantai}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 leading-snug">
                          {kios.nama_pemilik}
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {kios.jenis_dagangan}
                        </p>
                        <p className="text-sm font-semibold text-pasar-700 mt-2">
                          Tarif Retribusi: Rp {Number(kios.tarif_retribusi).toLocaleString("id-ID")} / hari
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          HMAC Verified
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={QrCode}
                          onClick={() => setSelectedKios(kios)}
                          className="border-pasar-300 text-pasar-700 hover:bg-pasar-50"
                        >
                          Lihat QR Stiker
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: PREVIEW & CETAK QR CODE STIKER */}
      {selectedKios && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedKios(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Token HMAC-SHA256 Resmi
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Stiker Lapak Pedagang
              </h3>
              <p className="text-xs text-gray-500">UPTD Pasar Cicalengka</p>

              {/* Matriks Gambar QR Code */}
              <div className="my-4 p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-inner inline-block">
                {selectedKios.qr_image_url ? (
                  <img
                    src={selectedKios.qr_image_url}
                    alt={`QR Code ${selectedKios.kode_kios}`}
                    className="w-56 h-56 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-gray-100 text-gray-400">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>

              {/* Info Kios */}
              <div className="bg-gray-50 rounded-xl p-3 text-left space-y-1 text-xs border border-gray-100 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kode Kios:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedKios.kode_kios}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama Pedagang:</span>
                  <span className="font-semibold text-gray-900">{selectedKios.nama_pemilik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dagangan:</span>
                  <span className="text-gray-900">{selectedKios.jenis_dagangan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Zona / Lantai:</span>
                  <span className="text-gray-900 font-semibold">{selectedKios.lantai}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tarif Retribusi:</span>
                  <span className="text-pasar-700 font-bold">
                    Rp {Number(selectedKios.tarif_retribusi).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Tombol Cetak */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setSelectedKios(null)}
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={Printer}
                  className="flex-1"
                  onClick={() => window.print()}
                >
                  Cetak Stiker
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TERBITKAN KIOS BARU (ADMIN ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Terbitkan QR Code Kios Baru</h3>
              <p className="text-xs text-gray-500">
                Server backend akan otomatis menandatangani data kios dengan signature HMAC-SHA256
              </p>
            </div>

            {addKiosError && (
              <Alert
                variant="error"
                message={addKiosError}
                onClose={() => setAddKiosError("")}
                className="mb-3"
              />
            )}
            {addKiosSuccess && (
              <Alert
                variant="success"
                message={addKiosSuccess}
                className="mb-3"
              />
            )}

            <form onSubmit={handleCreateKios} className="space-y-3.5">
              <Input
                label="Kode Kios Unik"
                placeholder="Contoh: K-LT1-15, K-BSM-05"
                required
                value={newKiosForm.kode_kios}
                onChange={(e) =>
                  setNewKiosForm({ ...newKiosForm, kode_kios: e.target.value })
                }
              />

              <Input
                label="Nama Pedagang / Pemilik"
                placeholder="Nama lengkap pedagang"
                required
                value={newKiosForm.nama_pemilik}
                onChange={(e) =>
                  setNewKiosForm({ ...newKiosForm, nama_pemilik: e.target.value })
                }
              />

              <Input
                label="Jenis Dagangan"
                placeholder="Contoh: Kelontong, Sayuran, Daging"
                required
                value={newKiosForm.jenis_dagangan}
                onChange={(e) =>
                  setNewKiosForm({ ...newKiosForm, jenis_dagangan: e.target.value })
                }
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Zona / Lantai Kios <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKiosForm.lantai}
                  onChange={(e) =>
                    setNewKiosForm({ ...newKiosForm, lantai: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pasar-500 bg-white"
                >
                  <option value="LANTAI_1">Lantai 1</option>
                  <option value="LANTAI_2">Lantai 2</option>
                  <option value="BASEMENT">Basement (Area GPS Blindspot)</option>
                </select>
                {newKiosForm.lantai === "BASEMENT" && (
                  <p className="text-[11px] text-blue-600 mt-1">
                    ℹ️ Area Basement akan mengaktifkan bypass GPS pada validasi penagihan di Fase 5.
                  </p>
                )}
              </div>

              <Input
                label="Tarif Retribusi Harian (Rp)"
                type="number"
                placeholder="5000"
                required
                value={newKiosForm.tarif_retribusi}
                onChange={(e) =>
                  setNewKiosForm({ ...newKiosForm, tarif_retribusi: Number(e.target.value) })
                }
              />

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmittingKios}
                  className="flex-1"
                >
                  Terbitkan & Buat QR
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
