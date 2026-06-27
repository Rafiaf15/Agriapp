"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// 1. Load MapDrawComponent secara dinamis hanya di Client-Side (Bypass SSR)
// Ini mutlak diperlukan untuk menyelesaikan error 'iconUrl not set' dan '_leaflet_events'
const MapDrawComponent = dynamic(
  () => import("@/components/map/MapDrawComponent"),
  { 
    ssr: false,
    loading: () => <p style={{ padding: 20, color: "#64748b", fontSize: 13, textTransform: "uppercase" }}>Menyiapkan Modul Peta...</p>
  }
);

export default function LandsPage() {
  const [token, setToken] = useState<string>("");
  const [farmerData, setFarmerData] = useState<any>({});
  const [isFarmer, setIsFarmer] = useState<boolean>(false);
  const [landId, setLandId] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  // 2. Isolasi pembacaan localStorage dan URL Parameter di dalam useEffect murni client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Ambil token akses
      const storedToken = localStorage.getItem("access_token") || "";
      setToken(storedToken);

      // Ambil data petani
      const storedFarmer = localStorage.getItem("farmer");
      if (storedFarmer) {
        try {
          setFarmerData(JSON.parse(storedFarmer));
        } catch (e) {
          console.error("Gagal parse data farmer dari localStorage", e);
        }
      }

      // Cek status role petani
      setIsFarmer(localStorage.getItem("is_farmer") === "1");

      // Mengambil parameter 'id' dari URL murni di browser
      const urlParams = new URLSearchParams(window.location.search);
      setLandId(urlParams.get("id"));
      
      // Tandai bahwa komponen telah sukses melewati fase hydration client-side
      setMounted(true);
    }
  }, []);

  // Jika aplikasi belum mounted ke client browser, jangan render apa-apa untuk cegah konflik SSR
  if (!mounted) {
    return <p style={{ padding: 24, color: "#64748b" }}>Memuat halaman...</p>;
  }

  // Jika parameter id lahan tidak ada di URL, tampilkan pesan warning
  if (!landId) {
    return (
      <div style={{ padding: "24px", color: "#ef4444", fontWeight: "600" }}>
        ⚠️ ID Lahan tidak ditemukan pada URL parameter. Silakan kembali ke menu daftar lahan.
      </div>
    );
  }

  return (
    <div 
      style={{ 
        background: "#fff", 
        border: "1px solid #e2e8f0", 
        borderRadius: "12px", 
        padding: "24px",
        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
      }}
    >
      {/* Komponen Peta dipanggil dengan melemparkan properti landId dan token hasil ekstraksi client-side */}
      <MapDrawComponent 
        landId={landId} 
        token={token} 
      />
    </div>
  );
}