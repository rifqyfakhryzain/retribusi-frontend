import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PASAR_CICALENGKA_POLYGON, PASAR_CENTER } from "../../utils/geofence";
import { Navigation, Maximize2 } from "lucide-react";

/**
 * Komponen Peta Radar Lokasi untuk Layar HP Petugas Lapangan
 * Desain: Institutional GovTech Radar
 */
export default function OfficerRadarMap({
  location,
  isAllowed,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

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

      // Batas Poligon Pasar Cicalengka (Garis Hijau Emerald Tegas)
      L.polygon(PASAR_CICALENGKA_POLYGON, {
        color: "#047857",
        weight: 2.5,
        fillColor: "#10b981",
        fillOpacity: 0.22,
        dashArray: "4, 4",
      }).addTo(map);

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
    if (!map) return;

    if (location && location.latitude && location.longitude) {
      const latLng = [location.latitude, location.longitude];
      const pinColor = isAllowed ? "#047857" : "#dc2626";

      const officerIcon = L.divIcon({
        className: "custom-officer-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px;">
            <div style="position: absolute; width: 20px; height: 20px; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.35;"></div>
            <div style="position: relative; width: 12px; height: 12px; border-radius: 9999px; background-color: ${pinColor}; border: 2px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
        markerRef.current.setIcon(officerIcon);
      } else {
        markerRef.current = L.marker(latLng, { icon: officerIcon }).addTo(map);
      }

      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(location.accuracy || 10);
      } else {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: location.accuracy || 10,
          color: isAllowed ? "#047857" : "#dc2626",
          fillColor: isAllowed ? "#047857" : "#dc2626",
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map);
      }

      map.setView(latLng, 17, { animate: true });
    }
  }, [location, isAllowed]);

  const handleCenterToOfficer = () => {
    if (mapInstanceRef.current && location) {
      mapInstanceRef.current.setView(
        [location.latitude, location.longitude],
        17,
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
    <div className="relative rounded border border-emerald-300 overflow-hidden bg-slate-100">
      <div ref={mapContainerRef} className="h-40 w-full z-0" />

      {/* Control Buttons */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={handleCenterToOfficer}
          title="Fokus ke Posisi Saya"
          className="p-1.5 bg-white rounded border border-emerald-200 text-emerald-900 shadow-xs cursor-pointer hover:bg-emerald-50 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCenterToMarket}
          title="Fokus ke Pasar"
          className="p-1.5 bg-white rounded border border-emerald-200 text-emerald-900 shadow-xs cursor-pointer hover:bg-emerald-50 transition-colors"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mini Status Tag */}
      <div className="absolute bottom-1.5 left-1.5 z-10 bg-emerald-800/95 text-white border border-emerald-600 px-2 py-0.5 rounded text-[10px] font-mono shadow-sm">
        Perimeter Geofence: {isAllowed ? "DALAM PERIMETER" : "LUAR RADIUS"}
      </div>
    </div>
  );
}
