import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PASAR_CICALENGKA_POLYGON, PASAR_CENTER } from "../../utils/geofence";
import { Layers, Navigation, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

/**
 * Komponen Peta Interaktif Spasial untuk Dasbor Monitoring Admin UPTD
 */
export default function DashboardLiveMap({ transactions = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [PASAR_CENTER.latitude, PASAR_CENTER.longitude],
        zoom: 16,
        zoomControl: true,
      });

      // Basemap OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Gambar Batas Poligon Fisik Gedung Pasar Cicalengka
      const marketPolygon = L.polygon(PASAR_CICALENGKA_POLYGON, {
        color: "#059669",
        weight: 3,
        fillColor: "#10b981",
        fillOpacity: 0.2,
      }).addTo(map);

      marketPolygon.bindTooltip("Kawasan Gedung Pasar Cicalengka (UPTD)", {
        permanent: true,
        direction: "center",
        className: "bg-white/90 border border-emerald-300 font-bold text-xs text-emerald-800 px-3 py-1 rounded-lg shadow-sm",
      });

      // Layer khusus untuk menampung pin transaksi
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sinkronisasi Pin Marker Transaksi saat data berubah (atau dari WebSocket)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Bersihkan marker lama
    markersLayer.clearLayers();

    const bounds = L.latLngBounds(PASAR_CICALENGKA_POLYGON);

    transactions.forEach((trx) => {
      if (!trx.latitude || !trx.longitude) return;

      const latLng = [trx.latitude, trx.longitude];
      bounds.extend(latLng);

      // Tentukan warna dan ikon marker berdasarkan status
      let pinColor = "#10b981"; // Hijau: Sah
      let badgeText = "Geofence Sah";
      let statusClass = "text-emerald-700 bg-emerald-100";

      if (trx.is_basement_bypass) {
        pinColor = "#3b82f6"; // Biru: Basement Bypass
        badgeText = "Bypass Basement";
        statusClass = "text-blue-700 bg-blue-100";
      } else if (trx.status === "DITOLAK" || !trx.is_geofence_valid) {
        pinColor = "#ef4444"; // Merah: Fraud / Di luar radius
        badgeText = "Fraud Ditolak";
        statusClass = "text-red-700 bg-red-100";
      }

      // Custom Vector Pin DivIcon
      const markerIcon = L.divIcon({
        className: "custom-transaction-marker",
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: ${pinColor}; border: 3px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">
              Rp
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Buat Popup Interaktif
      const formattedTime = new Date(trx.created_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 8px;">
            <span style="font-family: monospace; font-weight: bold; font-size: 13px; color: #111827; background: #f3f4f6; padding: 2px 6px; rounded: 4px;">
              ${trx.kode_kios}
            </span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 9999px;" class="${statusClass}">
              ${badgeText}
            </span>
          </div>

          <div style="font-size: 12px; color: #374151; line-height: 1.5; margin-bottom: 6px;">
            <div><strong>Pedagang:</strong> ${trx.nama_pemilik || "-"}</div>
            <div><strong>Dagangan:</strong> ${trx.jenis_dagangan || "-"} (${trx.lantai || "-"})</div>
            <div><strong>Petugas:</strong> ${trx.petugas || "Petugas Lapangan"}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 6px; font-size: 11px;">
            <span style="color: #6b7280;">${formattedTime}</span>
            <span style="font-weight: bold; color: #059669; font-size: 13px;">
              Rp ${Number(trx.nominal).toLocaleString("id-ID")}
            </span>
          </div>
          
          <div style="margin-top: 4px; font-size: 10px; color: #9ca3af; font-family: monospace;">
            Satelit: ±${Math.round(trx.accuracy || 0)}m
          </div>
        </div>
      `;

      L.marker(latLng, { icon: markerIcon })
        .bindPopup(popupContent)
        .addTo(markersLayer);
    });

    // Auto-fit jika ada transaksi baru
    if (transactions.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [transactions]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [PASAR_CENTER.latitude, PASAR_CENTER.longitude],
        16,
        { animate: true }
      );
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Header Toolbar Peta */}
      <div className="p-3.5 bg-gray-50/90 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Layers className="h-4 w-4 text-pasar-600" />
          <span>Sebaran Geospasial Transaksi Lapak (OpenStreetMap)</span>
        </div>

        <button
          type="button"
          onClick={handleResetView}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-pasar-700 hover:bg-pasar-50 transition-colors shadow-sm cursor-pointer"
        >
          <Navigation className="h-3.5 w-3.5" />
          Pusatkan ke Pasar
        </button>
      </div>

      {/* Wadah Peta Leaflet */}
      <div ref={mapContainerRef} className="h-96 w-full z-0" />

      {/* Legend Spasial di Sudut Kiri Bawah */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 text-xs space-y-1.5">
        <p className="font-bold text-gray-800 text-[11px] mb-1">Legenda Status Lokasi:</p>
        <div className="flex items-center gap-2 text-gray-700">
          <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm"></span>
          <span>Lunas &amp; Geofence Valid</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span className="h-3 w-3 rounded-full bg-blue-500 shadow-sm"></span>
          <span>Lunas via Bypass Basement</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <span className="h-3 w-3 rounded-full bg-red-500 shadow-sm"></span>
          <span>Upaya Fraud (Luar Radius)</span>
        </div>
      </div>
    </div>
  );
}
