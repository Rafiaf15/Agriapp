"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "/api/proxy/land";
  // 1. Ambil data farmer dari localStorage saat komponen di-load


// ── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}

// ── Icons ──────────────────────────────────────────────────────────
const Ico = {
  Search: () => (
    <svg style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none" }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <circle cx="9" cy="9" r="6"/><path d="M15 15l-3-3" strokeLinecap="round"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
      <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
      <path d="M1 10s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z"/><circle cx="10" cy="10" r="3"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
      <path d="M14 2l4 4-10 10H4v-4L14 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
      <path d="M3 5h14M8 5V3h4v2M6 5v11a1 1 0 001 1h6a1 1 0 001-1V5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
    </svg>
  ),
  ChevLeft: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ChevRight: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
      <path d="M4 10a6 6 0 1 1 1.5 4" strokeLinecap="round"/>
      <path d="M4 14v-4h4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── Theme / Style Configuration ────────────────────────────────────
const C = {
  av: { background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff" },
  badge: { background: "#e6f4ea", color: "#065f46", border: "1px solid #a7f3d0" },
  row: "#f0fdf4"
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .land-page * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
  .land-card { transition: box-shadow .2s, transform .2s; }
  .land-card:hover { box-shadow: 0 8px 28px rgba(16,185,129,.12); transform: translateY(-2px); }
  .land-btn-detail { transition: all .18s; }
  .land-btn-detail:hover { background: #059669 !important; color: #fff !important; border-color: #059669 !important; }
  .land-btn-edit { transition: all .18s; }
  .land-btn-edit:hover { background: #7c3aed !important; color: #fff !important; border-color: #7c3aed !important; }
  .land-btn-del { transition: all .18s; }
  .land-btn-del:hover { background: #dc2626 !important; color: #fff !important; border-color: #dc2626 !important; }
  .land-tr:hover td { background: #f0fdf4 !important; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .land-fade { animation: fadeIn .3s ease-out; }
`;

export default function LandsPage() {
  const router = useRouter();
  const [token, setToken]     = useState("");
  const [tokenType, setTT]    = useState("Bearer");
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [view, setView]       = useState<"cards"|"table">("table");
  const [query, setQuery]     = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  const [farmerData, setFarmerData] = useState<any>({});
  const [isFarmer, setIsFarmer] = useState(false);
  const [page, setPage]       = useState(1);
  const PAGE_SIZE = 10;

  const [delModal, setDelModal]   = useState(false);
  const [delId, setDelId]         = useState<number|null>(null);
  const [delName, setDelName]     = useState("");
  const [delLoading, setDelLoad]  = useState(false);
  const [delError, setDelError]   = useState<string|null>(null);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    const tt = localStorage.getItem("token_type");
    const farmer = JSON.parse(localStorage.getItem("farmer") || "{}");
    const isF = localStorage.getItem("is_farmer") === "1";
    setToken(t || "");
    if (tt) setTT(tt);
    setFarmerData(farmer);
    setIsFarmer(isF);
    fetchData(t || "", tt || "Bearer");
  }, []);

  async function fetchData(t: string, tt: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization:`${tt} ${t}`, Accept:"application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Terjadi kesalahan saat mengambil data.");
    } finally { setLoading(false); }
  }

  async function doDelete(id: number) {
    setDelLoad(true); setDelError(null);
    try {
      // 1. Sesuaikan URL dengan pola delete di Yii2 Anda (/land/delete/ID)
      const res = await fetch(`/api/proxy/land/delete/${id}`, {
        method: "POST", 
        headers: { 
          Authorization: `${tokenType} ${token}`, 
          Accept: "application/json",
          // 2. Tambahkan header Content-Type agar proxy tidak bingung
          "Content-Type": "application/x-www-form-urlencoded" 
        },
        // 3. Tambahkan bodi kosong yang valid supaya proxy Next.js tidak crash
        body: new URLSearchParams().toString()
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      setSuccessMsg("✓ Lahan berhasil dihapus");
      setDelModal(false); setDelId(null);
      await fetchData(token, tokenType);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setDelError(e?.message || "Gagal menghapus data lahan");
    } finally { setDelLoad(false); }
  }

  const items: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      const nameMatch = (it.land_name || "").toLowerCase().includes(q) || (it.farmer_name || "").toLowerCase().includes(q);
      const commodityMatch = commodityFilter ? (it.commodity_name || "").toLowerCase() === commodityFilter.toLowerCase() : true;
      return nameMatch && commodityMatch;
    });
  }, [items, query, commodityFilter]);

  // Unique list of commodities for filtering dropdown
  const uniqueCommodities = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => { if(i.commodity_name) set.add(i.commodity_name); });
    return Array.from(set);
  }, [items]);

  // Stats computation
  const totalArea = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.total_area_hectares) || 0), 0);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  useEffect(() => setPage(1), [query, commodityFilter, view]);

  const openDel = (it: any) => { setDelId(it.id); setDelName(it.land_name || "Lahan"); setDelError(null); setDelModal(true); };

  return (
    <div className="land-page" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <style>{CSS}</style>

      {/* ════════════════════ DELETE MODAL ════════════════════ */}
      {delModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}
          onClick={() => { if (!delLoading) setDelModal(false); }}>
          <div className="land-fade" style={{ background:"#fff", width:"92%", maxWidth:420, borderRadius:16, overflow:"hidden", boxShadow:"0 24px 80px rgba(15,23,42,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background:"linear-gradient(135deg,#dc2626,#b91c1c)", padding:"20px 24px", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🗑️</div>
              <div>
                <div style={{ color:"#fff", fontWeight:700, fontSize:16 }}>Hapus Data Lahan</div>
                <div style={{ color:"#fca5a5", fontSize:12, marginTop:2 }}>Tindakan tidak dapat dibatalkan</div>
              </div>
            </div>
            <div style={{ padding:"20px 24px" }}>
              <p style={{ fontSize:14, color:"#374151", margin:"0 0 6px 0", lineHeight:1.6 }}>Anda akan menghapus data lahan:</p>
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
                <div style={{ fontWeight:700, color:"#0f172a", fontSize:15 }}>🏡 {delName}</div>
              </div>
              {delError && (
                <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", marginBottom:12, color:"#b91c1c", fontSize:13 }}>
                  ⚠️ {delError}
                </div>
              )}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button onClick={() => setDelModal(false)} disabled={delLoading}
                  style={{ padding:"10px 20px", borderRadius:8, background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:14, cursor:"pointer", fontWeight:500, color:"#374151" }}>
                  Batal
                </button>
                <button onClick={() => delId && doDelete(delId)} disabled={delLoading}
                  style={{ padding:"10px 20px", borderRadius:8, background: delLoading?"#94a3b8":"#dc2626", border:"none", color:"#fff", fontSize:14, cursor: delLoading?"default":"pointer", fontWeight:600 }}>
                  {delLoading ? "Menghapus..." : "Ya, Hapus!"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ HERO HEADER ════════════════════ */}
      <div style={{ background:"linear-gradient(135deg,#064e3b 0%,#047857 60%,#10b981 100%)", borderRadius:16, padding:"28px 32px", marginBottom:24, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
        <div style={{ position:"absolute", bottom:-60, right:80, width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }}/>
        
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🏡</div>
              <div>
                <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#fff", letterSpacing:"-0.3px" }}>Data Lahan</h2>
                <p style={{ margin:"2px 0 0", fontSize:13, color:"#a7f3d0" }}>Manajemen dan monitoring aset lahan pertanian</p>
              </div>
            </div>
            {!loading && !error && (
              <div style={{ display:"flex", gap:16, marginTop:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.1)", borderRadius:20, padding:"4px 12px" }}>
                  <span style={{ fontSize:12, color:"#e0f2fe", fontWeight:500 }}>{items.length} Lahan Terdaftar</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <div style={{ position:"relative" }}>
              <Ico.Search/>
              <input style={{ paddingLeft:36, paddingRight:14, paddingTop:9, paddingBottom:9, borderRadius:9, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", fontSize:13, color:"#fff", width:220, outline:"none" }}
                placeholder="Cari lahan atau petani..." value={query} onChange={e => setQuery(e.target.value)}/>
            </div>
            <select value={commodityFilter} onChange={e => setCommodityFilter(e.target.value)}
              style={{ padding:"9px 12px", borderRadius:9, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", fontSize:13, color:"#fff", outline:"none", cursor:"pointer" }}>
              <option value="" style={{ color:"#0f172a" }}>Semua Komoditas</option>
              {uniqueCommodities.map(c => (
                <option key={c} value={c} style={{ color:"#0f172a" }}>{c}</option>
              ))}
            </select>
            <button onClick={() => fetchData(token, tokenType)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 13px", borderRadius:9, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", color:"#e2e8f0", fontSize:13, cursor:"pointer", fontWeight:500 }}>
              <Ico.Refresh/> Refresh
            </button>
            <div style={{ display:"flex", borderRadius:9, overflow:"hidden", border:"1px solid rgba(255,255,255,0.2)" }}>
              <button onClick={() => setView("cards")}
                style={{ padding:"9px 13px", border:"none", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:5, background: view==="cards"?"#fff":"transparent", color: view==="cards"?"#047857":"#e2e8f0", fontWeight: view==="cards"?600:400 }}>
                <Ico.Grid/> Kartu
              </button>
              <button onClick={() => setView("table")}
                style={{ padding:"9px 13px", border:"none", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:5, background: view==="table"?"#fff":"transparent", color: view==="table"?"#047857":"#e2e8f0", fontWeight: view==="table"?600:400 }}>
                <Ico.List/> Tabel
              </button>
            </div>
            <button onClick={() => router.push("/lands/create")}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#34d399,#059669)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(5,150,105,0.4)" }}>
              <Ico.Plus/> Tambah Lahan
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════ STAT CARDS ════════════════════ */}
      {!loading && !error && items.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16, marginBottom:20 }} className="land-fade">
          {[
            { label:"Total Kavling Lahan", val:items.length, sub:"Unit Terdata", icon:"🗺️", grad:"linear-gradient(135deg,#064e3b,#047857)", sub2:"#a7f3d0" },
            { label:"Akumulasi Luas", val:`${totalArea.toFixed(2)}`, sub:"Hektar (Ha)", icon:"📐", grad:"linear-gradient(135deg,#047857,#10b981)", sub2:"#ecfdf5" },
            { label:"Variasi Komoditas", val:uniqueCommodities.length, sub:"Jenis Tanaman Aktif", icon:"🌱", grad:"linear-gradient(135deg,#0f172a,#1e293b)", sub2:"#94a3b8" },
          ].map((s, i) => (
            <div key={i} style={{ background:s.grad, borderRadius:14, padding:"20px 22px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:90, height:90, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
              <div style={{ position:"relative" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>{s.label}</div>
                  <span style={{ fontSize:22 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize:36, fontWeight:800, color:"#fff", margin:"6px 0 2px", lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:12, color:s.sub2, fontWeight:500 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════ SUCCESS BANNER ════════════════════ */}
      {successMsg && (
        <div className="land-fade" style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #86efac", borderRadius:10, color:"#15803d", fontSize:13, fontWeight:600, marginBottom:16 }}>
          <span style={{ fontSize:18 }}>✅</span> {successMsg}
        </div>
      )}

      {/* ════════════════════ LOADING STATE ════════════════════ */}
      {loading && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"60px 0", color:"#64748b" }}>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#047857,#34d399)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg style={{ animation:"spin .8s linear infinite" }} viewBox="0 0 24 24" fill="none" width="28" height="28">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#374151" }}>Memuat data lahan...</div>
            <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>Mengambil data dari server</div>
          </div>
        </div>
      )}

      {/* ════════════════════ ERROR STATE ════════════════════ */}
      {error && (
        <div style={{ background:"linear-gradient(135deg,#fef2f2,#fff5f5)", border:"1px solid #fca5a5", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>⚠️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, color:"#991b1b", fontSize:14 }}>Gagal memuat data</div>
            <div style={{ fontSize:13, color:"#b91c1c", marginTop:2 }}>{error}</div>
          </div>
          <button onClick={() => fetchData(token, tokenType)}
            style={{ padding:"8px 16px", borderRadius:8, background:"#dc2626", border:"none", color:"#fff", fontSize:13, cursor:"pointer", fontWeight:600 }}>
            Coba lagi
          </button>
        </div>
      )}

      {/* ════════════════════ CONTENT AREA ════════════════════ */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"80px 0", color:"#9ca3af" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#f1f5f9,#e2e8f0)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>🗺️</div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:600, color:"#374151" }}>Tidak ada lahan ditemukan</div>
                <div style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>Coba ubah kata kunci pencarian atau filter komoditas</div>
              </div>
            </div>
          ) : (
            <>
              {/* ── CARDS VIEW ── */}
              {view === "cards" && (
                <div className="land-fade" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
                  {pageItems.map((it:any, idx:number) => (
                    <div key={idx} className="land-card" style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                      <div style={{ height:4, background: "linear-gradient(90deg,#10b981,#047857)" }}/>
                      
                      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:"1px solid #f1f5f9" }}>
                        <div style={{ width:46, height:46, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0, boxShadow:"0 3px 10px rgba(0,0,0,0.1)", ...C.av }}>
                          {getInitials(it.land_name)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.land_name}</div>
                          <div style={{ fontSize:12, color:"#059669", fontWeight:600, marginTop:2 }}>🌱 {it.commodity_name || it.commodity_id || "-"}</div>
                        </div>
                      </div>

                      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:7, flex:1, background:"#fafbfc" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                          <span style={{ color:"#94a3b8", fontWeight:500 }}>Petani Pengelola</span>
                          <span style={{ color:"#374151", fontWeight:600 }}>{it.farmer_name || it.farmer_id || "-"}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                          <span style={{ color:"#94a3b8", fontWeight:500 }}>Luas Lahan</span>
                          <span style={{ color:"#047857", fontWeight:700 }}>{it.total_area_hectares} Ha</span>
                        </div>
                      </div>

                      <div style={{ display:"flex", gap:6, padding:"10px 14px", borderTop:"1px solid #f1f5f9", background:"#fff" }}>
                        <button className="land-btn-detail" onClick={() => router.push(`/lands/${it.id}`)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px 0", borderRadius:8, border:"1px solid #a7f3d0", background:"#edfdf5", color:"#047857", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                          <Ico.Eye/> Detail
                        </button>
                        <button className="land-btn-edit" onClick={() => router.push(`/lands/${it.id}/edit`)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px 0", borderRadius:8, border:"1px solid #ddd6fe", background:"#f5f3ff", color:"#7c3aed", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                          <Ico.Edit/> Edit
                        </button>
                        <button className="land-btn-del" onClick={() => openDel(it)}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px 0", borderRadius:8, border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                          <Ico.Trash/> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TABLE VIEW ── */}
              {view === "table" && (
                <div className="land-fade" style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"linear-gradient(135deg,#064e3b,#047857)" }}>
                        {["#","Nama Lahan","Petani","Komoditas","Luas","Aksi"].map(h => (
                          <th key={h} style={{ padding:"13px 14px", textAlign:"left", fontWeight:600, fontSize:11, color:"#a7f3d0", letterSpacing:"0.5px", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((it:any, i:number) => (
                        <tr key={i} className="land-tr" style={{ borderBottom:"1px solid #f1f5f9" }}>
                          <td style={{ padding:"12px 14px", color:"#94a3b8", fontWeight:500, fontSize:12 }}>{(page-1)*PAGE_SIZE+i+1}</td>
                          <td style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, flexShrink:0, boxShadow:"0 2px 6px rgba(0,0,0,0.08)", ...C.av }}>
                                {getInitials(it.land_name)}
                              </div>
                              <span style={{ fontWeight:600, color:"#0f172a" }}>{it.land_name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px 14px", color:"#374151", fontWeight:500 }}>{it.farmer_name || it.farmer_id || "-"}</td>
                          <td style={{ padding:"12px 14px" }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, ...C.badge }}>
                              🌱 {it.commodity_name || it.commodity_id || "-"}
                            </span>
                          </td>
                          <td style={{ padding:"12px 14px", color:"#047857", fontWeight:700 }}>{it.total_area_hectares} Ha</td>
                          <td style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", gap:6 }}>
                              <button className="land-btn-detail" onClick={() => router.push(`/lands/${it.id}`)}
                                style={{ border:"1px solid #bfdbfe", background:"#eff6ff", color:"#1d4ed8", padding:"5px 8px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center" }} title="Detail">
                                <Ico.Eye/>
                              </button>
                              <button className="land-btn-edit" onClick={() => router.push(`/lands/${it.id}/edit`)}
                                style={{ border:"1px solid #ddd6fe", background:"#f5f3ff", color:"#7c3aed", padding:"5px 8px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center" }} title="Edit">
                                <Ico.Edit/>
                              </button>
                              <button className="land-btn-del" onClick={() => openDel(it)}
                                style={{ border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", padding:"5px 8px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center" }} title="Hapus">
                                <Ico.Trash/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── PAGINATION ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"between", marginTop:20, flexWrap:"wrap", gap:12 }}>
                <div style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>
                  Menampilkan <span style={{ color:"#0f172a", fontWeight:700 }}>{pageItems.length}</span> dari <span style={{ color:"#0f172a", fontWeight:700 }}>{filtered.length}</span> data lahan
                </div>
                <div style={{ display:"flex", alignItems: "center", gap:4 }}>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    style={{ border:"1px solid #e2e8f0", background: page===1?"#f1f5f9":"#fff", color: page===1?"#94a3b8":"#374151", padding:8, borderRadius:8, cursor: page===1?"default":"pointer", display:"flex", alignItems:"center" }}>
                    <Ico.ChevLeft/>
                  </button>
                  {Array.from({ length:totalPages }).map((_,idx) => (
                    <button key={idx} onClick={() => setPage(idx+1)}
                      style={{ border: page===(idx+1)?"none":"1px solid #e2e8f0", background: page===(idx+1)?"#047857":"#fff", color: page===(idx+1)?"#fff":"#374151", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                      {idx+1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                    style={{ border:"1px solid #e2e8f0", background: page===totalPages?"#f1f5f9":"#fff", color: page===totalPages?"#94a3b8":"#374151", padding:8, borderRadius:8, cursor: page===totalPages?"default":"pointer", display:"flex", alignItems:"center" }}>
                    <Ico.ChevRight/>
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}