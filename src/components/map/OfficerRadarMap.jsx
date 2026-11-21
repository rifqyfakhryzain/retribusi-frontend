import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PASAR_CICALENGKA_POLYGON, PASAR_CENTER } from "../../utils/geofence";
import { MapPin, Navigation, Maximize2 } from "lucide-react";

/**
 * Komponen Peta Radar Lokasi untuk Layar HP Petugas Lapangan
 */
export default function OfficerRadarMap({
  location,
  accuracyQuality,
  isAllowed,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Buat instance peta dengan pusat Pasar Cicalengka
      const map = L.map(mapContainerRef.current, {
        center: [PASAR_CENTER.latitude, PASAR_CENTER.longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Basemap OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Gambar Batas Poligon Gedung Pasar Cicalengka
      const marketPolygon = L.polygon(PASAR_CICALENGKA_POLYGON, {
        color: "#059669",
        weight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.25,
        dashArray: "4, 6",
      }).addTo(map);

      marketPolygon.bindTooltip("Batas Pasar Cicalengka", {
        permanent: false,
        direction: "center",
        className: "text-[11px] font-semibold text-emerald-800 bg-white/90 px-2 py-0.5 rounded shadow-sm border border-emerald-200",
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sinkronisasi Posisi GPS Petugas Saat Bergerak
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (location && location.latitude && location.longitude) {
      const latLng = [location.latitude, location.longitude];

      // Custom Pulsing DivIcon untuk Marker Petugas
      const pinColor = isAllowed ? "#10b981" : "#ef4444";
      const officerIcon = L.divIcon({
        className: "custom-officer-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 9999px; background-color: ${pinColor}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Hapus marker lama jika ada
      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
        markerRef.current.setIcon(officerIcon);
      } else {
        markerRef.current = L.marker(latLng, { icon: officerIcon })
          .addTo(map)
          .bindTooltip("Posisi Anda Saat Ini", {
            direction: "top",
            offset: [0, -10],
            className: "text-[11px] font-bold text-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-200",
          });
      }

      // Gambar / perbarui lingkaran akurasi satelit
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(location.accuracy || 10);
      } else {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: location.accuracy || 10,
          color: isAllowed ? "#10b981" : "#ef4444",
          fillColor: isAllowed ? "#10b981" : "#ef4444",
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map);
      }

      // Geser kamera peta dengan animasi halus ke titik petugas
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
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
      {/* Wadah Peta Leaflet */}
      <div ref={mapContainerRef} className="h-48 w-full z-0" />

      {/* Floating Action Controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleCenterToOfficer}
          title="Fokus ke Posisi Saya"
          className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 text-gray-700 hover:text-pasar-700 hover:bg-pasar-50 transition-colors cursor-pointer"
        >
          <Navigation className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleCenterToMarket}
          title="Fokus ke Pasar Cicalengka"
          className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 text-gray-700 hover:text-pasar-700 hover:bg-pasar-50 transition-colors cursor-pointer"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Mini Legend Overlay */}
      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-gray-700 shadow border border-gray-200 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Batas Pasar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          <span>Posisi Anda</span>
        </div>
      </div>
    </div>
  );
}
