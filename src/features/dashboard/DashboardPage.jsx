import { useState, useEffect, useCallback } from "react";
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
import retribusiService from "../../services/retribusiService";
import socket from "../../services/socket";
import DashboardLiveMap from "../../components/map/DashboardLiveMap";
import {
  DollarSign,
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
  Radio,
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  History,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "kios"

  // Helper Format Tanggal Lokal (WIB)
  const getTodayString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getYesterdayString = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTanggalSingkat = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // State Filter Periode Tanggal Penarikan (Default: Hari Ini)
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const isToday = selectedDate === getTodayString();
  const isYesterday = selectedDate === getYesterdayString();

  // Handler Navigasi Hari Sebelumnya & Berikutnya
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() - 1);
    const newY = prev.getFullYear();
    const newM = String(prev.getMonth() + 1).padStart(2, "0");
    const newD = String(prev.getDate()).padStart(2, "0");
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 1);
    const todayStr = getTodayString();
    const newY = next.getFullYear();
    const newM = String(next.getMonth() + 1).padStart(2, "0");
    const newD = String(next.getDate()).padStart(2, "0");
    const nextStr = `${newY}-${newM}-${newD}`;
    if (nextStr <= todayStr) {
      setSelectedDate(nextStr);
    }
  };

  // State Data Kios (Fase 3)
  const [kiosList, setKiosList] = useState([]);
  const [isLoadingKios, setIsLoadingKios] = useState(false);
  const [kiosError, setKiosError] = useState("");
  const [searchKios, setSearchKios] = useState("");
  const [filterLantai, setFilterLantai] = useState("ALL");

  // State Monitoring Real-Time & WebSockets (Fase 6)
  const [stats, setStats] = useState({
    total_transaksi_lunas: 0,
    total_nominal_terkumpul: 0,
    total_fraud_ditolak: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState(false);
  const [monitoringError, setMonitoringError] = useState("");
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [realtimeNotification, setRealtimeNotification] = useState(null);

  // State Feedback Sinkronisasi Manual
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");

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

  const fetchKios = useCallback(async () => {
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
  }, []);

  const fetchMonitoringData = useCallback(async (isSilent = false, targetDate = selectedDate) => {
    if (!isSilent) setIsLoadingMonitoring(true);
    setMonitoringError("");
    try {
      const [statsRes, transRes] = await Promise.all([
        retribusiService.getStatistikHariIni(targetDate),
        retribusiService.getAllTransactions({ tanggal: targetDate }),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (transRes?.data) setTransactions(transRes.data || []);
    } catch (err) {
      if (!isSilent) {
        setMonitoringError(
          err.response?.data?.message || err.message || "Gagal memuat data monitoring real-time"
        );
      }
    } finally {
      if (!isSilent) setIsLoadingMonitoring(false);
    }
  }, [selectedDate]);

  // Handler Sinkronisasi Lengkap (Tombol Sinkronisasi Ulang)
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback("");
    try {
      if (!socket.connected) {
        socket.connect();
      }
      await Promise.all([fetchKios(), fetchMonitoringData(false, selectedDate)]);
      setSyncFeedback(`Tersinkronisasi ${new Date().toLocaleTimeString("id-ID")}`);
      setTimeout(() => setSyncFeedback(""), 3500);
    } catch (err) {
      console.warn("Sinkronisasi manual menemui kendala:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Muat data saat selectedDate berubah
  useEffect(() => {
    fetchMonitoringData(false, selectedDate);
  }, [selectedDate, fetchMonitoringData]);

  // Lifecycle WebSocket & Data Kios
  useEffect(() => {
    fetchKios();

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsSocketConnected(true);
    }

    const handleConnect = () => {
      console.log("[Socket.io] Dashboard terhubung:", socket.id);
      setIsSocketConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.warn("[Socket.io] Dashboard terputus:", reason);
      setIsSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.warn("[Socket.io] Kesalahan koneksi:", error.message);
      setIsSocketConnected(false);
    };

    // 🚀 Listener Utama: Tangkap Transaksi Baru dari Petugas Secara Real-Time
    const handleTransaksiBaru = (payload) => {
      const newTrx = payload.data;
      if (!newTrx) return;

      console.log("[Socket.io] Real-time transaksi baru diterima:", newTrx.kode_kios);

      const todayStr = getTodayString();
      const isCurrentlyToday = selectedDate === todayStr;

      // Jika admin sedang melihat hari ini, perbarui log tabel & KPI seketika
      if (isCurrentlyToday) {
        setTransactions((prev) => {
          const alreadyExists = prev.some((t) => t.id === newTrx.id);
          if (alreadyExists) return prev;
          return [newTrx, ...prev];
        });

        setStats((prev) => ({
          ...prev,
          total_transaksi_lunas: (prev.total_transaksi_lunas || 0) + 1,
          total_nominal_terkumpul:
            (prev.total_nominal_terkumpul || 0) + Number(newTrx.nominal || 0),
        }));

        fetchMonitoringData(true, todayStr);
      }

      // Tampilkan banner notifikasi kilat di dasbor
      setRealtimeNotification({
        type: "SUCCESS",
        title: "SETORAN LAPAK DITERIMA",
        message: `Kios ${newTrx.kode_kios} (${newTrx.nama_pemilik}) telah melunasi Rp ${Number(
          newTrx.nominal
        ).toLocaleString("id-ID")} [${newTrx.is_basement_bypass ? "Basement Bypass" : "Geofence Sah"}]`,
        time: new Date().toLocaleTimeString("id-ID"),
        isTodayView: isCurrentlyToday,
      });
    };

    const handleFraudTerdeteksi = (payload) => {
      const todayStr = getTodayString();
      if (selectedDate === todayStr) {
        setStats((prev) => ({
          ...prev,
          total_fraud_ditolak: (prev.total_fraud_ditolak || 0) + 1,
        }));
        fetchMonitoringData(true, todayStr);
      }

      setRealtimeNotification({
        type: "FRAUD",
        title: "PERINGATAN AUDIT SPASIAL",
        message: payload.message || "Upaya penagihan di luar radius pasar diblokir!",
        time: new Date().toLocaleTimeString("id-ID"),
        isTodayView: selectedDate === todayStr,
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("transaksi_baru", handleTransaksiBaru);
    socket.on("fraud_terdeteksi", handleFraudTerdeteksi);

    // 🛡️ Heartbeat Polling Fallback (Hanya refresh otomatis jika di mode Hari Ini)
    const heartbeatInterval = setInterval(() => {
      if (selectedDate === getTodayString()) {
        fetchMonitoringData(true, selectedDate);
      }
    }, 12000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("transaksi_baru", handleTransaksiBaru);
      socket.off("fraud_terdeteksi", handleFraudTerdeteksi);
    };
  }, [fetchKios, fetchMonitoringData, selectedDate]);

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
      setAddKiosSuccess(`Kios ${res.data?.kode_kios} berhasil diterbitkan dengan QR Token HMAC!`);
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

  const totalKiosCount = kiosList.length || 1;
  const uniquePaidKios = new Set(
    transactions.filter((t) => t.status === "LUNAS").map((t) => t.kode_kios)
  ).size;
  const complianceRate = Math.min(100, Math.round((uniquePaidKios / totalKiosCount) * 100));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Institutional Header Bar - Nuansa Hijau Emerald Khas UPTD Pasar Cicalengka */}
      <header className="bg-emerald-800 border-b border-emerald-700 text-white sticky top-0 z-20 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded bg-emerald-900 text-emerald-100 flex items-center justify-center font-bold font-mono text-base border border-emerald-600 shadow-xs">
            PT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-200 uppercase">
                PT NIAGA PERKASA
              </span>
            </div>
            <h1 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
              PASAR CICALENGKA — SISTEM MONITORING RETRIBUSI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3.5 text-xs font-mono">
          <div className="text-right hidden sm:block text-[11px] border-l border-emerald-700 pl-3 text-emerald-100">
            <span className="text-white font-semibold block">{user?.nama}</span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={LogOut}
            onClick={logout}
            className="bg-emerald-900 hover:bg-emerald-700 text-emerald-100 border-emerald-700 text-xs py-1 px-2.5 transition-colors"
          >
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-200 pb-2.5 gap-2">
          <div className="flex space-x-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-emerald-800 text-white shadow-xs border border-emerald-900 font-bold"
                  : "bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>KENDALI SPASIAL &amp; REAL-TIME</span>
            </button>
            <button
              onClick={() => setActiveTab("kios")}
              className={`px-3.5 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "kios"
                  ? "bg-emerald-800 text-white shadow-xs border border-emerald-900 font-bold"
                  : "bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>REGISTRASI KIOS &amp; STIKER HMAC</span>
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-900 font-mono font-bold">
                {kiosList.length}
              </span>
            </button>
          </div>

          {/* Bilah Tombol Sinkronisasi Ulang */}
          <div className="flex items-center gap-2">
            {syncFeedback && (
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 animate-in fade-in duration-150">
                ✓ {syncFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing || isLoadingMonitoring}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded hover:bg-emerald-50 active:bg-emerald-100 shadow-2xs cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Sinkronisasi data lapak, buku kas, dan koneksi real-time"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-emerald-700 ${
                  isSyncing || isLoadingMonitoring ? "animate-spin" : ""
                }`}
              />
              <span>{isSyncing ? "Menyinkronkan..." : "Sinkronisasi Ulang"}</span>
            </button>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {realtimeNotification && (
          <div
            className={`p-3 rounded border text-xs flex items-center justify-between shadow-xs ${
              realtimeNotification.type === "SUCCESS"
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-red-50 border-red-300 text-red-950"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-white border border-current">
                {realtimeNotification.title}
              </span>
              <span className="font-medium">{realtimeNotification.message}</span>
              <span className="text-[10px] font-mono text-slate-500">
                ({realtimeNotification.time})
              </span>
              {!realtimeNotification.isTodayView && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(getTodayString());
                    setRealtimeNotification(null);
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold text-[10px] hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Beralih ke Hari Ini &rarr;
                </button>
              )}
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ml-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW & COMMAND CENTER */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {monitoringError && (
              <Alert
                variant="error"
                message={monitoringError}
                onClose={() => setMonitoringError("")}
              />
            )}

            {/* 🗓️ Institutional Date Filter Toolbar - Kontrol Penarikan Harian & Riwayat */}
            <div className="bg-white rounded-lg border border-emerald-200 p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Presets & Navigation */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-emerald-50/70 p-1 rounded-lg border border-emerald-200">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(getTodayString())}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isToday
                        ? "bg-emerald-800 text-white shadow-xs font-bold"
                        : "text-emerald-900 hover:bg-emerald-100"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isToday ? "bg-emerald-300 animate-pulse" : "bg-emerald-600"
                      }`}
                    />
                    <span>Hari Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDate(getYesterdayString())}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isYesterday
                        ? "bg-emerald-800 text-white shadow-xs font-bold"
                        : "text-emerald-900 hover:bg-emerald-100"
                    }`}
                  >
                    <History className="h-3 w-3" />
                    <span>Kemarin</span>
                  </button>
                </div>

                {/* Day Stepper Arrows */}
                <div className="flex items-center border border-emerald-200 rounded overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={handlePrevDay}
                    title="Mundur 1 Hari"
                    className="p-1.5 text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 transition-colors border-r border-emerald-200 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextDay}
                    disabled={isToday}
                    title="Maju 1 Hari"
                    className="p-1.5 text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Custom Date Input */}
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="dashboard-date-picker"
                    className="text-xs text-slate-600 font-medium flex items-center gap-1"
                  >
                    <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                    <span className="hidden sm:inline">Pilih Tanggal:</span>
                  </label>
                  <input
                    id="dashboard-date-picker"
                    type="date"
                    value={selectedDate}
                    max={getTodayString()}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(e.target.value);
                    }}
                    className="px-2.5 py-1 text-xs border border-emerald-300 rounded font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white cursor-pointer shadow-2xs"
                  />
                </div>
              </div>

              {/* Status Banner Info */}
              <div className="flex items-center justify-between md:justify-end gap-2 text-xs">
                <div className="text-right">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 md:justify-end">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{formatTanggalIndo(selectedDate)}</span>
                  </div>
                  <div className="text-[10px] font-mono">
                    {isToday ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 md:justify-end">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        Mode Penarikan Hari Ini (Live Monitoring)
                      </span>
                    ) : (
                      <span className="text-amber-800 font-semibold flex items-center gap-1 md:justify-end">
                        Mode Arsip Data Riwayat
                        <button
                          type="button"
                          onClick={() => setSelectedDate(getTodayString())}
                          className="ml-1 text-emerald-700 underline hover:text-emerald-900 cursor-pointer font-bold"
                        >
                          (Beralih ke Hari Ini)
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* High-Density KPI Executive Strip - Beraksen Hijau Zamrud & Mint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Metric 1: Total Penerimaan Retribusi */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 border-t-3 border-t-emerald-700 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase font-semibold">
                  <span>
                    {isToday
                      ? "Realisasi Setoran Hari Ini"
                      : `Realisasi Setoran (${formatTanggalSingkat(selectedDate)})`}
                  </span>
                  <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-950 mt-1 tabular-nums">
                  Rp {Number(stats.total_nominal_terkumpul || 0).toLocaleString("id-ID")}
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Total Transaksi Sah:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {stats.total_transaksi_lunas || 0} Bukti Setor
                  </span>
                </div>
              </div>

              {/* Metric 2: Kepatuhan Lapak */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 border-t-3 border-t-emerald-700 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase font-semibold">
                  <span>
                    {isToday
                      ? "Rasio Kepatuhan Lapak"
                      : `Kepatuhan (${formatTanggalSingkat(selectedDate)})`}
                  </span>
                  <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <Store className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums flex items-baseline gap-2">
                  <span className="text-emerald-900">{complianceRate}%</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({uniquePaidKios} dari {totalKiosCount} lapak)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${complianceRate}%` }}
                  />
                </div>
              </div>

              {/* Metric 3: Audit Anti-Fraud */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 border-t-3 border-t-emerald-700 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase font-semibold">
                  <span>
                    {isToday
                      ? "Audit Integritas (Anti-Pungli)"
                      : `Audit Spasial (${formatTanggalSingkat(selectedDate)})`}
                  </span>
                  <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl font-bold font-mono mt-1 tabular-nums flex items-center gap-1.5">
                  <span
                    className={
                      stats.total_fraud_ditolak > 0 ? "text-red-700" : "text-emerald-800"
                    }
                  >
                    {stats.total_fraud_ditolak || 0}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {stats.total_fraud_ditolak > 0 ? "Insiden Terdeteksi" : "Pelanggaran"}
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] font-mono">
                  {stats.total_fraud_ditolak > 0 ? (
                    <span className="text-red-700 font-bold">Terindikasi Luar Perimeter</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">100% Validasi Terpenuhi</span>
                  )}
                </div>
              </div>

              {/* Metric 4: Sinkronisasi WebSockets / Status Riwayat */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 border-t-3 border-t-emerald-700 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono uppercase font-semibold">
                  <span>{isToday ? "Protokol Real-Time" : "Status Pengawasan"}</span>
                  <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    {isToday ? (
                      <Radio className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isToday
                        ? isSocketConnected
                          ? "bg-emerald-500"
                          : "bg-red-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="text-sm uppercase tracking-wide text-emerald-950 font-bold">
                    {isToday
                      ? isSocketConnected
                        ? "SOCKET.IO AKTIF"
                        : "TERPUTUS"
                      : "MODE ARSIP RIWAYAT"}
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 font-mono">
                  {isToday
                    ? isSocketConnected
                      ? "Latensi siaran: < 20 milidetik"
                      : "Klik sinkronisasi untuk sambung ulang"
                    : `Meninjau data ${formatTanggalSingkat(selectedDate)}`}
                </div>
              </div>
            </div>

            {/* Split Command-Center: Peta Spasial (60%) + Feed Transaksi Real-Time (40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Peta Spasial Pasar Cicalengka (7 Kolom) */}
              <div className="lg:col-span-7 h-full">
                <DashboardLiveMap
                  transactions={transactions}
                  selectedDate={selectedDate}
                  isToday={isToday}
                  formattedDateText={formatTanggalIndo(selectedDate)}
                />
              </div>

              {/* Feed Aktivitas Penagihan Masuk (5 Kolom) */}
              <div className="lg:col-span-5 rounded-lg border border-emerald-200 bg-white shadow-xs overflow-hidden flex flex-col h-[415px]">
                <div className="px-4 py-2.5 bg-emerald-800 text-white border-b border-emerald-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold tracking-wide">
                    <Activity className="h-3.5 w-3.5 text-emerald-300" />
                    <span>
                      {isToday
                        ? "LOG PENARIKAN REAL-TIME"
                        : `LOG PENARIKAN (${formatTanggalSingkat(selectedDate)})`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-100 bg-emerald-900 px-2 py-0.5 rounded border border-emerald-600 font-bold">
                    {transactions.length} Entri Masuk
                  </span>
                </div>

                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                  {transactions.length === 0 ? (
                    <div className="p-8 text-center text-xs font-mono text-slate-400">
                      {isToday
                        ? "Menunggu penagihan dari petugas lapangan hari ini..."
                        : `Tidak ada catatan penagihan pada ${formatTanggalIndo(selectedDate)}.`}
                    </div>
                  ) : (
                    transactions.slice(0, 15).map((trx) => (
                      <div
                        key={trx.id}
                        className="p-3 hover:bg-emerald-50/40 transition-colors text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[11px]">
                              {trx.kode_kios}
                            </span>
                            <span className="font-medium text-slate-800">
                              {trx.nama_pemilik}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {trx.petugas || "Petugas"} • {trx.lantai}
                          </p>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span className="font-mono font-bold text-emerald-950 block text-xs">
                            Rp {Number(trx.nominal).toLocaleString("id-ID")}
                          </span>
                          <span
                            className={`inline-block font-mono text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              trx.is_basement_bypass
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : trx.status === "LUNAS"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {trx.is_basement_bypass
                              ? "BASEMENT"
                              : trx.status === "LUNAS"
                              ? "LUNAS"
                              : "DITOLAK"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Tabel Lengkap Audit Transaksi (Financial Ledger Style) */}
            <div className="rounded-lg border border-emerald-200 bg-white shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-emerald-800 text-white border-b border-emerald-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
                  <span className="font-bold uppercase tracking-tight text-white">
                    Buku Pembantu Penerimaan Retribusi — {formatTanggalIndo(selectedDate)}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-200">
                  {transactions.length} Data Terverifikasi Kriptografi &amp; Geofencing
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-emerald-50 text-[11px] font-mono uppercase text-emerald-900 border-b border-emerald-200 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Struk/ID</th>
                      <th className="px-4 py-2.5">Kode Lapak</th>
                      <th className="px-4 py-2.5">Nama Pedagang</th>
                      <th className="px-4 py-2.5">Komoditas</th>
                      <th className="px-4 py-2.5">Petugas Penagih</th>
                      <th className="px-4 py-2.5">Zonasi</th>
                      <th className="px-4 py-2.5 text-right">Tarif (Rp)</th>
                      <th className="px-4 py-2.5">Validasi Spasial</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                          Belum ada transaksi tercatat pada pembukuan{" "}
                          {formatTanggalIndo(selectedDate)}.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="px-4 py-2.5 text-slate-400">#{trx.id}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">
                            {trx.kode_kios}
                          </td>
                          <td className="px-4 py-2.5 font-sans font-medium text-slate-800">
                            {trx.nama_pemilik}
                          </td>
                          <td className="px-4 py-2.5 font-sans text-slate-600">
                            {trx.jenis_dagangan}
                          </td>
                          <td className="px-4 py-2.5 font-sans text-slate-700">
                            {trx.petugas || "Petugas"}
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-600">
                            {trx.lantai}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-950 tabular-nums">
                            Rp {Number(trx.nominal).toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-2.5 text-[10px]">
                            {trx.is_basement_bypass ? (
                              <span className="text-blue-700 font-bold">
                                BYPASS BASEMENT
                              </span>
                            ) : trx.is_geofence_valid ? (
                              <span className="text-emerald-700 font-bold">
                                GEOFENCE SAH (±{Math.round(trx.accuracy || 0)}m)
                              </span>
                            ) : (
                              <span className="text-red-700 font-bold">
                                DITOLAK (LUAR RADIUS)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                trx.status === "LUNAS"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {trx.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-500 text-[11px]">
                            {new Date(trx.created_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KATALOG KIOS & CETAK STIKER QR (KRIPTOGRAFI) */}
        {activeTab === "kios" && (
          <div className="space-y-4">
            {kiosError && <Alert type="error">{kiosError}</Alert>}

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-emerald-200 shadow-xs">
              <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode lapak, nama pedagang..."
                    value={searchKios}
                    onChange={(e) => setSearchKios(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                  />
                </div>
                <select
                  value={filterLantai}
                  onChange={(e) => setFilterLantai(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white text-slate-800"
                >
                  <option value="ALL">Semua Sektor Lantai</option>
                  <option value="BASEMENT">Basement (Blindspot)</option>
                  <option value="LANTAI_1">Lantai 1</option>
                  <option value="LANTAI_2">Lantai 2</option>
                </select>
              </div>

              <Button
                variant="gov"
                size="sm"
                icon={Plus}
                onClick={() => setIsAddModalOpen(true)}
              >
                Daftarkan Kios Baru
              </Button>
            </div>

            {/* Kios Registry Grid */}
            {isLoadingKios ? (
              <div className="text-center py-12 text-xs font-mono text-slate-500">
                Memuat basis data lapak pasar...
              </div>
            ) : filteredKios.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 text-slate-500 text-xs">
                Tidak ada lapak kios yang cocok dengan filter pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredKios.map((kios) => (
                  <div
                    key={kios.id}
                    className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-emerald-400 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
                          {kios.kode_kios}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 font-medium">
                          {kios.lantai}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {kios.nama_pemilik}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {kios.jenis_dagangan}
                      </p>
                      <p className="text-xs font-mono font-bold text-emerald-900 mt-2">
                        Tarif: Rp {Number(kios.tarif_retribusi).toLocaleString("id-ID")} / hari
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={QrCode}
                        onClick={() => setSelectedKios(kios)}
                      >
                        Stiker QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: PREVIEW & CETAK STIKER QR LAPAK */}
      {selectedKios && (
        <div className="fixed inset-0 z-50 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-2xl relative border border-emerald-300">
            <button
              onClick={() => setSelectedKios(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center pb-3 border-b border-emerald-200">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                DISPERINDAG KABUPATEN BANDUNG
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Stiker Resmi Lapak Pedagang
              </h3>
              <p className="text-[10px] font-mono text-slate-500">
                UPTD Pasar Cicalengka
              </p>
            </div>

            {/* Matriks QR Code */}
            <div className="my-4 text-center">
              <div className="p-3 bg-white border border-emerald-300 rounded inline-block shadow-2xs">
                {selectedKios.qr_image_url ? (
                  <img
                    src={selectedKios.qr_image_url}
                    alt={`QR Code ${selectedKios.kode_kios}`}
                    className="w-48 h-48 mx-auto object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>
            </div>

            {/* Info Kios */}
            <div className="bg-emerald-50/60 rounded p-2.5 text-xs font-mono border border-emerald-200 space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">KODE KIOS:</span>
                <span className="font-bold text-slate-900">{selectedKios.kode_kios}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PEDAGANG:</span>
                <span className="font-bold text-slate-900">{selectedKios.nama_pemilik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">KOMODITAS:</span>
                <span className="text-slate-800">{selectedKios.jenis_dagangan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TARIF:</span>
                <span className="font-bold text-emerald-900">
                  Rp {Number(selectedKios.tarif_retribusi).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

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
                variant="gov"
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
      )}

      {/* MODAL 2: DAFTARKAN KIOS BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-2xl relative border border-emerald-300">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 pb-2 border-b border-emerald-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Penerbitan Stiker Kios Baru
              </h3>
              <p className="text-xs text-slate-500">
                Data akan ditandatangani secara kriptografis dengan HMAC-SHA256
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

            <form onSubmit={handleCreateKios} className="space-y-3">
              <Input
                label="Kode Kios (Format Resmi)"
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
                label="Jenis Dagangan / Komoditas"
                placeholder="Contoh: Sayur Mayur, Daging Ayam"
                required
                value={newKiosForm.jenis_dagangan}
                onChange={(e) =>
                  setNewKiosForm({ ...newKiosForm, jenis_dagangan: e.target.value })
                }
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zona / Lantai Kios <span className="text-red-500">*</span>
                </label>
                <select
                  value={newKiosForm.lantai}
                  onChange={(e) =>
                    setNewKiosForm({ ...newKiosForm, lantai: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-emerald-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                >
                  <option value="LANTAI_1">Lantai 1 - Sektor Sayur / Kering</option>
                  <option value="LANTAI_2">Lantai 2 - Sektor Pakaian / Tekstil</option>
                  <option value="BASEMENT">Basement - Sektor Basah (Blindspot Satelit)</option>
                </select>
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
                  variant="gov"
                  size="md"
                  isLoading={isSubmittingKios}
                  className="flex-1"
                >
                  Terbitkan Lapak
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
