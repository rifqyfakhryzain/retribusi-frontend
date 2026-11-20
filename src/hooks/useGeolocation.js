import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom Hook: useGeolocation
 * Mengakses HTML5 Geolocation API dengan akurasi tinggi (GPS Satelit)
 * Menangani izin akses, koordinat (lat, lng), radius akurasi, dan error handling.
 */
export function useGeolocation(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionState, setPermissionState] = useState("unknown");

  const watchIdRef = useRef(null);

  const defaultOptions = {
    enableHighAccuracy: true, // Wajib presisi tinggi (GPS satelit)
    timeout: 10000,           // 10 detik batas waktu pencarian satelit
    maximumAge: 0,            // Jangan gunakan cache koordinat lama
    ...options,
  };

  // Cek status izin sensor Geolocation di peramban
  useEffect(() => {
    if ("permissions" in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => {
            setPermissionState(result.state);
          };
        })
        .catch(() => {
          setPermissionState("unknown");
        });
    }
  }, []);

  // Format pesan error ramah pengguna dalam Bahasa Indonesia
  const parseGeoError = (err) => {
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        return "Izin akses GPS ditolak. Silakan izinkan akses lokasi pada peramban/perangkat Anda.";
      case 2: // POSITION_UNAVAILABLE
        return "Sinyal lokasi tidak tersedia. Pastikan sensor GPS ponsel Anda aktif.";
      case 3: // TIMEOUT
        return "Pencarian sinyal GPS melebihi batas waktu (timeout). Coba lagi di tempat terbuka.";
      default:
        return err.message || "Gagal mendapatkan koordinat GPS.";
    }
  };

  /**
   * Mengambil posisi saat ini secara one-shot (Promise-based)
   * Dipanggil tepat saat kamera pemindai berhasil mendeteksi QR Code
   */
  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const errMsg = "Peramban ini tidak mendukung sensor Geolocation GPS.";
        setError(errMsg);
        reject(new Error(errMsg));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy * 10) / 10, // dalam meter
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          setLocation(coords);
          setIsLoading(false);
          resolve(coords);
        },
        (err) => {
          const friendlyMessage = parseGeoError(err);
          setError(friendlyMessage);
          setIsLoading(false);
          reject(new Error(friendlyMessage));
        },
        defaultOptions
      );
    });
  }, []);

  /**
   * Menilai kualitas akurasi sinyal satelit GPS:
   * - "good": <= 10m (sangat ideal untuk geofencing)
   * - "medium": 10m - 20m (toleransi wajar)
   * - "poor": > 20m (berpotensi ditolak pada validasi Geofencing Fase 5)
   */
  const getAccuracyQuality = (acc) => {
    if (acc === null || acc === undefined) return null;
    if (acc <= 10) return "good";
    if (acc <= 20) return "medium";
    return "poor";
  };

  return {
    location,
    error,
    isLoading,
    permissionState,
    accuracyQuality: location ? getAccuracyQuality(location.accuracy) : null,
    getCurrentPosition,
  };
}

export default useGeolocation;
