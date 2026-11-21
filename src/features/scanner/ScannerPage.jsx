import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
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
  User,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  X,
  Compass,
} from "lucide-react";

export default function ScannerPage() {
  const { user, logout } = useAuth();
  const {
    location,
    error: geoError,
    isLoading: isGeoLoading,
    accuracyQuality,
    getCurrentPosition,
  } = useGeolocation();

  // State Verifikasi & Pemrosesan
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null); // Data kios dari backend
  const [currentQrToken, setCurrentQrToken] = useState(""); // Token mentah QR
  const [scannedGps, setScannedGps] = useState(null); // GPS pada saat scan
  const [fraudWarning, setFraudWarning] = useState("");
  const [successPaymentMessage, setSuccessPaymentMessage] = useState("");

  // Riwayat Kios yang Berhasil Dipindai Sesi Ini
  const [sessionScans, setSessionScans] = useState([]);

  // Evaluasi Geofencing Status Keberadaan Petugas (Radar UI)
  const locationStatus = evaluateOfficerLocation(
    location?.latitude,
    location?.longitude,
    location?.accuracy
  );

  // Ambil posisi GPS awal saat halaman pertama kali dibuka
  useEffect(() => {
    getCurrentPosition().catch((err) => {
      console.warn("GPS awal belum aktif:", err.message);
    });
  }, [getCurrentPosition]);

  // Ambil riwayat transaksi resmi hari ini dari database backend
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

  /**
   * Handler saat kamera mendeteksi QR Code
   * Mengekstrak token dan menarik titik GPS pada milidetik yang sama
   */
  const handleQrDetected = async (decodedText) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setFraudWarning("");
    setSuccessPaymentMessage("");

    // Feedback getar ponsel (haptic feedback)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(100);
    }

    try {
      // 1. Tarik GPS tepat pada milidetik pemindaian QR
      let currentCoords = null;
      try {
        currentCoords = await getCurrentPosition();
      } catch (gpsErr) {
        console.warn("GPS gagal ditarik:", gpsErr.message);
      }
      setScannedGps(currentCoords);

      // 2. Simpan token QR mentah untuk validasi setoran Fase 5
      setCurrentQrToken(decodedText);

      // 3. Verifikasi tanda tangan digital HMAC ke server backend
      const response = await kiosService.verifyQr(decodedText);
      const verifiedKios = response.data;

      // 4. Tampilkan modal hasil verifikasi ke petugas
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

  /**
   * Konfirmasi Pelunasan Retribusi (Fase 5: Validasi Geofencing & Database Commit)
   */
  const handleConfirmPayment = async () => {
    if (!scanResult || !currentQrToken) return;

    setIsProcessing(true);
    setFraudWarning("");
    setSuccessPaymentMessage("");

    try {
      // Pastikan ada titik GPS saat konfirmasi
      let coords = scannedGps || location;
      if (!coords) {
        try {
          coords = await getCurrentPosition();
          setScannedGps(coords);
        } catch (gpsErr) {
          console.warn("Gagal menarik GPS saat konfirmasi:", gpsErr);
        }
      }

      if (!coords && !scanResult.is_basement) {
        throw new Error(
          "Sensor GPS belum mendeteksi lokasi Anda. Harap izinkan dan aktifkan GPS untuk verifikasi wilayah pasar!"
        );
      }

      const payload = {
        qr_token: currentQrToken,
        latitude: coords ? coords.latitude : 0,
        longitude: coords ? coords.longitude : 0,
        accuracy: coords ? coords.accuracy : 0,
      };

      // Panggil backend Express: POST /api/retribusi/bayar
      const response = await retribusiService.bayarRetribusi(payload);
      const trx = response.data;

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
        ? "✨ Bypass Basement (Blindspot)"
        : "📍 Geofence Pasar Sah";

      setSuccessPaymentMessage(
        `Retribusi kios ${trx.kode_kios} (Rp ${trx.nominal.toLocaleString(
          "id-ID"
        )}) BERHASIL DISAHKAN & DISETORKAN! (${flagInfo})`
      );

      // Reset modal dan state scan
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar Petugas */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pasar-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            PC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                UPTD Pasar Cicalengka
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                PETUGAS
              </span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              {user?.nama || "Petugas Lapangan"}
            </p>
          </div>
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* Notifikasi Sukses Bayar */}
        {successPaymentMessage && (
          <Alert
            variant="success"
            title="Penagihan Berhasil"
            message={successPaymentMessage}
            onClose={() => setSuccessPaymentMessage("")}
          />
        )}

        {/* Notifikasi Peringatan Fraud Anti-Pungli */}
        {fraudWarning && (
          <Alert
            variant="error"
            title="Peringatan Fraud Terdeteksi!"
            message={fraudWarning}
            onClose={() => setFraudWarning("")}
          />
        )}

        {/* Status Sensor GPS Satelit & Radar Geofencing */}
        <Card className="border-gray-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    location
                      ? locationStatus.isAllowed
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-red-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Radar Geofence Satelit
                </span>
              </div>

              <button
                type="button"
                onClick={() => getCurrentPosition()}
                disabled={isGeoLoading}
                className="text-xs text-pasar-600 hover:text-pasar-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isGeoLoading ? "animate-spin" : ""}`}
                />
                Perbarui Titik
              </button>
            </div>

            {/* Banner Status Posisi Petugas Saat Ini */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                locationStatus.badgeColor === "emerald"
                  ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                  : locationStatus.badgeColor === "blue"
                  ? "bg-blue-50/90 border-blue-200 text-blue-900"
                  : locationStatus.badgeColor === "red"
                  ? "bg-red-50/90 border-red-200 text-red-900"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {locationStatus.isAllowed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold">{locationStatus.title}</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {locationStatus.message}
                </p>
              </div>
            </div>

            {/* Nilai Koordinat GPS & Indikator Sinyal */}
            {location ? (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-mono text-gray-800">
                    <MapPin className="h-3.5 w-3.5 text-pasar-600 shrink-0" />
                    <span>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 ml-5">
                    Akurasi: ± {location.accuracy} meter
                  </p>
                </div>

                {/* Badge Kualitas Sinyal Satelit */}
                <div>
                  {accuracyQuality === "good" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      Sinyal Kuat (&lt;10m)
                    </span>
                  )}
                  {accuracyQuality === "medium" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                      Sinyal Sedang
                    </span>
                  )}
                  {accuracyQuality === "poor" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                      Sinyal Lemah (&gt;20m)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <p>
                  {geoError ||
                    "Menunggu akses sensor GPS. Pastikan izin lokasi telah diaktifkan di browser."}
                </p>
              </div>
            )}

            {/* Mini-Map Interaktif Petugas (OpenStreetMap + Leaflet) */}
            <div className="pt-1">
              <p className="text-[11px] font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                <Compass className="h-3 w-3 text-pasar-600" />
                Peta Posisi &amp; Poligon Pasar Cicalengka:
              </p>
              <OfficerRadarMap
                location={location}
                accuracyQuality={accuracyQuality}
                isAllowed={locationStatus.isAllowed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modul Kamera Scanner QR Code (html5-qrcode) */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-base flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-pasar-600" />
              Pemindai QR Code Lapak Pedagang
            </CardTitle>
            <p className="text-xs text-gray-500">
              Arahkan kamera ke stiker QR HMAC terenkripsi yang tertempel di kios pasar
            </p>
          </CardHeader>

          <CardContent className="pt-2">
            <Html5QrScanner
              onScanSuccess={handleQrDetected}
              isPaused={isProcessing || Boolean(scanResult)}
            />
          </CardContent>
        </Card>

        {/* Riwayat Penagihan Hari Ini (Mini Session Log) */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Riwayat Sesi Ini
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pasar-100 text-pasar-800">
                {sessionScans.length} Kios
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {sessionScans.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                Belum ada kios yang ditagih pada sesi ini. Pindai stiker QR untuk memulai penagihan.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {sessionScans.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between hover:bg-gray-50 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900">
                          {item.kode_kios}
                        </span>
                        <span className="text-gray-500">({item.nama_pemilik})</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.waktu} • {item.lantai}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-pasar-700">
                        Rp {Number(item.tarif).toLocaleString("id-ID")}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">
                        LUNAS
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* MODAL HASIL SCAN & KONFIRMASI RETRIBUSI */}
      {scanResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setScanResult(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Modal */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-2">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                QR Code Kios Terverifikasi
              </h3>
              <p className="text-xs text-gray-500">
                Tanda tangan kriptografi HMAC-SHA256 Asli &amp; Sah
              </p>
            </div>

            {/* Rincian Kios */}
            <div className="my-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500">Kode Kios:</span>
                <span className="font-mono font-bold text-base text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {scanResult.kode_kios}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Nama Pedagang:</span>
                <span className="font-bold text-gray-900">{scanResult.nama_pemilik}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Jenis Dagangan:</span>
                <span className="text-gray-800">{scanResult.jenis_dagangan}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Zona / Lantai:</span>
                {scanResult.is_basement ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                    Basement (Area Blindspot)
                  </span>
                ) : (
                  <span className="font-semibold text-gray-800">
                    {scanResult.lantai}
                  </span>
                )}
              </div>

              {scanResult.is_basement && (
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-700">
                  ℹ️ Lapak Basement: Sinyal GPS satelit dibypass otomatis pada Fase 5.
                </div>
              )}

              {/* Data Sensor GPS Saat Scan */}
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <span className="font-semibold text-gray-700 block">
                  Sensor GPS Saat Pindai:
                </span>
                {scannedGps ? (
                  <div className="text-[11px] font-mono text-gray-600 bg-white p-2 rounded border border-gray-100">
                    <div>
                      Titik: {scannedGps.latitude.toFixed(6)}, {scannedGps.longitude.toFixed(6)}
                    </div>
                    <div>Akurasi Satelit: ± {scannedGps.accuracy}m</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-600 italic">
                    GPS tidak terdeteksi saat pemindaian
                  </div>
                )}
              </div>

              {/* Tarif Retribusi */}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Tarif Retribusi:</span>
                <span className="text-lg font-bold text-pasar-700">
                  Rp {Number(scanResult.tarif).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                disabled={isProcessing}
                onClick={() => {
                  setScanResult(null);
                  setCurrentQrToken("");
                }}
              >
                Scan Ulang
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={CheckCircle2}
                className="flex-1"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
              >
                {isProcessing ? "Memproses Setoran..." : "Konfirmasi Lunas"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
