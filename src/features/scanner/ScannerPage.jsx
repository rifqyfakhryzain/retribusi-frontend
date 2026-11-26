import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Html5QrScanner from "../../components/scanner/Html5QrScanner";
import useGeolocation from "../../hooks/useGeolocation";
import kiosService from "../../services/kiosService";
import retribusiService from "../../services/retribusiService";
import OfficerRadarMap from "../../components/map/OfficerRadarMap";
import { evaluateOfficerLocation } from "../../utils/geofence";
import {
  QrCode,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ScannerPage() {
  const { user, logout } = useAuth();
  const {
    location,
    error: geoError,
    isLoading: isGeoLoading,
    getCurrentPosition,
  } = useGeolocation();

  // State Verifikasi & Pemrosesan
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [currentQrToken, setCurrentQrToken] = useState("");
  const [scannedGps, setScannedGps] = useState(null);
  const [fraudWarning, setFraudWarning] = useState("");
  const [successPaymentMessage, setSuccessPaymentMessage] = useState("");
  const [isRadarExpanded, setIsRadarExpanded] = useState(true);

  // Riwayat Kios yang Berhasil Dipindai Sesi Ini (Khusus Hari Ini)
  const [sessionScans, setSessionScans] = useState([]);

  // Format Hari Ini & Agregasi Kas Harian Petugas
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalNominalHariIni = sessionScans.reduce(
    (acc, curr) => acc + (Number(curr.tarif) || 0),
    0,
  );

  // Evaluasi Geofencing Status Keberadaan Petugas
  const locationStatus = evaluateOfficerLocation(
    location?.latitude,
    location?.longitude,
    location?.accuracy,
  );

  useEffect(() => {
    getCurrentPosition().catch((err) => {
      console.warn("GPS awal belum aktif:", err.message);
    });
  }, [getCurrentPosition]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await retribusiService.getRiwayatPetugas();
        if (res.data) {
          const formatted = res.data.map((item) => ({
            id: item.id,
            kode_kios: item.kode_kios,
            nama_pemilik: item.nama_pemilik,
            lantai: item.lantai,
            tarif: item.nominal,
            is_basement: item.is_basement_bypass,
            is_geofence_valid: item.is_geofence_valid,
            gps: {
              latitude: item.latitude,
              longitude: item.longitude,
              accuracy: item.accuracy,
            },
            waktu: new Date(item.created_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          }));
          setSessionScans(formatted);
        }
      } catch (err) {
        console.warn("Gagal memuat riwayat awal petugas:", err.message);
      }
    };

    fetchHistory();
  }, []);

  const handleQrDetected = async (decodedText) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setFraudWarning("");
    setSuccessPaymentMessage("");
    setCurrentQrToken(decodedText);

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }

    try {
      let currentCoords = null;
      try {
        currentCoords = await getCurrentPosition();
      } catch (gpsErr) {
        console.warn("GPS gagal ditarik:", gpsErr.message);
      }
      setScannedGps(currentCoords);

      const response = await kiosService.verifyQr(decodedText);
      const verifiedKios = response.data;
      setScanResult(verifiedKios);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Gagal memverifikasi keaslian QR Code";
      setFraudWarning(errorMessage);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 100, 200]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!scanResult || !currentQrToken) return;

    setIsProcessing(true);
    setFraudWarning("");
    setSuccessPaymentMessage("");

    try {
      let coords = scannedGps || location;
      if (!coords) {
        try {
          coords = await getCurrentPosition();
          setScannedGps(coords);
        } catch (e) {
          console.warn("Gagal mendapatkan koordinat terbaru:", e);
        }
      }

      const payload = {
        qr_token: currentQrToken,
        latitude: coords?.latitude || 0,
        longitude: coords?.longitude || 0,
        accuracy: coords?.accuracy || 0,
      };

      const res = await retribusiService.bayarRetribusi(payload);
      const trx = res.data;

      const newRecord = {
        id: trx.id,
        kode_kios: trx.kode_kios,
        nama_pemilik: trx.nama_pemilik,
        lantai: trx.lantai,
        tarif: trx.nominal,
        is_basement: trx.is_basement_bypass,
        is_geofence_valid: trx.is_geofence_valid,
        gps: {
          latitude: trx.latitude,
          longitude: trx.longitude,
          accuracy: trx.accuracy,
        },
        waktu: new Date(trx.created_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setSessionScans((prev) => [newRecord, ...prev]);

      const flagInfo = trx.is_basement_bypass
        ? "Bypass Basement Sah"
        : "Geofence Valid";

      setSuccessPaymentMessage(
        `Retribusi ${trx.kode_kios} (Rp ${Number(trx.nominal).toLocaleString(
          "id-ID",
        )}) BERHASIL DISAHKAN (${flagInfo})`,
      );

      setScanResult(null);
      setCurrentQrToken("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Gagal memproses setoran retribusi";
      setFraudWarning(errorMessage);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 100, 200]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Telemetri Sinyal GPS Indicator
  const gpsAccuracy = location?.accuracy || 0;
  const gpsDotColor = !location
    ? "bg-slate-400"
    : gpsAccuracy <= 10
      ? "bg-emerald-400"
      : gpsAccuracy <= 20
        ? "bg-amber-400"
        : "bg-rose-400";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <div className="max-w-md w-full mx-auto min-h-screen flex flex-col bg-slate-50 border-x border-slate-200/60 shadow-xs">
        {/* ========================================================= */}
        {/* 1. Compact Sticky Topbar (h-14 bg-emerald-800)            */}
        {/* ========================================================= */}
        <header className="h-14 bg-emerald-800 border-b border-emerald-900 text-white px-4 sticky top-0 z-20 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-900 text-emerald-100 border border-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="h-4 w-4 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wide text-white leading-tight">
                {user?.nama || "Petugas Lapangan"}
              </h1>
              <p className="text-[10px] text-emerald-200 font-sans leading-none">
                Pasar Cicalengka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* GPS Telemetry Pill */}
            <div
              className="bg-emerald-900/90 border border-emerald-700 text-emerald-100 text-xs font-mono px-2.5 py-1 rounded-full flex items-center gap-1.5 select-none"
              title={`Akurasi GPS: ±${Math.round(gpsAccuracy)}m`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${gpsDotColor}`} />
              <span className="tabular-nums">
                {location ? `±${Math.round(gpsAccuracy)}m` : "Mencari GPS"}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="text-red-500 hover:text-white p-1.5 rounded-md hover:bg-emerald-700 transition-colors cursor-pointer"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4 stroke-[2]" />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. Main Mobile Body Content                               */}
        {/* ========================================================= */}
        <main className="flex-1 p-3.5 space-y-3.5">
          {/* Feedback Notifikasi Sukses */}
          {successPaymentMessage && (
            <Alert
              variant="success"
              title="Transaksi Berhasil"
              message={successPaymentMessage}
              onClose={() => setSuccessPaymentMessage("")}
            />
          )}

          {/* Feedback Notifikasi Fraud */}
          {fraudWarning && (
            <Alert
              variant="error"
              title="Peringatan Validasi Sistem"
              message={fraudWarning}
              onClose={() => setFraudWarning("")}
            />
          )}

          {/* GPS Telemetry & Spasial Banner Card */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              {
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      location
                        ? locationStatus.isAllowed
                          ? "bg-emerald-600"
                          : "bg-rose-600"
                        : "bg-slate-400"
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Status Telemetri Spasial
                  </span>
                </div>
              }
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => getCurrentPosition()}
                  disabled={isGeoLoading}
                  className="text-[11px] font-mono text-slate-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 stroke-[1.75] ${isGeoLoading ? "animate-spin text-emerald-700" : ""}`}
                  />
                  <span>Sync</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRadarExpanded(!isRadarExpanded)}
                  className="text-slate-500 hover:text-slate-700 p-0.5 cursor-pointer"
                  title={
                    isRadarExpanded ? "Tutup Peta Radar" : "Buka Peta Radar"
                  }
                >
                  {isRadarExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Validasi Geofence:
                </span>
                {locationStatus.isAllowed ? (
                  <Badge variant="success" size="sm">
                    Dalam Kawasan Pasar
                  </Badge>
                ) : (
                  <Badge variant="danger" size="sm">
                    Luar Radius Pasar
                  </Badge>
                )}
              </div>

              {location ? (
                <div className="text-[11px] font-mono text-slate-500 flex justify-between tabular-nums pt-1 border-t border-slate-100">
                  <span>
                    Lat/Lng: {location.latitude.toFixed(5)},{" "}
                    {location.longitude.toFixed(5)}
                  </span>
                  <span>Akurasi: ±{Math.round(location.accuracy || 0)}m</span>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 pt-1">
                  {geoError || "Memperbarui sinyal koordinat satelit..."}
                </p>
              )}

              {/* Collapsible Radar Mini-Map */}
              {isRadarExpanded && (
                <div className="pt-2">
                  <OfficerRadarMap
                    location={location}
                    isAllowed={locationStatus.isAllowed}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Viewfinder Kamera Pemindai QR */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 uppercase tracking-wider">
                <QrCode className="h-4 w-4 text-emerald-700 stroke-[1.75]" />
                <span>Pemindai Stiker Lapak</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                WebRTC Camera
              </span>
            </div>

            <Html5QrScanner
              onScanSuccess={handleQrDetected}
              isPaused={isProcessing || Boolean(scanResult)}
            />

            {/* Caption Koordinat Tipis */}
            {location && (
              <p className="text-[11px] font-mono text-slate-500 text-center tabular-nums pt-1">
                GPS: {location.latitude.toFixed(5)},{" "}
                {location.longitude.toFixed(5)} (&plusmn;
                {Math.round(location.accuracy || 0)}m)
              </p>
            )}
          </div>

          {/* Rekapitulasi Penagihan Shift Hari Ini */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 uppercase tracking-wider">
                Riwayat Sesi Hari Ini
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {todayFormatted}
              </span>
            </div>

            {/* Ringkasan Kas Mini */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 p-3 bg-slate-50/50 border-b border-slate-100 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">
                  Kios Lunas
                </span>
                <span className="text-base font-semibold text-slate-900 tabular-nums">
                  {sessionScans.length} Lapak
                </span>
              </div>
              <div className="pl-3 text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">
                  Total Terkumpul
                </span>
                <span className="text-base font-semibold text-emerald-800 tabular-nums">
                  Rp {totalNominalHariIni.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* List Transaksi Petugas */}
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {sessionScans.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-sans">
                  Belum ada retribusi yang dipindai hari ini.
                </div>
              ) : (
                sessionScans.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                          {item.kode_kios}
                        </span>
                        <span className="font-medium text-slate-800">
                          {item.nama_pemilik}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.waktu} WIB &bull; {item.lantai}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="font-mono font-semibold text-slate-900 block tabular-nums">
                        Rp {Number(item.tarif).toLocaleString("id-ID")}
                      </span>
                      {item.is_basement ? (
                        <Badge variant="warning" size="sm">
                          BASEMENT
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          LUNAS
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. Bottom Sheet Konfirmasi Pelunasan (Modal Tagihan)       */}
      {/* ========================================================= */}
      {scanResult && (
        <Modal
          isOpen={Boolean(scanResult)}
          onClose={() => setScanResult(null)}
          variant="sheet"
          title="Konfirmasi Pelunasan Retribusi"
        >
          <div className="space-y-4">
            {/* Status Geofence / Validasi */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Status Validasi:</span>
              <Badge variant="success" size="md">
                TANDA TANGAN HMAC SAH
              </Badge>
            </div>

            {/* Rincian Kios Terpindai */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs text-slate-500">Kode Lapak:</span>
                <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {scanResult.kode_kios}
                </span>
              </div>

              <div className="flex justify-between text-xs py-0.5">
                <span className="text-slate-500">Pedagang:</span>
                <span className="font-semibold text-slate-900">
                  {scanResult.nama_pemilik}
                </span>
              </div>

              <div className="flex justify-between text-xs py-0.5">
                <span className="text-slate-500">Komoditas:</span>
                <span className="text-slate-700">
                  {scanResult.jenis_dagangan}
                </span>
              </div>

              <div className="flex justify-between text-xs py-0.5">
                <span className="text-slate-500">Zonasi:</span>
                <span className="font-mono text-slate-700">
                  {scanResult.lantai}
                </span>
              </div>
            </div>

            {/* Tagihan Nominal Besar */}
            <div className="text-center py-2 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-xs font-medium text-emerald-900 uppercase block tracking-wider">
                Total Tagihan Retribusi
              </span>
              <div className="text-3xl font-bold font-mono text-emerald-800 mt-1 tabular-nums">
                Rp {Number(scanResult.tarif).toLocaleString("id-ID")}
              </div>
            </div>

            {/* Ringkasan GPS Singkat */}
            <div className="text-[11px] font-mono text-slate-500 text-center">
              {location
                ? `Koordinat: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)} (±${Math.round(location.accuracy || 0)}m)`
                : "Menunggu pembacaan GPS"}
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                size="lg"
                icon={CheckCircle2}
                isLoading={isProcessing}
                onClick={handleConfirmPayment}
                className="w-full h-12 text-sm font-semibold"
              >
                Konfirmasi Pelunasan
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => setScanResult(null)}
                className="w-full text-slate-600 hover:text-slate-900"
              >
                Batalkan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
