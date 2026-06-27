"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Memuat komponen map secara dinamis tanpa SSR agar tidak memicu crash
const LandMap = dynamic(() => import("@/components/map/LandMap"), { 
  ssr: false,
  loading: () => <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b" }}>Memuat Peta Satelit...</div>
});

const IconSave = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M17 3H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V5l-2-2z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 3v5H7V3M7 13h6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  outline: "none",
  color: "#0f172a",
  background: "#fff",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  marginBottom: 6,
};

interface Commodity {
  id: string | number;
  name: string;
}

interface LandFormProps {
  initialData: {
    commodity_id: string | number;
    land_name: string;
    total_area_hectares: string | number;
    latitude: string;
    longitude: string;
    zoom?: number;
  };
  commodities: Commodity[];
  loading: boolean;
  error: string;
  success: string;
  onCancel: () => void;
  onSubmit: (formData: any) => void;
}

export default function LandForm({
  initialData,
  commodities,
  loading,
  error,
  success,
  onCancel,
  onSubmit,
}: LandFormProps) {
  const [data, setData] = useState({ ...initialData });
  const [leafletReady, setLeafletReady] = useState(false);

  // Sinkronisasi data ketika initialData berubah (sangat krusial untuk mode Edit)
  useEffect(() => {
    setData({ ...initialData });
  }, [initialData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
        setLeafletReady(true);
      });
    }
  }, []);

  const set = (key: string, val: any) => setData((d) => ({ ...d, [key]: val }));

  const latNum = parseFloat(data.latitude) || -6.9175;
  const lngNum = parseFloat(data.longitude) || 107.6191;
  const zoomNum = Number(data.zoom) || 14;

  const handleMapClick = (lat: string, lng: string) => {
    setData((d) => ({ ...d, latitude: lat, longitude: lng }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      {/* Alerts */}
      {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
      {success && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, color: "#16a34a", fontSize: 13, marginBottom: 16 }}>✓ {success}</div>}

      {/* Detail Informasi Lahan */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>Detail Informasi Lahan</div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>Tentukan nama lahan dan jenis komoditas yang ditanam</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Nama Lahan <span style={{ color: "#dc2626" }}>*</span></label>
            <input style={inputStyle} value={data.land_name} onChange={(e) => set("land_name", e.target.value)} placeholder="Contoh: Sawah Utara Blok B" />
          </div>

          <div>
            <label style={labelStyle}>Komoditas Tanaman <span style={{ color: "#dc2626" }}>*</span></label>
            <select style={inputStyle} value={String(data.commodity_id)} onChange={(e) => set("commodity_id", e.target.value)}>
              <option value="">Pilih Komoditas</option>
              {commodities.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Total Luas Wilayah (Hektar) <span style={{ color: "#dc2626" }}>*</span></label>
            <input type="number" step="0.01" style={inputStyle} value={data.total_area_hectares} onChange={(e) => set("total_area_hectares", e.target.value)} placeholder="Contoh: 2.5" />
          </div>
        </div>
      </div>

      {/* DATA PETA INTERAKTIF */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>Peta Lokasi Geografis</div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>Silakan klik pada peta satelit atau ketik koordinatnya secara langsung di bawah</p>
        
        <div style={{ height: 380, width: "100%", borderRadius: 8, overflow: "hidden", marginBottom: 16, border: "1px solid #cbd5e1" }}>
          {leafletReady && (
            <LandMap 
              latNum={latNum} 
              lngNum={lngNum} 
              zoomNum={zoomNum} 
              onMapClick={handleMapClick} 
              readOnly={false}
            />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Latitude</label>
            <input style={inputStyle} value={data.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="Masukkan nilai latitude" />
          </div>

          <div>
            <label style={labelStyle}>Longitude</label>
            <input style={inputStyle} value={data.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="Masukkan nilai longitude" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ padding: "10px 20px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 500, color: "#374151", cursor: "pointer" }}>
          Batal
        </button>
        <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, background: loading ? "#6b7280" : "#2563eb", border: "none", color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "default" : "pointer" }}>
          <IconSave/> {loading ? "Menyimpan..." : "Simpan Lahan"}
        </button>
      </div>
    </form>
  );
}