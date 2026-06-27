"use client";

import { useEffect, useMemo, useState } from "react";

// ── Helpers & Icons Bawaan Tabel ──────────────────────────────────
function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}

const Ico = {
  Search: () => (
    <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <circle cx="9" cy="9" r="6" /><path d="M15 15l-3-3" strokeLinecap="round" />
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
    </svg>
  ),
  ChevLeft: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevRight: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M4 10a6 6 0 1 1 1.5 4" strokeLinecap="round" />
      <path d="M4 14v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const C = {
  av: { background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff" },
  badge: { background: "#e6f4ea", color: "#065f46", border: "1px solid #a7f3d0" }
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .land-page * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
  .land-card { transition: box-shadow .2s, transform .2s; border: 1px solid #e2e8f0; background: #fff; border-radius: 14px; overflow: hidden; display: flex; flexDirection: column; }
  .land-card:hover { box-shadow: 0 8px 28px rgba(16,185,129,.12); transform: translateY(-2px); }
  .land-tr:hover td { background: #f0fdf4 !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .land-fade { animation: fadeIn .3s ease-out; }
`;

// ✅ MODIFIKASI 1: Tambahkan onDataLoaded di interface
interface LandBaseTableProps {
  title: string;
  subtitle: string;
  icon?: string;
  apiUrl: string;
  extraHeaderControl?: React.ReactNode;
  renderActions: (item: any) => React.ReactNode;
  renderExtraColumnsHeader?: () => React.ReactNode;
  renderExtraColumnsRow?: (item: any) => React.ReactNode;
  renderExtraCardStats?: (item: any) => React.ReactNode;
  onDataLoaded?: (data: any[]) => void; // 👈 TAMBAHKAN INI
}

// ✅ MODIFIKASI 2: Tambahkan onDataLoaded di parameter
export default function LandBaseTable({
  title,
  subtitle,
  icon = "🏡",
  apiUrl,
  extraHeaderControl,
  renderActions,
  renderExtraColumnsHeader,
  renderExtraColumnsRow,
  renderExtraCardStats,
  onDataLoaded // 👈 TAMBAHKAN INI
}: LandBaseTableProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "table">("table");
  const [query, setQuery] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  async function fetchData() {
    setLoading(true); setError(null);
    const t = localStorage.getItem("access_token");
    const tt = localStorage.getItem("token_type") || "Bearer";
    try {
      const url = apiUrl.includes("?") ? `${apiUrl}&_t=${Date.now()}` : `${apiUrl}?_t=${Date.now()}`;
      const res = await fetch(url, {
        headers: { Authorization: `${tt} ${t}`, Accept: "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Terjadi kesalahan saat mengambil data.");
    } finally { setLoading(false); }
  }

  const items: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  // ✅ MODIFIKASI 3: TAMBAHKAN useEffect BARU INI
  // Ini akan memanggil onDataLoaded setiap kali items berubah (setelah data di-fetch)
  useEffect(() => {
    if (onDataLoaded && items.length > 0) {
      console.log(`📤 [LandBaseTable] Memanggil onDataLoaded dengan ${items.length} items`);
      onDataLoaded(items);
    }
  }, [items, onDataLoaded]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      const nameMatch = (it.land_name || "").toLowerCase().includes(q) || (it.farmer_name || "").toLowerCase().includes(q);
      const commodityMatch = commodityFilter ? (it.commodity_name || "").toLowerCase() === commodityFilter.toLowerCase() : true;
      return nameMatch && commodityMatch;
    });
  }, [items, query, commodityFilter]);

  const uniqueCommodities = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if (i.commodity_name) set.add(i.commodity_name); });
    return Array.from(set);
  }, [items]);

  const totalArea = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.total_area_hectares) || 0), 0);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [query, commodityFilter, view]);

  return (
    <div className="land-page" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <style>{CSS}</style>

      {/* ════════════════════ HERO HEADER ════════════════════ */}
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#047857 60%,#10b981 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>{title}</h2>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#a7f3d0" }}>{subtitle}</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Ico.Search />
              <input style={{ paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", fontSize: 13, color: "#fff", width: 220, outline: "none" }}
                placeholder="Cari lahan..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select value={commodityFilter} onChange={e => setCommodityFilter(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", fontSize: 13, color: "#fff", outline: "none", cursor: "pointer" }}>
              <option value="" style={{ color: "#0f172a" }}>Semua Komoditas</option>
              {uniqueCommodities.map(c => <option key={c} value={c} style={{ color: "#0f172a" }}>{c}</option>)}
            </select>
            <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "#e2e8f0", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              <Ico.Refresh /> Refresh
            </button>
            <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)" }}>
              <button onClick={() => setView("cards")} style={{ padding: "9px 13px", border: "none", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, background: view === "cards" ? "#fff" : "transparent", color: view === "cards" ? "#047857" : "#e2e8f0", fontWeight: view === "cards" ? 600 : 400 }}><Ico.Grid /> Kartu</button>
              <button onClick={() => setView("table")} style={{ padding: "9px 13px", border: "none", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, background: view === "table" ? "#fff" : "transparent", color: view === "table" ? "#047857" : "#e2e8f0", fontWeight: view === "table" ? 600 : 400 }}><Ico.List /> Tabel</button>
            </div>
            {extraHeaderControl}
          </div>
        </div>
      </div>

      {/* ════════════════════ STAT CARDS ════════════════════ */}
      {!loading && !error && items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }} className="land-fade">
          <div style={{ background: "linear-gradient(135deg,#064e3b,#047857)", borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase" }}>Total Kavling</div><span>🗺️</span></div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "6px 0 2px" }}>{items.length}</div>
            <div style={{ fontSize: 12, color: "#a7f3d0", fontWeight: 500 }}>Unit Terdata</div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#047857,#10b981)", borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase" }}>Akumulasi Luas</div><span>📐</span></div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "6px 0 2px" }}>{totalArea.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: "#ecfdf5", fontWeight: 500 }}>Hektar (Ha)</div>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && <div style={{ padding: "60px 0", textAlign: "center", color: "#64748b" }}>Memuat data lahan...</div>}
      {error && <div style={{ padding: "20px", color: "#b91c1c" }}>⚠️ {error}</div>}

      {/* ════════════════════ CONTENT AREA ──────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <>
          {view === "cards" ? (
            <div className="land-fade" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
              {pageItems.map((it, idx) => (
                <div key={idx} className="land-card">
                  <div style={{ height: 4, background: "linear-gradient(90deg,#10b981,#047857)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, ...C.av }}>{getInitials(it.land_name)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{it.land_name}</div>
                      <div style={{ fontSize: 12, color: "#059669" }}>🌱 {it.commodity_name || "-"}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", background: "#fafbfc", fontSize: 12 }}>
                    <div>Luas Lahan: <strong>{it.total_area_hectares} Ha</strong></div>
                    {renderExtraCardStats && renderExtraCardStats(it)}
                  </div>
                  <div style={{ display: "flex", gap: 6, padding: "10px 14px" }}>{renderActions(it)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="land-fade" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#064e3b,#047857)" }}>
                    {["#", "Nama Lahan", "Petani", "Komoditas", "Luas"].map(h => (
                      <th key={h} style={{ padding: "13px 14px", textAlign: "left", color: "#a7f3d0", textTransform: "uppercase", fontSize: 11 }}>{h}</th>
                    ))}
                    {renderExtraColumnsHeader && renderExtraColumnsHeader()}
                    <th style={{ padding: "13px 14px", textAlign: "left", color: "#a7f3d0", textTransform: "uppercase", fontSize: 11 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((it, i) => (
                    <tr key={i} className="land-tr" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px" }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{it.land_name}</td>
                      <td style={{ padding: "12px 14px" }}>{it.farmer_name || "-"}</td>
                      <td style={{ padding: "12px 14px" }}><span style={{ padding: "4px 10px", borderRadius: 20, ...C.badge }}>🌱 {it.commodity_name || "-"}</span></td>
                      <td style={{ padding: "12px 14px", color: "#047857", fontWeight: 700 }}>{it.total_area_hectares} Ha</td>
                      {renderExtraColumnsRow && renderExtraColumnsRow(it)}
                      <td style={{ padding: "12px 14px" }}><div style={{ display: "flex", gap: 6 }}>{renderActions(it)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Menampilkan {pageItems.length} dari {filtered.length} lahan</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: 6, borderRadius: 8 }}>◀</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: 6, borderRadius: 8 }}>▶</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}