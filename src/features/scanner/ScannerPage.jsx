import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Html5QrScanner from "../../components/scanner/Html5QrScanner";
import useGeolocation from "../../hooks/useGeolocation";
import kiosService from "../../services/kiosService";
import retribusiService from "../../services/retribusiService";
import OfficerRadarMap from "../../components/map/OfficerRadarMap";
import { evaluateOfficerLocation } from "../../utils/geofence";
import {
  QrCode,
  MapPin,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  X,
  Radio,
  CalendarDays,
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
    0
  );

  // Evaluasi Geofencing Status Keberadaan Petugas
  const locationStatus = evaluateOfficerLocation(
    location?.latitude,
    location?.longitude,
    location?.accuracy
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
        `Retribusi ${trx.kode_kios} (Rp ${trx.nominal.toLocaleString(
          "id-ID"
        )}) BERHASIL DISAHKAN (${flagInfo})`
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar Petugas - Nuansa Hijau Institusional */}
      <header className="bg-emerald-800 border-b border-emerald-700 text-white sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-emerald-900 text-emerald-100 flex items-center justify-center font-mono font-bold text-sm border border-emerald-600 shadow-xs">
            PC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold uppercase tracking-wider text-emerald-50">
                UPTD Pasar Cicalengka
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-900/90 text-emerald-200 border border-emerald-600">
                PETUGAS
              </span>
            </div>
            <p className="text-[11px] text-emerald-200 font-mono mt-0.5">
              Operator: {user?.nama || "Petugas Lapangan"}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={LogOut}
          onClick={logout}
          className="bg-emerald-900 hover:bg-emerald-700 text-emerald-100 border-emerald-700 text-xs py-1 px-2.5"
        >
          Keluar
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-3.5 space-y-3">
        {/* Notifikasi Sukses */}
        {successPaymentMessage && (
          <Alert
            variant="success"
            title="Transaksi Berhasil Diterbitkan"
            message={successPaymentMessage}
            onClose={() => setSuccessPaymentMessage("")}
          />
        )}

        {/* Notifikasi Peringatan Fraud */}
        {fraudWarning && (
          <Alert
            variant="error"
            title="Peringatan Validasi Sistem"
            message={fraudWarning}
            onClose={() => setFraudWarning("")}
          />
        )}

        {/* Status Telemetri GPS & Radar Geofence */}
        <div className="rounded-lg border border-emerald-200 bg-white shadow-xs overflow-hidden">
          <div className="px-3.5 py-2.5 bg-emerald-800 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  location
                    ? locationStatus.isAllowed
                      ? "bg-emerald-300"
                      : "bg-red-300"
                    : "bg-emerald-200"
                }`}
              />
              <span className="font-mono font-bold tracking-wider text-[11px] uppercase text-emerald-100">
                Status Spasial Satelit
              </span>
            </div>

            <button
              type="button"
              onClick={() => getCurrentPosition()}
              disabled={isGeoLoading}
              className="text-[11px] font-mono text-emerald-100 hover:text-white flex items-center gap-1 cursor-pointer bg-emerald-900 px-2 py-0.5 rounded border border-emerald-600 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isGeoLoading ? "animate-spin" : ""}`} />
              Sinkron GPS
            </button>
          </div>

          <div className="p-3 space-y-2.5">
            {/* Status Geofence Box */}
            <div
              className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                locationStatus.isAllowed
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                  : "bg-red-50 border-red-300 text-red-950"
              }`}
            >
              <div className="flex items-center gap-2">
                {locationStatus.isAllowed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-700 shrink-0" />
                )}
                <div>
                  <p className="font-bold uppercase tracking-tight text-[11px]">
                    {locationStatus.title}
                  </p>
                  <p className="text-[10px] opacity-85 mt-0.2">
                    {locationStatus.message}
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded bg-white border border-current">
                {locationStatus.isAllowed ? "SAH" : "DITOLAK"}
              </span>
            </div>

            {/* Nilai Koordinat & Akurasi */}
            {location ? (
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-emerald-50/40 p-2.5 rounded border border-emerald-200 text-slate-800">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Koordinat GPS:</span>
                  <span className="font-bold text-emerald-950">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Akurasi Satelit:</span>
                  <span className="font-bold text-emerald-950">
                    ± {location.accuracy} meter
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>{geoError || "Menunggu izin akses sensor satelit..."}</span>
              </div>
            )}

            {/* Radar Mini-Map */}
            <OfficerRadarMap
              location={location}
              isAllowed={locationStatus.isAllowed}
            />
          </div>
        </div>

        {/* Viewfinder Kamera Pemindai QR */}
        <div className="rounded-lg border border-emerald-200 bg-white shadow-xs overflow-hidden">
          <div className="px-3.5 py-2.5 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <QrCode className="h-4 w-4 text-emerald-700" />
              <span>PEMINDAI STIKER LAPAK</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 font-medium">
              WebRTC Camera Engine
            </span>
          </div>

          <div className="p-3">
            <Html5QrScanner
              onScanSuccess={handleQrDetected}
              isPaused={isProcessing || Boolean(scanResult)}
            />
          </div>
        </div>

        {/* Log Riwayat Penagihan Khusus Hari Ini Saja */}
        <div className="rounded-lg border border-emerald-200 bg-white shadow-xs overflow-hidden">
          <div className="px-3.5 py-2.5 bg-emerald-800 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold tracking-wide">
              <CalendarDays className="h-4 w-4 text-emerald-300" />
              <span>REKAPITULASI PENAGIHAN HARI INI</span>
            </div>
            <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-100 border border-emerald-600">
              {todayFormatted}
            </span>
          </div>

          {/* Mini Ringkasan Kas Shift Hari Ini */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-emerald-50/60 border-b border-emerald-100 text-xs font-mono">
            <div className="p-2 bg-white rounded border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                Lapak Lunas (Hari Ini)
              </span>
              <span className="text-base font-bold text-emerald-950">
                {sessionScans.length} Kios
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-emerald-200 shadow-2xs text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                Total Setoran Tunai
              </span>
              <span className="text-base font-bold text-emerald-950">
                Rp {totalNominalHariIni.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {sessionScans.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-mono">
                Belum ada transaksi penagihan pada hari ini. Pindai stiker lapak pedagang untuk mencatat retribusi.
              </div>
            ) : (
              sessionScans.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 flex items-center justify-between hover:bg-emerald-50/30 text-xs transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {item.kode_kios}
                      </span>
                      <span className="font-medium text-slate-800">{item.nama_pemilik}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {item.waktu} WIB • {item.lantai}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-900 text-xs block">
                      Rp {Number(item.tarif).toLocaleString("id-ID")}
                    </span>
                    <span
                      className={`inline-block font-mono text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        item.is_basement
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {item.is_basement ? "BASEMENT" : "LUNAS"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] font-mono text-slate-500 text-center">
            SOP UPTD: Rekapitulasi terbatas pada shift hari berjalan (hari ini saja).
          </div>
        </div>
      </main>

      {/* MODAL VERIFIKASI RETRIBUSI - DIGITAL RECEIPT STYLE */}
      {scanResult && (
        <div className="fixed inset-0 z-50 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-2xl relative border border-emerald-300">
            <button
              onClick={() => setScanResult(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header Struk */}
            <div className="text-center pb-3 border-b-2 border-dashed border-emerald-200">
              <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 mb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Tanda Tangan HMAC Sah
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Struk Verifikasi Lapak Pedagang
              </h3>
              <p className="text-[10px] font-mono text-slate-500">
                Sistem e-Retribusi Pasar Cicalengka
              </p>
            </div>

            {/* Rincian Kios */}
            <div className="my-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                <span className="text-slate-500 text-[11px]">Kode Lapak:</span>
                <span className="font-mono font-bold text-sm text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {scanResult.kode_kios}
                </span>
              </div>

              <div className="flex justify-between py-0.5">
                <span className="text-slate-500 text-[11px]">Pedagang:</span>
                <span className="font-semibold text-slate-900">{scanResult.nama_pemilik}</span>
              </div>

              <div className="flex justify-between py-0.5">
                <span className="text-slate-500 text-[11px]">Komoditas:</span>
                <span className="text-slate-800">{scanResult.jenis_dagangan}</span>
              </div>

              <div className="flex justify-between py-0.5 items-center">
                <span className="text-slate-500 text-[11px]">Sektor / Zona:</span>
                <span className="font-mono text-[11px] font-semibold text-slate-800">
                  {scanResult.lantai} {scanResult.is_basement ? "(Blindspot)" : ""}
                </span>
              </div>

              {/* Tagihan Final */}
              <div className="pt-2 border-t-2 border-dashed border-emerald-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-emerald-900 uppercase">Tarif Wajib:</span>
                <span className="text-2xl font-black text-emerald-800 font-mono">
                  Rp {Number(scanResult.tarif).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setScanResult(null)}
              >
                Batal
              </Button>
              <Button
                variant="gov"
                size="md"
                icon={CheckCircle2}
                isLoading={isProcessing}
                className="flex-2 font-bold tracking-tight"
                onClick={handleConfirmPayment}
              >
                SAHKAN &amp; SETORKAN
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
