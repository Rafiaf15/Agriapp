"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const LAND_API = "/api/proxy/land";
const CYCLE_API = "/api/proxy/cycle-planting";
const DOC_API = "/api/proxy/land-document";

type Cycle = {
  id: number;
  land_id: number;
  commodity_id: number;
  cycle_name: string;
  start_date: string;
  predicited_end_date: string;
  actual_end_date?: string;
  status: "active" | "completed";
};

type Document = {
  id: number;
  document_name: string;
  issue_date: string;
  file_url?: string;
};

export default function DocumentTracingPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tokenType, setTokenType] = useState("Bearer");

  const [lands, setLands] = useState<any[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>("");

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Document Tracing | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    const t = localStorage.getItem("access_token") || "";
    const tt = localStorage.getItem("token_type") || "Bearer";
    if (!t) { router.push("/login"); return; }
    setToken(t); setTokenType(tt);
    fetchLands(t, tt);
  }, []);

  async function fetchLands(t: string, tt: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(LAND_API, { headers: { Authorization: `${tt} ${t}`, Accept: "application/json" } });
      if (!res.ok) throw new Error("Gagal mengambil data lahan.");
      const json = await res.json();
      const landList = Array.isArray(json) ? json : json.data || [];
      setLands(landList);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLandSelect(landId: string) {
    setSelectedLandId(landId);
    setSelectedCycleId(""); // Reset cycle selection
    if (!landId) {
      setCycles([]);
      setDocuments([]);
      return;
    }

    setFetchLoading(true);
    try {
      // Fetch Cycles
      const resCycle = await fetch(`${CYCLE_API}/index?land_id=${landId}`, {
        headers: { Authorization: `${tokenType} ${token}` }
      });
      const jsonCycle = await resCycle.json();
      const cycleList = Array.isArray(jsonCycle) ? jsonCycle : jsonCycle.data || [];
      setCycles(cycleList);

      // Fetch Documents
      const resDoc = await fetch(`${DOC_API}/index?land_id=${landId}`, {
        headers: { Authorization: `${tokenType} ${token}` }
      });
      const jsonDoc = await resDoc.json();
      const docList = Array.isArray(jsonDoc) ? jsonDoc : jsonDoc.data || [];
      setDocuments(docList);
    } catch (e: any) {
      console.error(e);
      alert("Gagal menarik data untuk tracing lahan ini.");
    } finally {
      setFetchLoading(false);
    }
  }

  const activeLand = useMemo(() => lands.find(l => l.id.toString() === selectedLandId), [lands, selectedLandId]);
  const activeCycle = useMemo(() => cycles.find(c => c.id.toString() === selectedCycleId), [cycles, selectedCycleId]);
  
  // Hanya tampilkan siklus yang sudah selesai (panen) untuk di trace ekspor
  const completedCycles = cycles.filter(c => c.status === "completed");

  const hasPolygon = activeLand && activeLand.polygon_path && activeLand.polygon_path !== "null" && activeLand.polygon_path.trim() !== "";
  
  // Simulasi ID Tracing EUDR
  const tracingID = activeCycle ? `EUDR-${activeLand.id}-${activeCycle.id}-${new Date(activeCycle.actual_end_date || activeCycle.start_date).getTime().toString().slice(-6)}` : "";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 40 }}>📄</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>Tracing Hasil Panen (EUDR)</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>Kumpulkan data asal-usul produk, poligon, dan dokumen untuk syarat ekspor Eropa.</p>
        </div>
      </div>

      {loading && <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>⏳ Memuat data...</div>}
      {error && <div style={{ background: "#fef2f2", padding: 16, borderRadius: 8, color: "#b91c1c" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Panel Pilihan */}
          <div style={{ flex: "1 1 300px", background: "#fff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 15, color: "#0f172a" }}>Opsi Laporan Tracing</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>1. Pilih Lahan Pertanian</label>
              <select value={selectedLandId} onChange={e => handleLandSelect(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}>
                <option value="">-- Pilih Lahan --</option>
                {lands.map(l => <option key={l.id} value={l.id}>{l.land_name} ({l.total_area_hectares} Ha)</option>)}
              </select>
            </div>

            {selectedLandId && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>2. Pilih Siklus Panen (Selesai)</label>
                {fetchLoading ? (
                  <div style={{ fontSize: 13, color: "#64748b" }}>⏳ Menarik data siklus...</div>
                ) : completedCycles.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", padding: "10px", borderRadius: 8 }}>⚠️ Belum ada siklus yang dipanen di lahan ini.</div>
                ) : (
                  <select value={selectedCycleId} onChange={e => setSelectedCycleId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}>
                    <option value="">-- Pilih Hasil Panen --</option>
                    {completedCycles.map(c => <option key={c.id} value={c.id}>{c.cycle_name} (Panen: {c.actual_end_date})</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Dokumen Tracing View */}
          {activeLand && activeCycle && (
            <div style={{ flex: "2 1 500px", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
              {/* Header Dokumen */}
              <div style={{ borderBottom: "2px solid #0f172a", padding: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "1px", textTransform: "uppercase" }}>Certificate of Origin & Traceability</div>
                  <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Harvest Trace Report</h1>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Tracing ID</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{tracingID}</div>
                </div>
              </div>

              <div style={{ padding: 24 }}>
                
                {/* 1. Asal Usul Produk & Polygon */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ background: "#0f172a", color: "#fff", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 12, fontWeight: 700 }}>1</span>
                    <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Asal-usul Lahan & EUDR Compliance</h3>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Nama Lahan</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{activeLand.land_name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Luas Area</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{activeLand.total_area_hectares} Hektar</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Koordinat Titik</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{activeLand.latitude}, {activeLand.longitude}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Status Pemetaan Polygon</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: hasPolygon ? "#15803d" : "#dc2626" }}>
                        {hasPolygon ? "✅ Terpetakan (EUDR Valid)" : "❌ Belum ada Polygon"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Siklus & Aktivitas */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ background: "#0f172a", color: "#fff", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 12, fontWeight: 700 }}>2</span>
                    <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Siklus Penanaman & Log Perawatan</h3>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontWeight: 600 }}>{activeCycle.cycle_name}</span>
                      <span style={{ fontSize: 12, padding: "2px 8px", background: "#dcfce7", color: "#166534", borderRadius: 12, fontWeight: 600 }}>Selesai Dipanen</span>
                    </div>
                    
                    {/* Simulasi Activity Timeline */}
                    <div style={{ position: "relative", paddingLeft: 20, borderLeft: "2px solid #cbd5e1", marginLeft: 8, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: -26, top: 2, width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2px solid #fff" }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Pembibitan & Tanam</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Tercatat: {activeCycle.start_date}</div>
                      </div>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: -26, top: 2, width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2px solid #fff" }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Pemeliharaan & Pemupukan Rutin</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Tercatat: Sepanjang Masa Tanam</div>
                      </div>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: -26, top: 2, width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", border: "2px solid #fff" }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Panen & Pengumpulan Hasil</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Tercatat: {activeCycle.actual_end_date}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Dokumen Pendukung */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ background: "#0f172a", color: "#fff", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 12, fontWeight: 700 }}>3</span>
                    <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>Dokumen Legal & Lampiran</h3>
                  </div>
                  {documents.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", padding: "10px", borderRadius: 8, border: "1px dashed #fca5a5" }}>
                      ⚠️ Lahan ini belum memiliki dokumen pendukung. Transaksi ke Eropa mungkin ditolak!
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {documents.map(doc => (
                        <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 20 }}>📁</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{doc.document_name}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>Terbit: {doc.issue_date}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700, background: "#dcfce7", padding: "2px 8px", borderRadius: 12 }}>Attached</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  🖨️ Cetak / Ekspor Laporan
                </button>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
