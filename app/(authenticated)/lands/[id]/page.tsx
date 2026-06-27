"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Memuat komponen map secara dinamis tanpa SSR agar tidak memicu crash
const LandMap = dynamic(() => import("@/components/map/LandMap"), { 
  ssr: false,
  loading: () => <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b" }}>Memuat Peta Lokasi...</div>
});

const IconLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
    <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M3 6h14M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2m3 0v11a2 2 0 01-2 2H7a2 2 0 01-2-2V6h10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 11v4M12 11v4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "#64748b",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const valueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "#0f172a",
  margin: 0,
};

const boxInfoStyle: React.CSSProperties = {
  padding: "12px 16px",
  background: "#f8fafc",
  borderRadius: 8,
  border: "1px solid #f1f5f9",
};

interface Commodity {
  id: string | number;
  name: string;
}

export default function DetailLandPage() {
  const params = useParams();
const id = params?.id ? String(params.id) : "";
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [commodities, setCommodities] = useState<Commodity[]>([]); // Menyimpan master data komoditas untuk lookup
  const [loading, setLoading] = useState(true);
  const [delLoading, setDelLoading] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const tokenType = localStorage.getItem("token_type") || "Bearer";

    // Jalankan fetch data Lahan dan master data Komoditas secara paralel (bersamaan) agar cepat
    Promise.all([
      fetch(`/api/proxy/land/view/${id}`, { headers: { Authorization: `${tokenType} ${token}` } }).then(r => r.json()),
      fetch("/api/proxy/commodity", { headers: { Authorization: `${tokenType} ${token}` } }).then(r => r.json()).catch(() => ({ data: [] }))
    ])
      .then(([landRes, commodityRes]) => {
        if (landRes.status && landRes.data) {
          setData(landRes.data);
        } else {
          alert(landRes.msg || "Gagal memuat data lahan");
        }

        if (commodityRes.success && commodityRes.data) {
          setCommodities(commodityRes.data);
        }
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));

    // Siapkan asset marker Leaflet di client-side
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
  }, [id, router]);

  // Fungsi internal untuk me-lookup ID ke Nama Komoditas secara presisi
  function getCommodityName() {
    // 1. Cek dulu apakah API Yii2 Anda sebenarnya sudah menyertakan relasi objeknya (misal: data.commodity.name)
    if (data?.commodity?.name) {
      return data.commodity.name;
    }

    // 2. Jika tidak ada, lakukan pencarian manual (lookup) ke dalam master state `commodities`
    const found = commodities.find(c => String(c.id) === String(data?.commodity_id));
    return found ? found.name : `ID Komoditas: ${data?.commodity_id}`;
  }

  async function handleDelete() {
    if (!confirm("Apakah Anda yakin ingin menghapus data lahan ini secara permanen?")) return;

    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";
    
    setDelLoading(true);
    try {
      const res = await fetch(`/api/proxy/land/delete/${id}`, {
        method: "POST",
        headers: { 
          Authorization: `${tokenType} ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams().toString()
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push("/lands");
    } catch (err) {
      alert("Gagal menghapus data lahan");
      console.error(err);
    } finally {
      setDelLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "50vh", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#64748b" }}>
        Memuat detail data lahan...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#dc2626" }}>
        ⚠️ Data lahan tidak ditemukan atau Anda tidak memiliki akses.
      </div>
    );
  }

  const latNum = parseFloat(data.latitude) || -6.9175;
  const lngNum = parseFloat(data.longitude) || 107.6191;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={() => router.push("/lands")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#374151", cursor: "pointer" }}>
            <IconLeft/> Kembali
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{data.land_name || "Detail Lahan"}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b" }}>Manajemen data spasial dan komoditas perkebunan</p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => router.push(`/lands/${id}/edit`)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 500, color: "#334155", cursor: "pointer" }}>
            <IconEdit/> Edit Lahan
          </button>
          <button type="button" onClick={handleDelete} disabled={delLoading} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "#ef4444", fontSize: 13, fontWeight: 500, color: "#fff", cursor: delLoading ? "default" : "pointer" }}>
            <IconTrash/> {delLoading ? "Menympan..." : "Hapus"}
          </button>
        </div>
      </div>

      {/* Detail Informasi Lahan Card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>Informasi Utama</div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>Data komoditas tanaman beserta total luas area lahan</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          
          <div style={{ gridColumn: "1/-1", ...boxInfoStyle }}>
            <label style={labelStyle}>Nama Wilayah Lahan</label>
            <p style={valueStyle}>{data.land_name || "-"}</p>
          </div>

          {/* 🔥 Di sini letak perubahannya, memanggil fungsi getCommodityName() */}
          <div style={boxInfoStyle}>
            <label style={labelStyle}>Komoditas Tanaman</label>
            <p style={{ ...valueStyle, color: "#16a34a" }}>{getCommodityName()}</p>
          </div>

          <div style={boxInfoStyle}>
            <label style={labelStyle}>Total Luas Wilayah</label>
            <p style={valueStyle}>{data.total_area_hectares ? `${data.total_area_hectares} Hektar` : "-"}</p>
          </div>

        </div>
      </div>

      {/* Peta Lokasi Geografis Card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>Peta Citra Satelit Lokasi</div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>Lokasi lahan aktual yang ditandai dengan pin titik koordinat</p>
        
        <div style={{ height: 400, width: "100%", borderRadius: 8, overflow: "hidden", marginBottom: 20, border: "1px solid #cbd5e1" }}>
          {leafletReady && (
            <LandMap 
              latNum={latNum} 
              lngNum={lngNum} 
              zoomNum={15} 
              readOnly={true} 
            />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={boxInfoStyle}>
            <label style={labelStyle}>Garis Lintang (Latitude)</label>
            <p style={{ ...valueStyle, fontFamily: "monospace" }}>{data.latitude || "-"}</p>
          </div>

          <div style={boxInfoStyle}>
            <label style={labelStyle}>Garis Bujur (Longitude)</label>
            <p style={{ ...valueStyle, fontFamily: "monospace" }}>{data.longitude || "-"}</p>
          </div>
        </div>
      </div>

    </div>
  );
}