import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PASAR_CICALENGKA_POLYGON, PASAR_CENTER } from "../../utils/geofence";
import { Layers, Navigation } from "lucide-react";

/**
 * Komponen Peta Interaktif Spasial untuk Dasbor Monitoring Admin UPTD
 * Desain: Enterprise GovTech Control Room (Nuansa Hijau Pasar Cicalengka)
 */
export default function DashboardLiveMap({ transactions = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [PASAR_CENTER.latitude, PASAR_CENTER.longitude],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Gambar Batas Poligon Fisik Gedung Pasar Cicalengka
      const marketPolygon = L.polygon(PASAR_CICALENGKA_POLYGON, {
        color: "#047857",
        weight: 2.5,
        fillColor: "#059669",
        fillOpacity: 0.2,
      }).addTo(map);

      marketPolygon.bindTooltip("Kawasan Resmi Gedung Pasar Cicalengka (UPTD)", {
        permanent: true,
        direction: "center",
        className: "bg-emerald-800 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-600 shadow-md",
      });

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

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const bounds = L.latLngBounds(PASAR_CICALENGKA_POLYGON);

    transactions.forEach((trx) => {
      if (!trx.latitude || !trx.longitude) return;

      const latLng = [trx.latitude, trx.longitude];
      bounds.extend(latLng);

      let pinColor = "#059669"; 
      let badgeText = "DALAM KAWASAN";
      let statusColor = "#047857";

      if (trx.is_basement_bypass) {
        pinColor = "#2563eb"; // Blue
        badgeText = "BASEMENT";
        statusColor = "#1d4ed8";
      } else if (trx.status === "DITOLAK" || !trx.is_geofence_valid) {
        pinColor = "#dc2626"; // Red
        badgeText = "LUAR RADIUS";
        statusColor = "#b91c1c";
      }

      const markerIcon = L.divIcon({
        className: "custom-transaction-pin",
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 14px; height: 14px; border-radius: 9999px; background-color: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const formattedTime = new Date(trx.created_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const popupContent = `
        <div style="min-width: 210px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; color: #1e293b;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-family: monospace; font-weight: 700; font-size: 12px; color: #022c22; background: #ecfdf5; padding: 1px 4px; border-radius: 3px; border: 1px solid #a7f3d0;">
              ${trx.kode_kios}
            </span>
            <span style="font-size: 9px; font-weight: 700; color: ${statusColor}; letter-spacing: 0.5px;">
              ${badgeText}
            </span>
          </div>

          <div style="line-height: 1.4; margin-bottom: 6px; color: #334155;">
            <div><strong>Pedagang:</strong> ${trx.nama_pemilik || "-"}</div>
            <div><strong>Komoditas:</strong> ${trx.jenis_dagangan || "-"} (${trx.lantai || "-"})</div>
            <div><strong>Petugas:</strong> ${trx.petugas || "Petugas Lapangan"}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 4px;">
            <span style="color: #64748b; font-family: monospace; font-size: 10px;">${formattedTime}</span>
            <span style="font-weight: 700; color: #064e3b; font-size: 12px; font-family: monospace;">
              Rp ${Number(trx.nominal).toLocaleString("id-ID")}
            </span>
          </div>
          
          <div style="margin-top: 2px; font-size: 9px; color: #94a3b8; font-family: monospace;">
            Koordinat: ${Number(trx.latitude).toFixed(5)}, ${Number(trx.longitude).toFixed(5)} (±${Math.round(trx.accuracy || 0)}m)
          </div>
        </div>
      `;

      L.marker(latLng, { icon: markerIcon })
        .bindPopup(popupContent)
        .addTo(markersLayer);
    });

    if (transactions.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
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
    <div className="rounded-lg border border-emerald-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Toolbar */}
      <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-semibold">
          <Layers className="h-4 w-4 text-emerald-700" />
          <span>Sebaran Spasial Penagihan (Batas Kawasan Pasar)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-700 font-medium">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block"></span>
              Dalam Kawasan
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-600 inline-block"></span>
              Lapak Basement
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-600 inline-block"></span>
                Luar Kawasan
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors shadow-2xs text-[11px] font-medium cursor-pointer"
          >
            <Navigation className="h-3 w-3" />
            Pusatkan
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="h-96 w-full z-0 flex-1 min-h-[360px]" />
    </div>
  );
}
