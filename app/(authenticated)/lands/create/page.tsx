"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LandForm from "@/components/land/LandForm";

const IconLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
    <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const INITIAL_FORM = {
  commodity_id: "",
  land_name: "",
  total_area_hectares: "",
  latitude: "-6.9175", // Default Bandung Raya
  longitude: "107.6191",
  zoom: 14, 
};

interface Commodity {
  id: string | number;
  name: string;
}

export default function CreateLandPage() {
  const router = useRouter();
  
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchCommodities();
  }, [router]);

  async function fetchCommodities() {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";
    try {
      const res = await fetch("/api/proxy/commodity", {
        headers: { Authorization: `${tokenType} ${token}` }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setCommodities(resData.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data komoditas", err);
    }
  }

  async function handleFormSubmit(submittedData: any) {
    setError(""); 
    setSuccess("");

    if (!submittedData.land_name.trim()) { setError("Nama Lahan wajib diisi."); return; }
    if (!submittedData.commodity_id) { setError("Silakan pilih Komoditas tanaman."); return; }
    if (!submittedData.total_area_hectares.trim()) { setError("Total Luas Area wajib diisi."); return; }

    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";
    
    setLoading(true);
    try {
      const form = new URLSearchParams();
      Object.entries(submittedData).forEach(([k, v]) => {
        if (v) form.append(k, String(v));
      });

      const res = await fetch("/api/proxy/land/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded", 
          Authorization: `${tokenType} ${token}` 
        },
        body: form.toString(),
      });

      const resData = await res.json().catch(() => ({}));
      
      if (!res.ok || resData.status === false) { 
        setError(resData.msg || resData.message || `HTTP ${res.status}`); 
        return; 
      }

      setSuccess("Data lahan pertanian berhasil disimpan!");
      setTimeout(() => router.push("/lands"), 1200);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={() => router.push("/lands")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#374151", cursor: "pointer" }}>
            <IconLeft/> Kembali
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Tambah Lahan Baru</h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b" }}>Daftarkan wilayah pertanian baru dengan titik koordinat presisi</p>
          </div>
        </div>
      </div>

      {/* Panggil Komponen Form Utama */}
      <LandForm
        initialData={INITIAL_FORM}
        commodities={commodities}
        loading={loading}
        error={error}
        success={success}
        onCancel={() => router.push("/lands")}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}