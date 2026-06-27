"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LandMapProps {
  latNum: number;
  lngNum: number;
  zoomNum: number;
  onMapClick?: (lat: string, lng: string) => void; // Dibuat opsional (?) karena View tidak butuh klik
  readOnly?: boolean; // Tambahkan flag ini untuk membedakan Mode View dan Create/Edit
}

export default function LandMap({ latNum, lngNum, zoomNum, onMapClick, readOnly = false }: LandMapProps) {
  
  // Komponen internal pengendali event peta
  function MapController() {
    const map = useMapEvents({
      click(e) {
        // Jika mode readOnly aktif, abaikan semua klik pada peta
        if (readOnly || !onMapClick) return;
        
        onMapClick(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    // Amankan ukuran kanvas peta saat pertama kali dibuka (mengatasi peta bolong)
    useEffect(() => {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 500);
      return () => clearTimeout(timer);
    }, [map]);

    // Sinkronisasi: Jika koordinat berubah (baik lewat ketik manual atau data dari API), peta otomatis bergeser
    useEffect(() => {
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        map.setView([latNum, lngNum], map.getZoom(), { animate: true });
      }
    }, [latNum, lngNum, map]);

    return null;
  }

  return (
    <MapContainer center={[latNum, lngNum]} zoom={zoomNum} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <MapController />
      {!isNaN(latNum) && !isNaN(lngNum) && <Marker position={[latNum, lngNum]} />}
    </MapContainer>
  );
}