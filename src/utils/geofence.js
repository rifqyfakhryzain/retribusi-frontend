/**
 * Utilitas Spasial & Geofencing Pasar Cicalengka (Frontend)
 */

// Poligon Batas Fisik Gedung Pasar Cicalengka [Latitude, Longitude]
export const PASAR_CICALENGKA_POLYGON = [
  [-6.986800, 107.838500],
  [-6.986800, 107.840200],
  [-6.988300, 107.840200],
  [-6.988300, 107.838500],
];

// Titik Pusat Pasar Cicalengka
export const PASAR_CENTER = {
  latitude: -6.987550,
  longitude: 107.839350,
};

// Titik Uji Coba Simulasi Meja Kerja (HP Android Mahasiswa)
export const DEV_TEST_LOCATION = {
  latitude: -7.050403,
  longitude: 107.759690,
  radiusMeters: 200,
};

/**
 * Rumus Haversine: Hitung jarak antar koordinat dalam meter
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Algoritma Point-in-Polygon (Ray Casting)
 */
export function isPointInPolygon(point, polygon) {
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Evaluasi Status Keberadaan Petugas untuk Tampilan Radar UI
 */
export function evaluateOfficerLocation(latitude, longitude, accuracy = 0) {
  if (!latitude || !longitude) {
    return {
      status: "NO_GPS",
      isAllowed: false,
      title: "Menunggu Sinyal GPS",
      message: "Aktifkan GPS pada ponsel untuk memverifikasi lokasi penagihan.",
      badgeColor: "gray",
      distance: 0,
    };
  }

  const point = [latitude, longitude];

  // 1. Cek apakah ada di dalam batas poligon resmi Pasar Cicalengka
  const inMarket = isPointInPolygon(point, PASAR_CICALENGKA_POLYGON);
  const distToCenter = calculateHaversineDistance(
    latitude,
    longitude,
    PASAR_CENTER.latitude,
    PASAR_CENTER.longitude
  );

  if (inMarket || distToCenter <= 135) {
    return {
      status: "INSIDE_MARKET",
      isAllowed: true,
      title: "Di Dalam Wilayah Pasar Cicalengka",
      message: "Lokasi sah dan terverifikasi. Anda siap melakukan pemindaian stiker QR.",
      badgeColor: "emerald",
      distance: Math.round(distToCenter),
    };
  }

  // 2. Cek apakah berada di zona simulasi uji coba meja kerja
  const distToDev = calculateHaversineDistance(
    latitude,
    longitude,
    DEV_TEST_LOCATION.latitude,
    DEV_TEST_LOCATION.longitude
  );

  if (distToDev <= DEV_TEST_LOCATION.radiusMeters) {
    return {
      status: "DEV_SIMULATION",
      isAllowed: true,
      title: "Zona Simulasi Meja Kerja (Dev Mode)",
      message: "Lokasi disahkan melalui zona uji coba pengembangan skripsi.",
      badgeColor: "blue",
      distance: Math.round(distToDev),
      isDev: true,
    };
  }

  // 3. Berada di Luar Radius Pasar
  const km = (distToCenter / 1000).toFixed(2);
  return {
    status: "OUTSIDE_MARKET",
    isAllowed: false,
    title: "Di Luar Wilayah Pasar Cicalengka",
    message: `Posisi Anda berjarak ${km} km dari Pasar Cicalengka. Penagihan di luar kawasan pasar akan ditolak.`,
    badgeColor: "red",
    distance: Math.round(distToCenter),
  };
}
