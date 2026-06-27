"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API = "/api/proxy/land-document";

type LandDoc = {
  id: number;
  land_id: number;
  category_id: number;
  document_name: string;
  issue_date: string;
  expiry_date: string;
  file_path?: string;
  file_url?: string;
  created_at?: string;
};

export default function DocumentsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [tokenType, setTokenType] = useState("Bearer");
  const [data, setData] = useState<LandDoc[]>([]);
  const [lands, setLands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ land_id: "", category_id: "", document_name: "", issue_date: "", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    document.title = `Dokumen Lahan | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    const t = localStorage.getItem("access_token") || "";
    const tt = localStorage.getItem("token_type") || "Bearer";
    if (!t) { router.push("/login"); return; }
    setToken(t); setTokenType(tt);
    fetchInitialData(t, tt);
  }, []);

  async function fetchInitialData(t: string, tt: string) {
    setLoading(true); setError(null);
    try {
      // 1. Fetch Categories
      const catRes = await fetch("/api/proxy/document-category", { headers: { Authorization: `${tt} ${t}`, Accept: "application/json" } });
      let catList: any[] = [];
      if (catRes.ok) {
        const catJson = await catRes.json();
        catList = Array.isArray(catJson) ? catJson : catJson.data || [];
        setCategories(catList);
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
        // 3. Fetch documents for default land
        await fetchDocsForLand(defaultLandId, t, tt);
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data awal.");
      setLoading(false);
    }
  }

  async function fetchDocsForLand(landId: string, t: string, tt: string) {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/index?land_id=${landId}`, {
        headers: { Authorization: `${tt} ${t}`, Accept: "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : json.data || []);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat dokumen.");
    } finally { setLoading(false); }
  }

  const handleLandChange = (landId: string) => {
    setSelectedLandId(landId);
    setForm(prev => ({ ...prev, land_id: landId }));
    fetchDocsForLand(landId, token, tokenType);
  };

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.land_id) { setFormError("Pilih lahan terlebih dahulu."); return; }
    if (!form.category_id) { setFormError("Pilih kategori dokumen terlebih dahulu."); return; }
    if (!form.document_name.trim()) { setFormError("Nama dokumen wajib diisi."); return; }
    if (!form.issue_date) { setFormError("Tanggal terbit wajib diisi."); return; }
    if (!form.expiry_date) { setFormError("Tanggal kadaluwarsa wajib diisi."); return; }
    if (!file) { setFormError("Pilih file yang akan diupload."); return; }

    setFormLoading(true);
    try {
      const fd = new FormData();
      fd.append("land_id", form.land_id);
      fd.append("category_id", form.category_id);
      fd.append("document_name", form.document_name.trim());
      fd.append("issue_date", form.issue_date);
      fd.append("expiry_date", form.expiry_date);
      fd.append("document_file", file);

      const res = await fetch(`${API}/create`, {
        method: "POST",
        headers: { Authorization: `${tokenType} ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json.success === false || json.status === false) {
        setFormError(json.message || json.msg || "Gagal upload dokumen.");
        return;
      }
      setShowModal(false);
      setForm({ land_id: selectedLandId, category_id: "", document_name: "", issue_date: "", expiry_date: "" });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setSuccessMsg("✅ Dokumen berhasil diupload!");
      fetchDocsForLand(selectedLandId, token, tokenType);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch { setFormError("Tidak dapat terhubung ke server."); }
    finally { setFormLoading(false); }
  }

  async function handleDelete(id: number) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/delete/${id}`, {
        method: "POST",
        headers: { Authorization: `${tokenType} ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json.success === false || json.status === false) {
        alert(json.message || json.msg || "Gagal menghapus dokumen.");
        return;
      }
      setDeleteId(null);
      setSuccessMsg("🗑️ Dokumen berhasil dihapus.");
      fetchDocsForLand(selectedLandId, token, tokenType);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch { alert("Gagal terhubung ke server."); }
    finally { setDeleteLoading(false); }
  }

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return data.filter(d => {
      return !q || d.document_name.toLowerCase().includes(q);
    });
  }, [data, searchQ]);

  const activeLandName = useMemo(() => {
    return lands.find(l => l.id.toString() === selectedLandId)?.land_name || `Lahan ID: ${selectedLandId}`;
  }, [lands, selectedLandId]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* Confirm Delete Modal */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", maxWidth: 380, width: "90%", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", padding: "18px 24px" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>🗑️ Hapus Dokumen</div>
              <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 2 }}>Tindakan tidak dapat dibatalkan</div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: "#374151", margin: "0 0 16px" }}>Yakin ingin menghapus dokumen ini?</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Batal</button>
                <button onClick={() => handleDelete(deleteId!)} disabled={deleteLoading}
                  style={{ flex: 1, padding: "10px", background: deleteLoading ? "#94a3b8" : "#dc2626", border: "none", color: "#fff", borderRadius: 8, cursor: deleteLoading ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                  {deleteLoading ? "Menghapus..." : "Ya, Hapus!"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
          onClick={() => { if (!formLoading) setShowModal(false); }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 480, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(15,23,42,0.3)" }} onClick={e => e.stopPropagation()}>
            <div style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>📁 Upload Dokumen Lahan</div>
                <div style={{ color: "#bfdbfe", fontSize: 12, marginTop: 2 }}>Sertifikat, izin, surat tanah, EUDR</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <form onSubmit={handleUpload} style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Lahan *</label>
                <select value={form.land_id} onChange={e => setForm({ ...form, land_id: e.target.value })} required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                  {lands.map(l => <option key={l.id} value={l.id}>{l.land_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Nama Dokumen *</label>
                <input type="text" placeholder="cth: Sertifikat Hak Milik Lahan A" value={form.document_name} onChange={e => setForm({ ...form, document_name: e.target.value })} required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Kategori Dokumen *</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Tanggal Terbit *</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Tanggal Expired *</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Berkas File *</label>
                <div style={{ border: "2px dashed #d1d5db", borderRadius: 9, padding: "20px", textAlign: "center", cursor: "pointer", background: "#f8fafc" }}
                  onClick={() => fileRef.current?.click()}>
                  {file ? (
                    <div style={{ fontSize: 13, color: "#047857", fontWeight: 600 }}>📄 {file.name}</div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>☁️</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>Klik untuk pilih file</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>PDF, JPG, PNG (maks. 10MB)</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
              </div>
              {formError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 14 }}>⚠️ {formError}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "11px", border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>Batal</button>
                <button type="submit" disabled={formLoading} style={{ flex: 2, padding: "11px", background: formLoading ? "#94a3b8" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 9, cursor: formLoading ? "default" : "pointer", fontSize: 14, fontWeight: 700 }}>
                  {formLoading ? "Mengupload..." : "Upload Dokumen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8 60%,#3b82f6)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📁</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>Dokumen Lahan</h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#bfdbfe" }}>Upload dan kelola dokumen legalitas lahan</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 12px", fontSize: 11, color: "#ecfdf5" }}>{data.length} Total Dokumen</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input placeholder="Cari dokumen..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", width: 160 }} />
            <button onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#60a5fa,#2563eb)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }}>
              ☁️ Upload Dokumen
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
      {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>⏳ Memuat dokumen...</div>}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "16px 20px", color: "#b91c1c" }}>⚠️ {error}</div>}

      {!loading && !error && (
        filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>Belum ada dokumen di Lahan {activeLandName}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Tekan "Upload Dokumen" untuk menambahkan</div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "linear-gradient(135deg,#1e3a8a,#1d4ed8)" }}>
                  {["#", "Nama Dokumen", "Kategori", "Lahan", "Tanggal Terbit", "Tanggal Expired", "Aksi"].map(h => (
                    <th key={h} style={{ padding: "13px 14px", textAlign: "left", fontSize: 11, color: "#bfdbfe", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const categoryName = categories.find(c => c.id === doc.category_id)?.name || `Kategori ID: ${doc.category_id}`;
                  return (
                    <tr key={doc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 14px", color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>📄 {doc.document_name}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                          {categoryName}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#374151", fontWeight: 500 }}>{activeLandName}</td>
                      <td style={{ padding: "12px 14px", color: "#64748b", whiteSpace: "nowrap" }}>{doc.issue_date}</td>
                      <td style={{ padding: "12px 14px", color: "#b91c1c", fontWeight: 600, whiteSpace: "nowrap" }}>{doc.expiry_date}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {doc.file_url && (
                            <a href={doc.file_url} target="_blank" rel="noreferrer"
                              style={{ padding: "5px 10px", border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                              Lihat
                            </a>
                          )}
                          <button onClick={() => setDeleteId(doc.id)}
                            style={{ padding: "5px 10px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
