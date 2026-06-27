"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  full_name?: string;
  username?: string;
  email?: string;
  user_level?: string;
};

type Farmer = {
  phone?: string;
  address?: string;
  nik?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"view" | "edit" | "password">("view");
  const [user, setUser] = useState<User>({});
  const [farmer, setFarmer] = useState<Farmer>({});
  const [token, setToken] = useState("");
  const [tokenType, setTokenType] = useState("Bearer");

  // Edit form state
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Password form state
  const [passForm, setPassForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    document.title = `Profile | ${process.env.NEXT_PUBLIC_APP_NAME}`;
    
    // Check url params for default tab
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab === "password" || tab === "edit") {
        setActiveTab(tab);
      }
    }

    const t = localStorage.getItem("access_token") || "";
    const tt = localStorage.getItem("token_type") || "Bearer";
    if (!t) { router.push("/login"); return; }
    setToken(t);
    setTokenType(tt);

    const u: User = JSON.parse(localStorage.getItem("user") || "{}");
    const f: Farmer = JSON.parse(localStorage.getItem("farmer") || "{}");
    setUser(u);
    setFarmer(f);
    setEditForm({
      full_name: u.full_name || "",
      email: u.email || "",
      phone: f.phone || "",
      address: f.address || "",
    });
  }, []);

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const body = new URLSearchParams();
      body.append("full_name", editForm.full_name.trim());
      body.append("email", editForm.email.trim());
      body.append("phone", editForm.phone.trim());
      body.append("address", editForm.address.trim());

      const res = await fetch("/api/proxy/profile/update", {
        method: "POST",
        headers: {
          Authorization: `${tokenType} ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setEditError(data.message || "Gagal memperbarui profil.");
        return;
      }
      // Update localStorage
      const updatedUser = { ...user, full_name: editForm.full_name, email: editForm.email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditSuccess("✅ Profil berhasil diperbarui!");
      setTimeout(() => setEditSuccess(""), 3000);
    } catch {
      setEditError("Tidak dapat terhubung ke server.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (passForm.new_password !== passForm.confirm_password) {
      setPassError("Password baru dan konfirmasi tidak cocok.");
      return;
    }
    if (passForm.new_password.length < 6) {
      setPassError("Password baru minimal 6 karakter.");
      return;
    }
    setPassLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("old_password", passForm.old_password);
      body.append("new_password", passForm.new_password);

      const res = await fetch("/api/proxy/profile/change-password", {
        method: "POST",
        headers: {
          Authorization: `${tokenType} ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setPassError(data.message || "Gagal mengganti password.");
        return;
      }
      setPassSuccess("✅ Password berhasil diubah! Silakan login kembali.");
      setPassForm({ old_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => { localStorage.clear(); router.push("/login"); }, 2500);
    } catch {
      setPassError("Tidak dapat terhubung ke server.");
    } finally {
      setPassLoading(false);
    }
  }

  const displayRole = (typeof window !== "undefined" ? localStorage.getItem("role_display") : null) || user.user_level || "User";
  const initials = (user.full_name || user.username || "U")
    .split(" ").slice(0, 2).map((s: string) => s[0]).join("").toUpperCase();

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 0" }}>

      {/* ── Avatar Card ── */}
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#047857 60%,#10b981 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>{user.full_name || user.username || "User"}</div>
            <div style={{ fontSize: 13, color: "#a7f3d0", marginTop: 2 }}>@{user.username}</div>
            <div style={{ display: "inline-block", marginTop: 6, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 12px", fontSize: 11, color: "#ecfdf5", fontWeight: 600 }}>
              {displayRole}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
        {([["view", "👤 Lihat Profil"], ["edit", "✏️ Edit Profil"], ["password", "🔑 Ganti Password"]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? "#047857" : "#64748b", boxShadow: activeTab === tab ? "0 1px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: View ── */}
      {activeTab === "view" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Informasi Akun</div>
          </div>
          {[
            { label: "Nama Lengkap", value: user.full_name || "-", icon: "👤" },
            { label: "Username", value: user.username || "-", icon: "🏷️" },
            { label: "Email", value: user.email || "-", icon: "📧" },
            { label: "Level", value: displayRole, icon: "🎖️" },
            { label: "No. HP", value: farmer.phone || "-", icon: "📱" },
            { label: "Alamat", value: farmer.address || "-", icon: "📍" },
            { label: "NIK", value: farmer.nik || "-", icon: "🪪" },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: i < 6 ? "1px solid #f8fafc" : "none" }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{row.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{row.label}</div>
                <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 500, marginTop: 2 }}>{row.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Edit ── */}
      {activeTab === "edit" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Edit Informasi Profil</div>
          <form onSubmit={handleEditSubmit}>
            {[
              { label: "Nama Lengkap", key: "full_name", type: "text", placeholder: "Masukkan nama lengkap" },
              { label: "Email", key: "email", type: "email", placeholder: "Masukkan email" },
              { label: "No. HP", key: "phone", type: "text", placeholder: "Masukkan nomor HP" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={editForm[key as keyof typeof editForm]}
                  onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Alamat</label>
              <textarea
                placeholder="Masukkan alamat"
                rows={3}
                value={editForm.address}
                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            {editError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>⚠️ {editError}</div>}
            {editSuccess && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 9, padding: "10px 14px", color: "#15803d", fontSize: 13, marginBottom: 16 }}>{editSuccess}</div>}
            <button type="submit" disabled={editLoading} style={{ width: "100%", padding: "12px", background: editLoading ? "#94a3b8" : "linear-gradient(135deg,#047857,#10b981)", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: editLoading ? "default" : "pointer" }}>
              {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab: Password ── */}
      {activeTab === "password" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Ganti Password</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Setelah berhasil, Anda akan otomatis logout.</div>
          <form onSubmit={handlePasswordSubmit}>
            {([
              { label: "Password Lama", key: "old_password", show: showOld, toggle: () => setShowOld(!showOld) },
              { label: "Password Baru", key: "new_password", show: showNew, toggle: () => setShowNew(!showNew) },
              { label: "Konfirmasi Password Baru", key: "confirm_password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
            ] as const).map(({ label, key, show, toggle }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={show ? "text" : "password"}
                    placeholder={`Masukkan ${label.toLowerCase()}`}
                    value={passForm[key]}
                    onChange={e => setPassForm({ ...passForm, [key]: e.target.value })}
                    required
                    style={{ width: "100%", padding: "11px 44px 11px 14px", border: "1px solid #d1d5db", borderRadius: 9, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                  <button type="button" onClick={toggle} tabIndex={-1}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                    <EyeIcon open={show} />
                  </button>
                </div>
              </div>
            ))}
            {passError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9, padding: "10px 14px", color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>⚠️ {passError}</div>}
            {passSuccess && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 9, padding: "10px 14px", color: "#15803d", fontSize: 13, marginBottom: 16 }}>{passSuccess}</div>}
            <button type="submit" disabled={passLoading} style={{ width: "100%", padding: "12px", background: passLoading ? "#94a3b8" : "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: passLoading ? "default" : "pointer" }}>
              {passLoading ? "Memproses..." : "Ubah Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
