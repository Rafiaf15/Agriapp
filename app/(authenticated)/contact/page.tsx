"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subjek dan pesan wajib diisi."); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token") || "";
      const tokenType = localStorage.getItem("token_type") || "Bearer";
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const body = new URLSearchParams();
      body.append("subject", form.subject.trim());
      body.append("message", form.message.trim());
      body.append("priority", form.priority);
      body.append("sender_name", user.full_name || user.username || "");
      body.append("sender_email", user.email || "");

      const res = await fetch("/api/proxy/contact", {
        method: "POST",
        headers: { Authorization: `${tokenType} ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) { setError(json.message || "Gagal mengirim pesan."); return; }
      setSuccess("✅ Pesan berhasil dikirim! Admin akan segera menghubungi Anda.");
      setForm({ subject: "", message: "", priority: "normal" });
    } catch { setError("Tidak dapat terhubung ke server."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9 60%,#8b5cf6)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>💬</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Hubungi Admin</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#ddd6fe" }}>Kirim pertanyaan, laporan, atau permintaan bantuan</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>📞</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6d28d9", marginBottom: 4 }}>Informasi Kontak Admin</div>
          <div style={{ fontSize: 13, color: "#5b21b6", lineHeight: 1.6 }}>
            Email: <strong>admin@agriapp.id</strong><br />
            WhatsApp: <strong>+62 812-3456-7890</strong><br />
            Jam Operasional: Senin–Jumat, 08.00–17.00 WIB
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Kirim Pesan</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subjek *</label>
            <input type="text" placeholder="cth: Kendala upload dokumen" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required
              style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Prioritas</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["low", "normal", "high"] as const).map(p => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, border: `2px solid ${form.priority === p ? (p === "high" ? "#dc2626" : p === "low" ? "#10b981" : "#3b82f6") : "#e2e8f0"}`, background: form.priority === p ? (p === "high" ? "#fef2f2" : p === "low" ? "#f0fdf4" : "#eff6ff") : "#fff", cursor: "pointer", fontSize: 13, fontWeight: form.priority === p ? 700 : 500, color: form.priority === p ? (p === "high" ? "#dc2626" : p === "low" ? "#047857" : "#1d4ed8") : "#64748b" }}>
                  {p === "low" ? "🟢 Rendah" : p === "normal" ? "🔵 Normal" : "🔴 Urgent"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Pesan *</label>
            <textarea rows={5} placeholder="Jelaskan masalah atau pertanyaan Anda secara detail..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required
              style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}
          {success && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 9, padding: "10px 14px", color: "#15803d", fontSize: 13, marginBottom: 16 }}>{success}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: loading ? "#94a3b8" : "linear-gradient(135deg,#7c3aed,#8b5cf6)", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Mengirim..." : "📨 Kirim Pesan ke Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
