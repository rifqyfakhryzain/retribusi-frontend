import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import kiosService from "../../services/kiosService";
import retribusiService from "../../services/retribusiService";
import socket from "../../services/socket";
import DashboardLiveMap from "../../components/map/DashboardLiveMap";
import {
  DollarSign,
  Activity,
  QrCode,
  Plus,
  Search,
  Printer,
  X,
  Store,
  Clock,
  Calendar,
  CalendarDays,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  LogOut,
  RefreshCw,
  Menu,
  FileSpreadsheet,
  Check,
} from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Navigation Menu: "live" | "kios" | "fraud"
  const [activeMenu, setActiveMenu] = useState("live");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const [newlyAddedTrxId, setNewlyAddedTrxId] = useState(null);

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
      setKiosError(
        err.response?.data?.message || err.message || "Gagal memuat data kios",
      );
    } finally {
      setIsLoadingKios(false);
    }
  }, []);

  const fetchMonitoringData = useCallback(
    async (isSilent = false, targetDate = selectedDate) => {
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
            err.response?.data?.message ||
              err.message ||
              "Gagal memuat data monitoring real-time",
          );
        }
      } finally {
        if (!isSilent) setIsLoadingMonitoring(false);
      }
    },
    [selectedDate],
  );

  // Handler Sinkronisasi Lengkap
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback("");
    try {
      if (!socket.connected) {
        socket.connect();
      }
      await Promise.all([
        fetchKios(),
        fetchMonitoringData(false, selectedDate),
      ]);
      setSyncFeedback(
        `Tersinkronisasi ${new Date().toLocaleTimeString("id-ID")}`,
      );
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

    // Listener Utama: Tangkap Transaksi Baru dari Petugas Secara Real-Time
    const handleTransaksiBaru = (payload) => {
      const newTrx = payload.data;
      if (!newTrx) return;

      console.log(
        "[Socket.io] Real-time transaksi baru diterima:",
        newTrx.kode_kios,
      );

      const todayStr = getTodayString();
      const isCurrentlyToday = selectedDate === todayStr;

      if (isCurrentlyToday) {
        setNewlyAddedTrxId(newTrx.id);
        setTimeout(() => setNewlyAddedTrxId(null), 2500);

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

      setRealtimeNotification({
        type: "SUCCESS",
        title: "SETORAN LAPAK DITERIMA",
        message: `Kios ${newTrx.kode_kios} (${newTrx.nama_pemilik}) telah melunasi Rp ${Number(
          newTrx.nominal,
        ).toLocaleString("id-ID")}`,
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
        message:
          payload.message || "Upaya penagihan di luar radius pasar diblokir!",
        time: new Date().toLocaleTimeString("id-ID"),
        isTodayView: selectedDate === todayStr,
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("transaksi_baru", handleTransaksiBaru);
    socket.on("fraud_terdeteksi", handleFraudTerdeteksi);

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
    if (
      !newKiosForm.tarif_retribusi ||
      Number(newKiosForm.tarif_retribusi) <= 0
    ) {
      setAddKiosError(
        "Tarif retribusi harus berupa angka positif (lebih dari 0)",
      );
      return;
    }

    setIsSubmittingKios(true);

    try {
      const res = await kiosService.generateKios(newKiosForm);
      setAddKiosSuccess(
        `Kios ${res.data?.kode_kios} berhasil diterbitkan dengan QR Token HMAC!`,
      );
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

  // Transaksi Ditolak / Fraud Filtered
  const rejectedTransactions = transactions.filter(
    (t) => t.status === "DITOLAK" || !t.is_geofence_valid,
  );

  // Set ID / kode kios yang sudah lunas pada tanggal terpilih
  const lunasKiosSet = new Set(
    transactions
      .filter((t) => t.status === "LUNAS")
      .map((t) => t.kios_id || t.kode_kios),
  );
  const totalLunasCount =
    lunasKiosSet.size > 0
      ? lunasKiosSet.size
      : stats.total_transaksi_lunas || 0;
  const belumLunasCount = Math.max(0, (kiosList.length || 0) - totalLunasCount);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* ========================================================= */}
      {/* 1. Full-Width Institutional Top Header (Materially Style) */}
      {/* ========================================================= */}
      <header className="h-14 bg-emerald-800 border-b border-emerald-900 text-white sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        {/* Left Side: Brand Logo, Mobile Hamburger, & Active Page Context */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-1.5 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 stroke-[2]" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-900 text-emerald-100 border border-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="h-4 w-4 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wide text-white leading-tight">
                Pasar Cicalengka
              </h1>
              <p className="text-[10px] text-emerald-200 font-sans leading-none">
                PT. Bangun Niaga Perkasa
              </p>
            </div>
          </div>

          {/* Desktop Divider & Active Page Title */}
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-emerald-700/80 ml-2">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight leading-tight">
                {activeMenu === "live"
                  ? "Monitoring Live"
                  : activeMenu === "kios"
                    ? "Katalog Kios & Registrasi Stiker QR"
                    : "Log Pelanggaran"}
              </h2>
              <p className="text-[11px] text-emerald-200 font-sans">
                {formatTanggalIndo(selectedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Live Sync Status Indicator & Manual Sync */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Pill */}
          {isToday ? (
            isSocketConnected ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/90 text-emerald-100 border border-emerald-700 select-none">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-semibold">
                  Live Sync
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/80 text-rose-200 border border-rose-800 select-none">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="text-[11px] font-mono font-semibold">
                  Terputus
                </span>
              </div>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/80 text-amber-100 border border-amber-700 select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-mono font-semibold">
                Mode Arsip
              </span>
            </span>
          )}

          {syncFeedback && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-100 bg-emerald-900 px-2.5 py-1 rounded-md border border-emerald-700">
              <Check className="h-3 w-3 stroke-[2]" />
              {syncFeedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing || isLoadingMonitoring}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-950 bg-white border border-emerald-200 rounded-md hover:bg-emerald-50 active:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Sinkronisasi data ulang"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-emerald-800 stroke-[2] ${
                isSyncing || isLoadingMonitoring ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? "Menyinkronkan..." : "Sinkronisasi"}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. Body Container: Left White Sidebar + Right Workspace  */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-w-0">
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden top-14"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Clean White Sidebar (Underneath Header) */}
        <aside
          className={`fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 bg-white text-slate-700 border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Menu Utama
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("live");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeMenu === "live"
                  ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200/60 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity
                  className={`h-4 w-4 stroke-[1.75] ${
                    activeMenu === "live"
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                />
                <span>Monitoring Live</span>
              </div>
              {isToday && isSocketConnected && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("kios");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeMenu === "kios"
                  ? "bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200/60 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode
                  className={`h-4 w-4 stroke-[1.75] ${
                    activeMenu === "kios"
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                />
                <span>Katalog Kios & QR</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-mono font-semibold border border-slate-200">
                {kiosList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("fraud");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeMenu === "fraud"
                  ? "bg-rose-50 text-rose-900 font-semibold border border-rose-200/60 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert
                  className={`h-4 w-4 stroke-[1.75] ${
                    activeMenu === "fraud" ? "text-rose-600" : "text-slate-400"
                  }`}
                />
                <span>Log Pelanggaran</span>
              </div>
              {rejectedTransactions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-mono font-semibold border border-rose-200">
                  {rejectedTransactions.length}
                </span>
              )}
            </button>
          </nav>

          {/* Clean White Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50">
            <div className="px-1 mb-2.5">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.nama || "Admin UPTD"}
              </p>
              <p className="text-[11px] text-slate-500 font-sans truncate">
                Administrator &bull; UPTD Cicalengka
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={logout}
              className="w-full justify-start text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 text-xs py-1.5 transition-colors"
            >
              Keluar dari Sistem
            </Button>
          </div>
        </aside>

        {/* Right Workspace Main Content */}
        <main className="flex-1 p-4 sm:p-6 space-y-5 max-w-7xl w-full mx-auto">
          {/* Notification Toast / Banner for Real-Time Event */}
          {realtimeNotification && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                realtimeNotification.type === "SUCCESS"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : "bg-rose-50 border-rose-200 text-rose-950"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-semibold text-[10px] px-2 py-0.5 rounded bg-white border border-current">
                  {realtimeNotification.title}
                </span>
                <span className="font-medium">
                  {realtimeNotification.message}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({realtimeNotification.time})
                </span>
                {!realtimeNotification.isTodayView && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(getTodayString());
                      setRealtimeNotification(null);
                    }}
                    className="ml-2 underline text-emerald-700 font-semibold cursor-pointer"
                  >
                    Beralih ke Hari Ini &rarr;
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setRealtimeNotification(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 1: MONITORING LIVE                                   */}
          {/* ========================================================= */}
          {activeMenu === "live" && (
            <div className="space-y-5">
              {monitoringError && (
                <Alert
                  variant="error"
                  message={monitoringError}
                  onClose={() => setMonitoringError("")}
                />
              )}

              {/* Date Filter Toolbar */}
              <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(getTodayString())}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isToday
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isToday
                            ? "bg-emerald-600 animate-pulse"
                            : "bg-slate-400"
                        }`}
                      />
                      <span>Hari Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDate(getYesterdayString())}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isYesterday
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <History className="h-3 w-3 stroke-[1.75]" />
                      <span>Kemarin</span>
                    </button>
                  </div>

                  {/* Day Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={handlePrevDay}
                      title="Mundur 1 Hari"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-r border-slate-200 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 stroke-[1.75]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextDay}
                      disabled={isToday}
                      title="Maju 1 Hari"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4 stroke-[1.75]" />
                    </button>
                  </div>

                  {/* Custom Date Input */}
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="dashboard-date-picker"
                      className="text-xs text-slate-600 font-medium flex items-center gap-1"
                    >
                      <Calendar className="h-3.5 w-3.5 text-slate-500 stroke-[1.75]" />
                      <span className="hidden sm:inline">Pilih:</span>
                    </label>
                    <input
                      id="dashboard-date-picker"
                      type="date"
                      value={selectedDate}
                      max={getTodayString()}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDate(e.target.value);
                      }}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:border-emerald-700 bg-white cursor-pointer"
                    />
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 md:justify-end">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-700 stroke-[1.75]" />
                    <span>{formatTanggalIndo(selectedDate)}</span>
                  </span>
                  {/* <span className="text-[11px] font-mono text-slate-500">
                    {isToday
                      ? "Sesi Operasional Aktif"
                      : "Arsip Riwayat Transaksi"}
                  </span> */}
                </div>
              </div>

              {/* 4 Flat KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total Setoran */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Setoran Hari Ini
                    </span>
                    <DollarSign className="h-4 w-4 text-emerald-700 stroke-[1.75]" />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 tabular-nums mt-2">
                    Rp{" "}
                    {Number(stats.total_nominal_terkumpul || 0).toLocaleString(
                      "id-ID",
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.total_transaksi_lunas || 0} transaksi berhasil
                  </p>
                </div>

                {/* Metric 2: Kios Lunas */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Kios Lunas
                    </span>
                    <Store className="h-4 w-4 text-emerald-700 stroke-[1.75]" />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 tabular-nums mt-2">
                    {totalLunasCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dari total {kiosList.length || 0} lapak terdaftar
                  </p>
                </div>

                {/* Metric 3: Kios Belum Lunas */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Kios Belum Lunas
                    </span>
                    <Clock className="h-4 w-4 text-amber-600 stroke-[1.75]" />
                  </div>
                  <div className="text-2xl font-semibold text-slate-900 tabular-nums mt-2">
                    {belumLunasCount}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {belumLunasCount === 0
                      ? "Semua lapak telah lunas"
                      : `Tersisa dari total ${kiosList.length || 0} lapak`}
                  </p>
                </div>

                {/* Metric 4: Percobaan Fraud */}
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Pelanggaran
                    </span>
                    <ShieldAlert
                      className={`h-4 w-4 stroke-[1.75] ${
                        stats.total_fraud_ditolak > 0
                          ? "text-rose-600"
                          : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div
                    className={`text-2xl font-semibold tabular-nums mt-2 ${
                      stats.total_fraud_ditolak > 0
                        ? "text-rose-700"
                        : "text-slate-900"
                    }`}
                  >
                    {stats.total_fraud_ditolak || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.total_fraud_ditolak > 0
                      ? "Pelanggaran radius terdeteksi"
                      : "Zero fraud violation"}
                  </p>
                </div>
              </div>

              {/* Spatial Map & Real-time Live Feed Strip */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7">
                  <DashboardLiveMap
                    transactions={transactions}
                    selectedDate={selectedDate}
                    isToday={isToday}
                    formattedDateText={formatTanggalIndo(selectedDate)}
                  />
                </div>

                {/* Live Activity Feed */}
                <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col h-[415px]">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-700 stroke-[1.75]" />
                      <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Aktivitas Masuk Terakhir
                      </span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {transactions.length} Entri
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 font-sans">
                        Belum ada catatan setoran retribusi untuk periode ini.
                      </div>
                    ) : (
                      transactions.slice(0, 15).map((trx) => (
                        <div
                          key={trx.id}
                          className={`p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs ${
                            newlyAddedTrxId === trx.id
                              ? "animate-row-highlight"
                              : ""
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                {trx.kode_kios}
                              </span>
                              <span className="font-medium text-slate-800">
                                {trx.nama_pemilik}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {trx.petugas || "Petugas"} &bull; {trx.lantai}
                            </p>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="font-mono font-semibold text-slate-900 block text-xs tabular-nums">
                              Rp {Number(trx.nominal).toLocaleString("id-ID")}
                            </span>
                            {trx.status === "LUNAS" ? (
                              <Badge variant="success" size="sm">
                                LUNAS
                              </Badge>
                            ) : (
                              <Badge variant="danger" size="sm">
                                DITOLAK
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Full Transaction Audit Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-700 stroke-[1.75]" />
                    <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      Buku Pembantu Penerimaan Retribusi
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {transactions.length} Data Transaksi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Kios &amp; Pedagang</th>
                        <th className="py-3 px-4">Zona</th>
                        <th className="py-3 px-4">Petugas</th>
                        <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                        <th className="py-3 px-4">Validasi Spasial</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-slate-400 font-sans"
                          >
                            Tidak ada transaksi untuk tanggal ini.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((trx) => (
                          <tr
                            key={trx.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              newlyAddedTrxId === trx.id
                                ? "animate-row-highlight"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                              {new Date(trx.created_at).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-semibold text-slate-900 mr-1.5">
                                {trx.kode_kios}
                              </span>
                              <span className="text-slate-700">
                                {trx.nama_pemilik}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="neutral" size="sm">
                                {trx.lantai}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {trx.petugas || "Petugas"}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                              Rp {Number(trx.nominal).toLocaleString("id-ID")}
                            </td>
                            <td className="py-3 px-4">
                              {trx.is_geofence_valid ? (
                                <Badge variant="success" size="sm">
                                  GPS Valid (±{Math.round(trx.accuracy || 0)}m)
                                </Badge>
                              ) : (
                                <Badge variant="danger" size="sm">
                                  Luar Radius Pasar
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {trx.status === "LUNAS" ? (
                                <Badge variant="success" size="sm">
                                  LUNAS
                                </Badge>
                              ) : (
                                <Badge variant="danger" size="sm">
                                  DITOLAK
                                </Badge>
                              )}
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

          {/* ========================================================= */}
          {/* VIEW 2: KATALOG KIOS & QR                                 */}
          {/* ========================================================= */}
          {activeMenu === "kios" && (
            <div className="space-y-4">
              {kiosError && <Alert variant="error" message={kiosError} />}

              {/* Single-Line Toolbar */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 stroke-[1.75]" />
                    <input
                      type="text"
                      placeholder="Cari kode kios, pedagang..."
                      value={searchKios}
                      onChange={(e) => setSearchKios(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <select
                    value={filterLantai}
                    onChange={(e) => setFilterLantai(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-emerald-700 bg-white text-slate-700"
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

              {/* Tabel Terstruktur Katalog Kios */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {isLoadingKios ? (
                  <div className="py-12 text-center text-xs font-mono text-slate-500">
                    Memuat data registrasi lapak pedagang...
                  </div>
                ) : filteredKios.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    Tidak ada data lapak yang sesuai dengan pencarian.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Kode Kios</th>
                          <th className="py-3 px-4">Nama Pedagang</th>
                          <th className="py-3 px-4">Jenis Dagangan</th>
                          <th className="py-3 px-4">Lantai</th>
                          <th className="py-3 px-4 text-right">Tarif Harian</th>
                          <th className="py-3 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredKios.map((kios) => (
                          <tr
                            key={kios.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                              {kios.kode_kios}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {kios.nama_pemilik}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {kios.jenis_dagangan}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="neutral" size="sm">
                                {kios.lantai}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                              Rp{" "}
                              {Number(kios.tarif_retribusi).toLocaleString(
                                "id-ID",
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={QrCode}
                                onClick={() => setSelectedKios(kios)}
                              >
                                Stiker QR
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: LOG AUDIT FRAUD                                   */}
          {/* ========================================================= */}
          {activeMenu === "fraud" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                    <ShieldAlert className="h-4 w-4 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Audit Spasial &amp; Pencegahan Pungutan Liar
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Laporan ini memuat seluruh transaksi yang otomatis
                      dibatalkan atau ditolak oleh sistem akibat koordinat GPS
                      terdeteksi berada di luar batas geofence resmi Pasar
                      Cicalengka atau kegagalan verifikasi kriptografi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Daftar Transaksi Ditolak ({rejectedTransactions.length})
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Periode: {formatTanggalSingkat(selectedDate)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Waktu</th>
                        <th className="py-3 px-4">Kode Kios</th>
                        <th className="py-3 px-4">Nama Pedagang</th>
                        <th className="py-3 px-4">Petugas</th>
                        <th className="py-3 px-4">Koordinat GPS</th>
                        <th className="py-3 px-4">Akurasi Satelit</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rejectedTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-slate-400 font-sans"
                          >
                            Tidak ada anomali atau fraud yang terdeteksi pada
                            periode ini.
                          </td>
                        </tr>
                      ) : (
                        rejectedTransactions.map((trx) => (
                          <tr
                            key={trx.id}
                            className="hover:bg-rose-50/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-slate-500">
                              {new Date(trx.created_at).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                              {trx.kode_kios}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {trx.nama_pemilik}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {trx.petugas || "Petugas"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                              {trx.latitude
                                ? `${trx.latitude.toFixed(5)}, ${trx.longitude.toFixed(5)}`
                                : "N/A"}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                              {trx.accuracy
                                ? `±${Math.round(trx.accuracy)}m`
                                : "N/A"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant="danger" size="sm">
                                Ditolak (Luar Radius)
                              </Badge>
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
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PREVIEW & CETAK STIKER QR (KRIPTOGRAFI)          */}
      {/* ========================================================= */}
      {selectedKios && (
        <Modal
          isOpen={Boolean(selectedKios)}
          onClose={() => setSelectedKios(null)}
          title="QR Code Pedagang"
          subtitle="Pasar Cicalengka"
        >
          <div id="print-sticker-container" className="my-2">
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white max-w-sm mx-auto">
              {/* Header Stiker Resmi */}
              <div className="bg-emerald-950 text-white py-2.5 px-4 text-center">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-white-300 uppercase block">
                  PT. Bangun Niaga Perkasa
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  PASAR CICALENGKA — KABUPATEN BANDUNG
                </h4>
              </div>

              {/* Matriks QR Code */}
              <div className="p-4 text-center bg-white">
                <div className="p-3 bg-white border border-slate-200 rounded-md inline-block">
                  {selectedKios.qr_image_url ? (
                    <img
                      src={selectedKios.qr_image_url}
                      alt={`QR Code ${selectedKios.kode_kios}`}
                      className="w-44 h-44 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                      QR Image tidak tersedia
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                    {selectedKios.kode_kios}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-0.5">
                    {selectedKios.nama_pemilik}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedKios.jenis_dagangan} - {selectedKios.lantai}
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-700 mt-1 tabular-nums">
                    Tarif Retribusi: Rp{" "}
                    {Number(selectedKios.tarif_retribusi).toLocaleString(
                      "id-ID",
                    )}{" "}
                    / hari
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[10px] font-mono text-slate-500 text-center">
                Keaslian stiker dilindungi tanda tangan kriptografis HMAC-SHA256
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4 mt-2 border-t border-slate-200">
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
        </Modal>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DAFTARKAN KIOS BARU                              */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Penerbitan Kios & Stiker Baru"
          subtitle="Data akan ditandatangani secara kriptografis dengan token HMAC-SHA256"
        >
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
              label="Kode Kios (Format Resmi UPTD)"
              placeholder="Contoh: K-LT1-15, K-BSM-05"
              required
              value={newKiosForm.kode_kios}
              onChange={(e) =>
                setNewKiosForm({ ...newKiosForm, kode_kios: e.target.value })
              }
            />

            <Input
              label="Nama Pedagang / Pemilik Lapak"
              placeholder="Nama lengkap pedagang"
              required
              value={newKiosForm.nama_pemilik}
              onChange={(e) =>
                setNewKiosForm({ ...newKiosForm, nama_pemilik: e.target.value })
              }
            />

            <Input
              label="Jenis Dagangan / Komoditas"
              placeholder="Contoh: Sayur Mayur, Daging, Pakaian"
              required
              value={newKiosForm.jenis_dagangan}
              onChange={(e) =>
                setNewKiosForm({
                  ...newKiosForm,
                  jenis_dagangan: e.target.value,
                })
              }
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Zona / Lantai Kios <span className="text-rose-500">*</span>
              </label>
              <select
                value={newKiosForm.lantai}
                onChange={(e) =>
                  setNewKiosForm({ ...newKiosForm, lantai: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-emerald-700 bg-white text-slate-800"
              >
                <option value="LANTAI_1">
                  Lantai 1 - Sektor Sayur / Kering
                </option>
                <option value="LANTAI_2">
                  Lantai 2 - Sektor Pakaian / Tekstil
                </option>
                <option value="BASEMENT">
                  Basement - Sektor Basah (Blindspot Satelit)
                </option>
              </select>
            </div>

            <Input
              label="Tarif Retribusi Harian (Rp)"
              type="number"
              placeholder="5000"
              required
              value={newKiosForm.tarif_retribusi}
              onChange={(e) =>
                setNewKiosForm({
                  ...newKiosForm,
                  tarif_retribusi: Number(e.target.value),
                })
              }
            />

            <div className="pt-3 flex gap-2.5 border-t border-slate-200 mt-2">
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
                Terbitkan Kios
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
