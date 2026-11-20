import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { Camera, CameraOff, RefreshCw, Zap, SwitchCamera } from "lucide-react";

/**
 * Komponen Kamera Pemindai QR Code Menggunakan pustaka html5-qrcode
 * Menyediakan antarmuka viewfinder modern dengan animasi laser pemindai,
 * pergantian kamera (depan/belakang), dan penanganan lifecycle kamera yang bersih.
 */
export default function Html5QrScanner({
  onScanSuccess,
  isPaused = false,
  className = "",
}) {
  const scannerContainerId = "html5-qrcode-region";
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const isStoppingRef = useRef(false);

  // Ambil daftar kamera yang tersedia di perangkat
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prioritaskan kamera belakang (environment) untuk pemindaian fisik
          const backCamera = devices.find(
            (c) =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("rear") ||
              c.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setCameraError("Tidak ada sensor kamera yang terdeteksi pada perangkat ini.");
        }
      })
      .catch((err) => {
        setCameraError(
          "Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera Anda."
        );
      });

    return () => {
      // Pastikan kamera dimatikan saat komponen dilepas (unmounted)
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIdToUse) => {
    setCameraError("");
    const camId = cameraIdToUse || selectedCameraId;

    if (!camId) {
      setCameraError("Kamera belum siap atau tidak ditemukan.");
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      // Jika masih berjalan, hentikan dulu
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        if (isPaused) return;
        if (onScanSuccess) {
          onScanSuccess(decodedText, decodedResult);
        }
      };

      const qrCodeErrorCallback = () => {
        // Abaikan frame yang tidak mengandung QR (silent scan frame)
      };

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edgeSize = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
          return {
            width: Math.floor(edgeSize),
            height: Math.floor(edgeSize),
          };
        },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        camId,
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      setIsScanning(true);

      // Cek apakah perangkat mendukung Torch (Senter)
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err) {
      console.error("Gagal memulai scanner:", err);
      setCameraError(
        err.message || "Gagal menyalakan kamera. Pastikan izin kamera telah diberikan."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Peringatan saat mematikan scanner:", err);
      } finally {
        isStoppingRef.current = false;
        setIsScanning(false);
        setIsTorchOn(false);
      }
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Gagal mengubah senter:", err);
    }
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);

    if (isScanning) {
      await stopScanner();
      startScanner(nextCamera.id);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {cameraError && (
        <Alert
          variant="error"
          message={cameraError}
          onClose={() => setCameraError("")}
        />
      )}

      {/* Frame Kotak Kamera */}
      <div className="relative aspect-square w-full max-w-[320px] mx-auto rounded-3xl bg-gray-950 overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center">
        {/* Kontainer DOM html5-qrcode */}
        <div
          id={scannerContainerId}
          className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Viewfinder Overlay saat Kamera Aktif */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            {/* Sudut Frame Bidik Hijau */}
            <div className="relative w-56 h-56 rounded-2xl border-2 border-pasar-400/80 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              {/* Garis Animasi Laser Pemindai */}
              {!isPaused && (
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-pasar-300 via-pasar-500 to-pasar-300 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_#22c55e]" />
              )}
            </div>
            <p className="text-white/90 text-xs font-semibold tracking-wide mt-3 px-3 py-1 bg-black/60 rounded-full backdrop-blur-sm">
              {isPaused ? "Memproses Data Lapak..." : "Posisikan QR di dalam bingkai"}
            </p>
          </div>
        )}

        {/* Placeholder saat Kamera Mati */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-gray-900 to-gray-950 text-white">
            <div className="h-16 w-16 rounded-2xl bg-white/10 text-pasar-400 flex items-center justify-center mb-3 backdrop-blur-sm">
              <Camera className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold text-gray-100">Kamera Scanner Siap</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Nyalakan kamera untuk mulai memindai stiker QR lapak pedagang
            </p>
          </div>
        )}
      </div>

      {/* Toolbar Kontrol Kamera */}
      <div className="flex items-center justify-center gap-2 max-w-[320px] mx-auto">
        {!isScanning ? (
          <Button
            variant="primary"
            size="lg"
            icon={Camera}
            onClick={() => startScanner()}
            className="w-full shadow-lg shadow-pasar-600/30"
          >
            Aktifkan Kamera
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              size="md"
              icon={CameraOff}
              onClick={stopScanner}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              Matikan
            </Button>

            {cameras.length > 1 && (
              <Button
                variant="secondary"
                size="md"
                icon={SwitchCamera}
                onClick={handleSwitchCamera}
                title="Ganti Kamera Depan/Belakang"
                className="px-3"
              />
            )}

            {hasTorch && (
              <Button
                variant={isTorchOn ? "primary" : "secondary"}
                size="md"
                icon={Zap}
                onClick={toggleTorch}
                title="Senter Flash"
                className="px-3"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
