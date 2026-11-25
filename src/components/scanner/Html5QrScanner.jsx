import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { Camera, CameraOff, Zap, SwitchCamera } from "lucide-react";

/**
 * Komponen Kamera Pemindai QR Code Menggunakan pustaka html5-qrcode
 * Desain: Minimalist Viewfinder (Anti-AI-Slop) dengan 4 sudut siku tipis,
 * garis scan halus tanpa neon berlebihan, dan kontrol kamera 3 kolom.
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

  const stopScanner = async () => {
    if (
      html5QrCodeRef.current &&
      html5QrCodeRef.current.isScanning &&
      !isStoppingRef.current
    ) {
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

  // Ambil daftar kamera yang tersedia di perangkat
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prioritaskan kamera belakang (environment) untuk pemindaian fisik stiker lapak
          const backCamera = devices.find(
            (c) =>
              c.label.toLowerCase().includes("back") ||
              c.label.toLowerCase().includes("rear") ||
              c.label.toLowerCase().includes("environment"),
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setCameraError("Sensor kamera tidak terdeteksi pada perangkat ini.");
        }
      })
      .catch(() => {
        setCameraError(
          "Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera Anda.",
        );
      });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIdToUse) => {
    setCameraError("");
    const camId = cameraIdToUse || selectedCameraId;

    if (!camId) {
      setCameraError("Sensor kamera belum siap atau tidak ditemukan.");
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

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
        // Silent frame callback
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
        qrCodeErrorCallback,
      );

      setIsScanning(true);

      // Cek ketersediaan fitur senter / torch
      try {
        const capabilities =
          html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.error("Gagal memulai scanner:", err);
      setCameraError(
        err.message ||
          "Gagal menyalakan kamera. Pastikan izin kamera telah diberikan.",
      );
      setIsScanning(false);
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

      {/* Frame Viewfinder Kamera */}
      <div className="relative aspect-square w-full max-h-[340px] max-w-[340px] mx-auto rounded-lg bg-slate-950 overflow-hidden border border-slate-200 flex items-center justify-center">
        {/* Kontainer DOM html5-qrcode */}
        <div
          id={scannerContainerId}
          className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Viewfinder Minimalist Overlay saat Kamera Aktif */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="relative w-52 h-52">
              {/* 4 Sudut Siku Tipis Minimalis */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

              {/* Garis Pemindai Halus */}
              {!isPaused && (
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 animate-scan opacity-80" />
              )}
            </div>

            <p className="text-[11px] font-medium text-emerald-100 mt-3 px-3 py-1 bg-emerald-950/80 rounded-full border border-emerald-800">
              {isPaused
                ? "Memproses Verifikasi Kios..."
                : "Arahkan kamera ke stiker QR lapak"}
            </p>
          </div>
        )}

        {/* Placeholder saat Kamera Standby / Nonaktif */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-white">
            <div className="h-12 w-12 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center mb-3 border border-slate-800">
              <Camera className="h-6 w-6 stroke-[1.75]" />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Kamera Scanner Siap
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[230px] leading-relaxed">
              Tekan tombol di bawah untuk menyalakan sensor kamera pemindai.
            </p>
          </div>
        )}
      </div>

      {/* Action Bar Kontrol Kamera (Tersusun Rapi) */}
      <div className="max-w-[340px] mx-auto">
        {!isScanning ? (
          <Button
            variant="primary"
            size="lg"
            icon={Camera}
            onClick={() => startScanner()}
            className="w-full font-semibold"
          >
            Nyalakan Kamera
          </Button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="md"
              icon={CameraOff}
              onClick={stopScanner}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              Matikan
            </Button>

            <Button
              variant="outline"
              size="md"
              icon={SwitchCamera}
              onClick={handleSwitchCamera}
              disabled={cameras.length <= 1}
              title="Ganti Kamera Depan/Belakang"
            >
              Kamera
            </Button>

            <Button
              variant={isTorchOn ? "primary" : "outline"}
              size="md"
              icon={Zap}
              onClick={toggleTorch}
              disabled={!hasTorch}
              title="Senter Flash Kamera"
            >
              Senter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
