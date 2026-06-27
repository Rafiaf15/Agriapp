"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react"; // Import Suspense untuk App Router Next.js
import LandBaseTable from "@/components/land/LandBaseTable";

// Helper: robust check apakah lahan sudah punya polygon
function checkHasPolygon(item: any): boolean {
  if (item.has_polygon === 1 || item.has_polygon === true) return true;
  const pp = item.polygon_path;
  if (!pp) return false;
  if (typeof pp === "string") {
    const trimmed = pp.trim();
    if (trimmed === "" || trimmed === "null" || trimmed === "[]" || trimmed === "[[]]") return false;
    return true;
  }
  if (Array.isArray(pp) && pp.length > 0) return true;
  return false;
}

// Pindahkan isi komponen ke dalam fungsi terpisah agar bisa dibungkus Suspense
function LandPolygonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil parameter refresh dari URL. Jika ada, nilainya akan berubah dan memicu remount
const refreshKey = searchParams?.get("refresh") || "initial"; // Tambahkan ?

  const renderPolygonActions = (item: any) => {
    const hasPolygon = checkHasPolygon(item);
    return (
      <div style={{ display: "flex", gap: "6px", width: "100%", flexWrap: "wrap" }}>
        <button
          onClick={() => router.push(`/land-polygon/manage-polygon?id=${item.id}`)}
          style={{ flex: 1, padding: "6px 12px", borderRadius: 6, border: hasPolygon ? "1px solid #bbf7d0" : "1px solid #bbf7d0", background: hasPolygon ? "#f0fdf4" : "#f0fdf4", color: "#16a34a", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
        >
          {hasPolygon ? "✏️ Edit Polygon" : "➕ Add Polygon"}
        </button>
        <button
          onClick={() => router.push(`/due-diligence`)}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #fed7aa", background: "#fff7ed", color: "#ea580c", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
        >
          🇪🇺 Check EUDR
        </button>
        <a
          href={`/land-polygon/manage-polygon?id=${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", color: "#334155", fontSize: 12, textDecoration: "none", fontWeight: 500 }}
        >
          🔗 View Detail
        </a>
      </div>
    );
  };

  const renderPolygonHeader = () => (
    <>
      <th style={{ padding: "13px 14px", textAlign: "left", color: "#a7f3d0", textTransform: "uppercase", fontSize: 11 }}>Status Spasial</th>
      <th style={{ padding: "13px 14px", textAlign: "left", color: "#a7f3d0", textTransform: "uppercase", fontSize: 11 }}>EUDR Compliance</th>
    </>
  );

  
  const renderPolygonRow = (item: any) => {
    const hasPolygon = checkHasPolygon(item);
    const eudrStatus = item.eudr_status || (hasPolygon ? "Verified" : "Non-Compliant");

    return (
      <>
        <td style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12, background: hasPolygon ? "#e0f2fe" : "#fef2f2", color: hasPolygon ? "#0369a1" : "#991b1b" }}>
            {hasPolygon ? "✓ Terpetakan" : "✗ Belum Ada"}
          </span>
        </td>
        <td style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12, background: eudrStatus === "Verified" ? "#dcfce7" : "#fff7ed", color: eudrStatus === "Verified" ? "#15803d" : "#c2410c" }}>
            {eudrStatus === "Verified" ? "🛡️ Verified" : "⚠️ Non-Compliant"}
          </span>
        </td>
      </>
    );
  };

  return (
    <LandBaseTable
      key={refreshKey} // <--- INI KUNCI UTAMA! Jika key berubah, komponen akan me-mount ulang dan fetch data terbaru
      title="Pemetaan Geometris & EUDR Lahan"
      subtitle="Manajemen spasial batas poligon lahan pertanian satelit untuk kepatuhan regulasi EUDR"
      icon="🗺️"
      apiUrl="/api/proxy/land" 
      renderActions={renderPolygonActions}
      renderExtraColumnsHeader={renderPolygonHeader}
      renderExtraColumnsRow={renderPolygonRow}
    />
  );
}

export default function LandPolygonPage() {
  return (
    <Suspense fallback={<div style={{padding: 20}}>Loading data lahan...</div>}>
      <LandPolygonContent />
    </Suspense>
  );
}