"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = "/api/proxy/cycle-planting";

type Cycle = {
  id: number;
  land_id: number;
  land_name?: string;
  commodity_id: number;
  cycle_name: string;
  start_date: string;
  predicited_end_date: string;
  actual_end_date?: string;
  status: "active" | "completed";
};

const STATUS_LABEL: Record<string, string> = {
  active: "🌱 Aktif (Tumbuh)",
  completed: "✅ Selesai (Panen)",
};

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  active:    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  completed: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
};

// Helper: Calculate date offset in days
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function PlantingCyclesPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tokenType, setTokenType] = useState("Bearer");
  const [data, setData] = useState<Cycle[]>([]);
  const [lands, setLands] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQ, setSearchQ] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    land_id: "",
    commodity_id: "",
    cycle_name: "",
    start_date: "",
    predicited_end_date: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Cycle action loading
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    document.title = `Planting Cycles | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    const t = localStorage.getItem("access_token") || "";
    const tt = localStorage.getItem("token_type") || "Bearer";
    if (!t) { router.push("/login"); return; }
    setToken(t); setTokenType(tt);
    fetchInitialData(t, tt);
  }, []);

  async function fetchInitialData(t: string, tt: string) {
    setLoading(true); setError(null);
    try {
      // 1. Fetch Commodities
      const commRes = await fetch("/api/proxy/commodity", { headers: { Authorization: `${tt} ${t}`, Accept: "application/json" } });
      let commList: any[] = [];
      if (commRes.ok) {
        const commJson = await commRes.json();
        commList = Array.isArray(commJson) ? commJson : commJson.data || [];
        setCommodities(commList);
      }

      // 2. Fetch Lands
      const landsRes = await fetch("/api/proxy/land", { headers: { Authorization: `${tt} ${t}`, Accept: "application/json" } });
      if (!landsRes.ok) throw new Error("Gagal mengambil daftar lahan.");
      const landsJson = await landsRes.json();
      const landList = Array.isArray(landsJson) ? landsJson : landsJson.data || [];
      setLands(landList);

      if (landList.length > 0) {
        const defaultLandId = landList[0].id.toString();
        setSelectedLandId(defaultLandId);
        setForm(prev => ({ ...prev, land_id: defaultLandId }));
        // 3. Fetch Cycles for default land
        await fetchCyclesForLand(defaultLandId, t, tt);
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data awal.");
      setLoading(false);
    }
  }

  async function fetchCyclesForLand(landId: string, t: string, tt: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/index?land_id=${landId}`, {
        headers: { Authorization: `${tt} ${t}`, Accept: "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.data || []);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data siklus tanam.");
    } finally { setLoading(false); }
  }

  const handleLandChange = (landId: string) => {
    setSelectedLandId(landId);
    setForm(prev => ({ ...prev, land_id: landId }));
    fetchCyclesForLand(landId, token, tokenType);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.land_id) { setFormError("Pilih lahan terlebih dahulu."); return; }
    if (!form.commodity_id) { setFormError("Pilih komoditas terlebih dahulu."); return; }
    if (!form.cycle_name.trim()) { setFormError("Nama siklus wajib diisi."); return; }
    if (!form.start_date) { setFormError("Tanggal mulai wajib diisi."); return; }
    if (!form.predicited_end_date) { setFormError("Estimasi tanggal panen wajib diisi."); return; }

    setFormLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("land_id", form.land_id);
      body.append("commodity_id", form.commodity_id);
      body.append("cycle_name", form.cycle_name.trim());
      body.append("start_date", form.start_date);
      body.append("predicited_end_date", form.predicited_end_date);
      body.append("status", "active");

      const res = await fetch(`${API}/create`, {
        method: "POST",
        headers: { Authorization: `${tokenType} ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const json = await res.json();
      if (!res.ok || json.success === false || json.status === false) {
        setFormError(json.message || json.msg || "Gagal menambah siklus.");
        return;
      }
      setShowModal(false);
      setForm({ land_id: selectedLandId, commodity_id: "", cycle_name: "", start_date: "", predicited_end_date: "" });
      setSuccessMsg("✅ Siklus tanam berhasil ditambahkan!");
      fetchCyclesForLand(selectedLandId, token, tokenType);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch { setFormError("Tidak dapat terhubung ke server."); }
    finally { setFormLoading(false); }
  }

  async function handleComplete(cycle: Cycle) {
    const today = new Date().toISOString().split("T")[0];
    const actualDate = prompt("Masukkan tanggal panen aktual (YYYY-MM-DD):", today);
    if (actualDate === null) return; 

    if (!/^\d{4}-\d{2}-\d{2}$/.test(actualDate)) {
      alert("Format tanggal salah. Gunakan YYYY-MM-DD.");
      return;
    }

    setActionLoading(cycle.id);
    try {
      // Send both status and actual_end_date to the main update endpoint
      const body = new URLSearchParams();
      body.append("cycle_name", cycle.cycle_name);
      body.append("status", "completed");
      body.append("actual_end_date", actualDate);
      
      const res = await fetch(`${API}/update/${cycle.id}`, {
        method: "POST",
        headers: { Authorization: `${tokenType} ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const json = await res.json();
      
      if (!res.ok || json.success === false || json.status === false) {
        alert(json.message || json.msg || "Gagal menyelesaikan siklus.");
        return;
      }

      setSuccessMsg(`✅ Siklus tanam selesai dipanen!`);
      fetchCyclesForLand(selectedLandId, token, tokenType);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch { alert("Gagal terhubung ke server."); }
    finally { setActionLoading(null); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin ingin menghapus siklus tanam ini?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/delete/${id}`, {
        method: "POST",
        headers: { Authorization: `${tokenType} ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json.success === false || json.status === false) {
        alert(json.message || json.msg || "Gagal menghapus siklus.");
        return;
      }
      setSuccessMsg("🗑️ Siklus tanam berhasil dihapus.");
      fetchCyclesForLand(selectedLandId, token, tokenType);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch { alert("Gagal terhubung ke server."); }
    finally { setActionLoading(null); }
  }

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return data.filter(c => {
      const matchSearch = !q || c.cycle_name.toLowerCase().includes(q);
      const matchStatus = !filterStatus || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, searchQ, filterStatus]);

  const activeLandName = useMemo(() => {
    return lands.find(l => l.id.toString() === selectedLandId)?.land_name || `Lahan ID: ${selectedLandId}`;
  }, [lands, selectedLandId]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* Modal Tambah */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => { if (!formLoading) setShowModal(false); }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 500, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(15,23,42,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ background: "linear-gradient(135deg,#064e3b,#10b981)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>🌱 Tambah Siklus Tanam</div>
                <div style={{ color: "#a7f3d0", fontSize: 12, marginTop: 2 }}>Mulai tahap penanaman baru</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Lahan *</label>
                  <select value={form.land_id} onChange={e => setForm({ ...form, land_id: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                    {lands.map(l => <option key={l.id} value={l.id}>{l.land_name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Nama Siklus *</label>
                  <input type="text" placeholder="cth: Siklus Pertama Sawit 2026" value={form.cycle_name} onChange={e => setForm({ ...form, cycle_name: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Komoditas Tanaman *</label>
                  <select value={form.commodity_id} onChange={e => setForm({ ...form, commodity_id: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                    <option value="">-- Pilih Komoditas --</option>
                    {commodities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Tanggal Mulai *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Estimasi Panen *</label>
                  <input type="date" value={form.predicited_end_date} onChange={e => setForm({ ...form, predicited_end_date: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
              {formError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 14 }}>⚠️ {formError}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px", border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>Batal</button>
                <button type="submit" disabled={formLoading} style={{ flex: 2, padding: "11px", background: formLoading ? "#94a3b8" : "linear-gradient(135deg,#047857,#10b981)", color: "#fff", border: "none", borderRadius: 9, cursor: formLoading ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                  {formLoading ? "Menyimpan..." : "Simpan Siklus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#064e3b,#047857 60%,#10b981)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔄</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>Siklus Tanaman</h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a7f3d0" }}>Manajemen siklus tanam $\rightarrow$ perawatan $\rightarrow$ panen</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 12px", fontSize: 11, color: "#ecfdf5" }}>
                  {v}: {data.filter(c => c.status === k).length}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Cari siklus..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", width: 180 }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
              <option value="" style={{ color: "#0f172a" }}>Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k} style={{ color: "#0f172a" }}>{v}</option>)}
            </select>
            <button onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#34d399,#059669)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.4)" }}>
              + Tambah Siklus
            </button>
          </div>
        </div>
      </div>

      {/* Pemilih Lahan Pertanian */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: "#fff", padding: "14px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Pilih Lahan Aktif:</label>
        <select 
          value={selectedLandId} 
          onChange={(e) => handleLandChange(e.target.value)} 
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, fontWeight: 600, color: "#1e293b", outline: "none", cursor: "pointer" }}
        >
          {lands.length === 0 ? <option value="">-- Tidak ada lahan --</option> : null}
          {lands.map(l => <option key={l.id} value={l.id}>{l.land_name}</option>)}
        </select>
      </div>

      {successMsg && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 18px", color: "#15803d", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{successMsg}</div>}

      {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>⏳ Memuat siklus tanam...</div>}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px", color: "#b91c1c" }}>⚠️ {error}</div>}

      {!loading && !error && (
        filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>Belum ada siklus tanam di Lahan {activeLandName}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tekan "Tambah Siklus" untuk memulai</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filtered.map(cycle => {
              const sc = STATUS_COLOR[cycle.status] || STATUS_COLOR.active;
              const progress = cycle.status === "completed" ? 100 : 50;
              const commodityName = commodities.find(c => c.id === cycle.commodity_id)?.name || `Komoditas ID: ${cycle.commodity_id}`;

              return (
                <div key={cycle.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${sc.color}, #10b981)`, width: `${progress}%` }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>🔄 {cycle.cycle_name}</div>
                        <div style={{ fontSize: 11, color: "#047857", fontWeight: 600, marginTop: 2 }}>🌿 {commodityName}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {STATUS_LABEL[cycle.status]}
                      </span>
                    </div>

                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>Lahan Aktif</span>
                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{activeLandName}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>Mulai Tanam</span>
                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{cycle.start_date}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>Estimasi Panen</span>
                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{cycle.predicited_end_date}</span>
                      </div>
                      {cycle.actual_end_date && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "#94a3b8" }}>Panen Aktual</span>
                          <span style={{ color: "#047857", fontWeight: 600 }}>{cycle.actual_end_date}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                        <span>Progress Keseluruhan</span><span>{progress}%</span>
                      </div>
                      <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,#10b981,#047857)", borderRadius: 99, transition: "width 0.5s" }} />
                      </div>
                    </div>

                    {/* Activity Log (Simulasi berdasarkan tanggal) */}
                    <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 12, marginTop: 4, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Log Aktivitas & Perawatan</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontSize: 14 }}>🌱</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#0f172a", fontWeight: 600 }}>Pembibitan & Tanam</div>
                            <div style={{ color: "#64748b", fontSize: 11 }}>{cycle.start_date}</div>
                          </div>
                          <span style={{ color: "#15803d", fontWeight: 700, fontSize: 11 }}>✓ Selesai</span>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontSize: 14 }}>💧</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#0f172a", fontWeight: 600 }}>Pengairan & Pemupukan</div>
                            <div style={{ color: "#64748b", fontSize: 11 }}>{addDays(cycle.start_date, 30)}</div>
                          </div>
                          {cycle.status === "completed" ? (
                            <span style={{ color: "#15803d", fontWeight: 700, fontSize: 11 }}>✓ Selesai</span>
                          ) : (
                            <span style={{ color: "#d97706", fontWeight: 700, fontSize: 11 }}>⏳ Dalam Proses</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontSize: 14 }}>🛡️</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#0f172a", fontWeight: 600 }}>Penanganan Hama</div>
                            <div style={{ color: "#64748b", fontSize: 11 }}>{addDays(cycle.start_date, 60)}</div>
                          </div>
                          {cycle.status === "completed" ? (
                            <span style={{ color: "#15803d", fontWeight: 700, fontSize: 11 }}>✓ Selesai</span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11 }}>Menunggu</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 12 }}>
                          <span style={{ fontSize: 14 }}>🌾</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#0f172a", fontWeight: 600 }}>Panen Hasil</div>
                            <div style={{ color: "#64748b", fontSize: 11 }}>{cycle.actual_end_date || cycle.predicited_end_date}</div>
                          </div>
                          {cycle.status === "completed" ? (
                            <span style={{ color: "#15803d", fontWeight: 700, fontSize: 11 }}>✓ Selesai</span>
                          ) : (
                            <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: 11 }}>Menunggu</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      {cycle.status === "active" && (
                        <button onClick={() => handleComplete(cycle)} disabled={actionLoading === cycle.id}
                          style={{ flex: 2, padding: "9px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#047857,#10b981)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: actionLoading === cycle.id ? "default" : "pointer" }}>
                          {actionLoading === cycle.id ? "Memproses..." : "Selesaikan & Panen"}
                        </button>
                      )}
                      <button onClick={() => handleDelete(cycle.id)} disabled={actionLoading === cycle.id}
                        style={{ flex: 1, padding: "9px", border: "1px solid #fecaca", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: actionLoading === cycle.id ? "default" : "pointer" }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
