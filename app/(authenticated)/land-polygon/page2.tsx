"use client";

import { useState } from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// 1. Definisi URL untuk masing-masing layer peta
const MAP_LAYERS = {
  leaflet: {
    name: "Peta Leaflet (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    name: "Google Map Satelit",
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
  deforestation: {
    name: "Deforestation Map",
    // URL tile Global Forest Watch (WRI). Sesuaikan jika dosen memberikan endpoint API khusus
    url: "https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.8/annual_tree_cover_loss/2022/{z}/{x}/{y}.png",
    attribution: '&copy; Global Forest Watch',
  },
};

export default function ManagePolygonPage() {
  const [activeLayer, setActiveLayer] = useState("leaflet");
  // const [existingPolygon, setExistingPolygon] = useState(null); // State untuk load polygon lama jika ada

  // Fungsi saat polygon selesai dibuat
    const handleCreated = (e: any) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();
    console.log("Koordinat Polygon Baru:", geojson.geometry.coordinates);
    
    // TODO: Panggil fungsi save ke backend (POST/PUT) di sini...
    // Setelah save, jangan lupa redirect: router.push(`/land-polygon?refresh=${Date.now()}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Detail & Draw Polygon Lahan</h2>

      {/* Wrapper relatif untuk memposisikan dropdown di atas peta */}
      <div style={{ position: "relative", width: "100%", height: "600px", border: "1px solid #ccc", borderRadius: 8 }}>
        
        {/* 2. Dropdown Pemilihan Layer Peta */}
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000, 
          background: "white", padding: "8px 12px", borderRadius: 6, 
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)", fontWeight: 600, fontSize: 14
        }}>
          <label>Pilih Layer: </label>
          <select 
            value={activeLayer} 
            onChange={(e) => setActiveLayer(e.target.value)}
            style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: "1px solid #ccc" }}
          >
            {Object.entries(MAP_LAYERS).map(([key, layer]) => (
              <option key={key} value={key}>{layer.name}</option>
            ))}
          </select>
        </div>

        {/* 3. Komponen Peta Leaflet */}
        <MapContainer center={[-2.5, 118]} zoom={5} style={{ height: "100%", width: "100%" }}>
          
          {/* Render TileLayer berdasarkan state activeLayer */}
          {activeLayer === "leaflet" && <TileLayer url={MAP_LAYERS.leaflet.url} attribution={MAP_LAYERS.leaflet.attribution} />}
          {activeLayer === "satellite" && <TileLayer url={MAP_LAYERS.satellite.url} attribution={MAP_LAYERS.satellite.attribution} />}
          {activeLayer === "deforestation" && <TileLayer url={MAP_LAYERS.deforestation.url} attribution={MAP_LAYERS.deforestation.attribution} />}

          {/* 4. Fitur Draw Polygon */}
          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleCreated}
              draw={{
                rectangle: false, circle: false, circlemarker: false, marker: false, polyline: false,
              }}
            />
          </FeatureGroup>

          {/* 5. Tampilkan Polygon Existing (Jika user klik View Detail dari lahan yang sudah ada polygon) */}
          {/* {existingPolygon && (
            <GeoJSON data={existingPolygon} pathOptions={{ color: 'red', fillColor: '#f03', fillOpacity: 0.2 }} />
          )} */}
        </MapContainer>
      </div>
    </div>
  );
}