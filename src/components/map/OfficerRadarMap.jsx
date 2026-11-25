import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PASAR_CICALENGKA_POLYGON, PASAR_CENTER } from "../../utils/geofence";
import { Navigation, Maximize2 } from "lucide-react";

/**
 * Komponen Peta Radar Lokasi untuk Layar HP Petugas Lapangan
 * Menampilkan posisi real-time petugas dengan radar pulsing pin, radius akurasi,
 * dan batas geofence poligon Pasar Cicalengka.
 */
export default function OfficerRadarMap({
  location,
  isAllowed,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [PASAR_CENTER.latitude, PASAR_CENTER.longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Batas Poligon Kawasan Pasar Cicalengka
      const marketPolygon = L.polygon(PASAR_CICALENGKA_POLYGON, {
        color: "#047857",
        weight: 2.5,
        fillColor: "#10b981",
        fillOpacity: 0.2,
        dashArray: "4, 4",
      }).addTo(map);

      marketPolygon.bindTooltip("Perimeter Pasar Cicalengka", {
        direction: "center",
        className:
          "bg-emerald-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-700 shadow-xs",
      });

      // LayerGroup khusus untuk marker posisi petugas & akurasi
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size untuk memastikan perhitungan container akurat
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Update Titik Koordinat Posisi Petugas Secara Real-Time
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Bersihkan marker lama agar tidak ada tumpang tindih atau stale reference
    layerGroup.clearLayers();

    if (location && location.latitude && location.longitude) {
      const latLng = [location.latitude, location.longitude];
      const pinColor = isAllowed ? "#047857" : "#dc2626";

      // 1. Lingkaran Radius Akurasi Satelit
      const accuracyCircle = L.circle(latLng, {
        radius: Math.max(location.accuracy || 15, 10),
        color: pinColor,
        fillColor: pinColor,
        fillOpacity: 0.14,
        weight: 1.5,
        dashArray: "3, 3",
      });
      layerGroup.addLayer(accuracyCircle);

      // 2. Marker Pin Radar Pulsing Petugas
      const officerIcon = L.divIcon({
        className: "custom-officer-pin",
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.25;"></div>
            <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.5);"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker(latLng, { icon: officerIcon });
      marker.bindTooltip(
        isAllowed ? "Lokasi Petugas (Sah)" : "Lokasi Petugas (Luar Radius)",
        {
          permanent: true,
          direction: "top",
          offset: [0, -12],
          className: isAllowed
            ? "bg-emerald-800 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-600 shadow-sm"
            : "bg-rose-700 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-600 shadow-sm",
        }
      );
      layerGroup.addLayer(marker);

      // Arahkan kamera peta ke posisi petugas
      map.setView(latLng, 16);
      map.invalidateSize();
    }
  }, [location, isAllowed]);

  const handleCenterToOfficer = () => {
    if (mapInstanceRef.current && location) {
      mapInstanceRef.current.setView(
        [location.latitude, location.longitude],
        16,
        { animate: true }
      );
    }
  };

  const handleCenterToMarket = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [PASAR_CENTER.latitude, PASAR_CENTER.longitude],
        16,
        { animate: true }
      );
    }
  };

  return (
    <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
      <div ref={mapContainerRef} className="h-44 w-full z-0" />

      {/* Control Buttons */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleCenterToOfficer}
          title="Pusatkan ke Posisi Petugas"
          className="p-1.5 bg-white rounded-md border border-slate-200 text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5 stroke-[1.75]" />
        </button>
        <button
          type="button"
          onClick={handleCenterToMarket}
          title="Fokus ke Kawasan Pasar"
          className="p-1.5 bg-white rounded-md border border-slate-200 text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5 stroke-[1.75]" />
        </button>
      </div>

      {/* Mini Status Tag */}
      <div
        className={`absolute bottom-2 left-2 z-10 px-2.5 py-0.5 rounded text-[10px] font-mono shadow-xs border ${
          isAllowed
            ? "bg-emerald-800 text-white border-emerald-700"
            : "bg-rose-700 text-white border-rose-800"
        }`}
      >
        Perimeter Geofence: {isAllowed ? "DALAM PERIMETER" : "LUAR RADIUS"}
      </div>
    </div>
  );
}
