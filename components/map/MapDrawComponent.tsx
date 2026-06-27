"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, Polygon, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";

// Import CSS Leaflet agar peta tidak berantakan
import "leaflet/dist/leaflet.css";

// Bersihkan konfigurasi icon default Leaflet murni agar tidak bentrok dengan SSR Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface MapDrawComponentProps {
  landId: string | null;
  token: string;
}

type LayerType = "osm" | "satellite" | "deforestation";

const LAYERS: Record<LayerType, { label: string; url: string; attribution: string; icon: string }> = {
  osm: {
    label: "Leaflet Map",
    icon: "🗺️",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: "Google Satellite",
    icon: "🛰️",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
  deforestation: {
    label: "Deforestation",
    icon: "🌲",
    url: "https://tiles.globalforestwatch.org/umd_tree_cover_loss/latest/dynamic/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.globalforestwatch.org">Global Forest Watch</a>',
  },
};

// Helper: MapContainer center/zoom bersifat immutable setelah mount pertama.
// Komponen ini secara imperatif menggeser peta ke koordinat baru.
function FlyToCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapDrawComponent({ landId, token }: MapDrawComponentProps) {
  const [landData, setLandData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // drawnCoords = koordinat yang baru digambar oleh user (belum disave)
  const [drawnCoords, setDrawnCoords] = useState<[number, number][] | null>(null);
  // savedCoords = koordinat polygon yang sudah tersimpan di database
  const [savedCoords, setSavedCoords] = useState<[number, number][] | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [zoom, setZoom] = useState<number>(5);
  const [activeLayer, setActiveLayer] = useState<LayerType>("satellite");

  const featureGroupRef = useRef<any>(null);
  const authHeader = token.startsWith("Bearer") ? token : `Bearer ${token}`;

  // ─── 1. LOAD DATA LAHAN ──────────────────────────────────────────
  const fetchLand = useCallback(async () => {
    if (!landId) return;
    try {
      // PENTING: Endpoint detail di Yii2 REST adalah /land/{id}
      const targetUrl = `/api/proxy/land/${landId}?_t=${Date.now()}`;
      console.log("[MapDraw] GET Detail Lahan:", targetUrl);

      const res = await fetch(targetUrl, {
        method: "GET",
        headers: { "Authorization": authHeader, "Accept": "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      console.log("[MapDraw] Response detail lahan:", result);
      const data = result.data ?? result;

      if (data) {
        setLandData(data);

        if (data.latitude && data.longitude) {
          setMapCenter([parseFloat(data.latitude), parseFloat(data.longitude)]);
          setZoom(16);
        }

        // Parse polygon_path dari API
        if (data.polygon_path && data.polygon_path !== "null" && data.polygon_path !== "[]") {
          try {
            const coords = typeof data.polygon_path === "string"
              ? JSON.parse(data.polygon_path)
              : data.polygon_path;
            if (Array.isArray(coords) && coords.length > 0) {
              setSavedCoords(coords as [number, number][]);
              console.log("[MapDraw] Polygon loaded:", coords.length, "titik");
            }
          } catch (e) {
            console.error("[MapDraw] Gagal parse polygon_path:", e);
          }
        } else {
          setSavedCoords(null);
          console.log("[MapDraw] Lahan ini belum punya polygon");
        }
      }
    } catch (err) {
      console.error("[MapDraw] Error Fetch Lahan:", err);
    } finally {
      setLoading(false);
    }
  }, [landId, authHeader]);

  useEffect(() => {
    fetchLand();
  }, [fetchLand]);

  // ─── 2. DRAW EVENTS ──────────────────────────────────────────────
  const _onCreated = (e: any) => {
    const layer = e.layer;
    const latLngs = layer.getLatLngs()[0];
    const coords = latLngs.map((p: any) => [p.lat, p.lng] as [number, number]);
    setDrawnCoords(coords);
    setSaveMsg(null);
    console.log("[MapDraw] Polygon baru digambar:", coords.length, "titik");
  };

  const _onEdited = (e: any) => {
    e.layers.eachLayer((layer: any) => {
      const latLngs = layer.getLatLngs()[0];
      const coords = latLngs.map((p: any) => [p.lat, p.lng] as [number, number]);
      setDrawnCoords(coords);
      setSaveMsg(null);
    });
  };

  const _onDeleted = () => {
    setDrawnCoords(null);
    setSaveMsg(null);
  };

  // ─── 3. SAVE POLYGON ─────────────────────────────────────────────
  const handleSave = async () => {
    const coordsToSave = drawnCoords || savedCoords;
    if (!coordsToSave || coordsToSave.length === 0) {
      alert("Silakan gambar polygon terlebih dahulu!");
      return;
    }

    setSaving(true);
    setSaveMsg(null);

    const polygonJson = JSON.stringify(coordsToSave);
    const targetUrl = `/api/proxy/land/update-polygon/${landId}`;
    console.log("[MapDraw] Menyimpan polygon:", polygonJson.substring(0, 100), "...");

    // Strategi: Coba urlencoded dulu (lebih reliable melalui proxy), 
    // lalu multipart FormData sebagai fallback
    const attempts = [
      {
        label: "urlencoded",
        headers: { "Authorization": authHeader, "Content-Type": "application/x-www-form-urlencoded" } as Record<string, string>,
        body: new URLSearchParams({ polygon_path: polygonJson }).toString(),
      },
      {
        label: "multipart",
        headers: { "Authorization": authHeader } as Record<string, string>,
        body: (() => { const fd = new FormData(); fd.append("polygon_path", polygonJson); return fd; })(),
      },
    ];

    for (const attempt of attempts) {
      try {
        console.log(`[MapDraw] Trying ${attempt.label}...`);
        const res = await fetch(targetUrl, {
          method: "POST",
          headers: attempt.headers,
          body: attempt.body,
        });

        const responseText = await res.text();
        console.log(`[MapDraw] ${attempt.label} response [${res.status}]:`, responseText.substring(0, 300));

        let result: any;
        try { result = JSON.parse(responseText); } catch { result = { raw: responseText }; }

        // Yii2 bisa mengembalikan berbagai format respons sukses
        const isSuccess = res.ok && (
          result.status === true || 
          result.success === true || 
          result.status === 200 ||
          (typeof result.message === "string" && result.message.toLowerCase().includes("success")) ||
          (typeof result.msg === "string" && result.msg.toLowerCase().includes("success")) ||
          // Jika status 200 dan tidak ada field error, anggap sukses
          (res.status === 200 && !result.name && !result.message?.toLowerCase().includes("error"))
        );

        if (isSuccess) {
          setSaveMsg({ type: "success", text: "✅ Polygon berhasil disimpan ke database!" });
          setSavedCoords(coordsToSave);
          setDrawnCoords(null);

          if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
          }

          // Re-fetch untuk sinkronisasi
          setTimeout(() => fetchLand(), 500);
          setSaving(false);
          return; // Keluar dari loop, berhasil!
        } else {
          console.warn(`[MapDraw] ${attempt.label} failed:`, result);
          // Lanjut ke attempt berikutnya
        }
      } catch (err: any) {
        console.warn(`[MapDraw] ${attempt.label} error:`, err.message);
        // Lanjut ke attempt berikutnya
      }
    }

    // Semua attempt gagal
    setSaveMsg({ type: "error", text: "❌ Gagal menyimpan polygon. Cek konsol browser (F12) untuk detail." });
    setSaving(false);
    return;
  };

  // ─── LOADING STATE ────────────────────────────────────────────────
  if (loading) return <p style={{ padding: 20, textTransform: "uppercase", fontSize: 13, color: "#64748b" }}>Memuat Konten Peta...</p>;

  // Koordinat yang ditampilkan: prioritas drawnCoords (belum disave), lalu savedCoords
  const displayCoords = drawnCoords || savedCoords;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* CSS injection via CDN untuk leaflet.draw */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />

      {/* Header + Layer Switcher */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#1e293b" }}>
            Kelola Polygon Lahan: {landData?.land_name || "Lahan"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            Status: {savedCoords ? `✅ Terpetakan (${savedCoords.length} titik)` : "❌ Belum ada polygon"}
          </p>
        </div>

        {/* Layer Switcher */}
        <div style={{ display: "flex", gap: 6, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
          {(Object.entries(LAYERS) as [LayerType, typeof LAYERS[LayerType]][]).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key)}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: activeLayer === key ? 700 : 500,
                background: activeLayer === key ? "#fff" : "transparent",
                color: activeLayer === key ? "#047857" : "#64748b",
                boxShadow: activeLayer === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              {layer.icon} {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height: "500px", width: "100%", position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Helper component to fly to new center */}
          <FlyToCenter center={mapCenter} zoom={zoom} />

          <TileLayer
            key={activeLayer}
            attribution={LAYERS[activeLayer].attribution}
            url={LAYERS[activeLayer].url}
            maxZoom={20}
          />

          {/* Marker Utama Lahan */}
          {landData?.latitude && landData?.longitude && (
            <Marker position={[parseFloat(landData.latitude), parseFloat(landData.longitude)]}>
              <Popup>
                <strong>{landData.land_name}</strong><br />
                {landData.total_area_hectares} Ha
              </Popup>
            </Marker>
          )}

          {/* Polygon lama yang tersimpan — DI LUAR FeatureGroup agar tidak konflik dengan draw tools */}
          {savedCoords && !drawnCoords && (
            <Polygon
              positions={savedCoords}
              pathOptions={{ color: "#3b82f6", weight: 3, fillOpacity: 0.2, fillColor: "#3b82f6" }}
            />
          )}

          {/* FeatureGroup untuk Draw Tools — HANYA untuk menggambar baru */}
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topleft"
              onCreated={_onCreated}
              onEdited={_onEdited}
              onDeleted={_onDeleted}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  shapeOptions: { color: "#22c55e", fillOpacity: 0.25, weight: 3 },
                },
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>

      {/* Tombol Simpan + Feedback */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 24px",
            backgroundColor: saving ? "#9ca3af" : "#16a34a",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: "8px",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {saving ? "⏳ Menyimpan..." : "💾 Simpan Polygon"}
        </button>

        {saveMsg && (
          <div style={{
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: saveMsg.type === "success" ? "#dcfce7" : "#fef2f2",
            color: saveMsg.type === "success" ? "#166534" : "#991b1b",
            border: `1px solid ${saveMsg.type === "success" ? "#86efac" : "#fca5a5"}`,
          }}>
            {saveMsg.text}
          </div>
        )}
      </div>

      {/* Info Koordinat */}
      {displayCoords && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Koordinat Polygon ({displayCoords.length} titik)</div>
          <pre style={{ fontSize: 11, color: "#64748b", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 100, overflow: "auto" }}>
            {JSON.stringify(displayCoords, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}