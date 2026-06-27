"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// 1. Konstanta warna Dark Emerald Edition
const COLORS = {
  bgHeader: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
  borderBottom: "rgba(255, 255, 255, 0.12)",
  textTitle: "#ffffff",
  textSubtitle: "#a7f3d0",
  textName: "#ffffff",
  textRole: "#34d399",
  bgAvatar: "rgba(255, 255, 255, 0.15)",
  textAvatar: "#ffffff",
  
  // Warna khusus untuk Dropdown Menu
  bgDropdown: "#ffffff",
  textDropdown: "#334155",
  textDropdownHover: "#047857",
  bgDropdownHover: "#f0fdf4",
  borderDropdown: "#e2e8f0",
};

// 2. Struktur Tipe data untuk Menu Item (Biar TypeScript-nya aman)
interface MenuItem {
  label: string;
  icon: string;
  url?: string;       // Opsional karena logout tidak pakai URL melainkan fungsi custom
  isLogout?: boolean; // Flag penanda khusus menu logout
}

// 3. Konfigurasi Array Menu: Mudah ditambah / dikurangi di sini!
const MENU_ITEMS: MenuItem[] = [
  { label: "Profil", icon: "👤", url: "/profile" },
  { label: "Ubah Password", icon: "🔑", url: "/profile?tab=password" },
  // Kamu bisa tambah menu di sini nanti, contoh:
  // { label: "Notifikasi", icon: "🔔", url: "/notifications" },
  { label: "Logout", icon: "🚪", isLogout: true },
];

export default function Header({
  onToggle,
}: {
  onToggle: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    const f = localStorage.getItem("farmer");

    if (u) setUser(JSON.parse(u));
    if (f) setFarmer(JSON.parse(f));

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name = user?.full_name || "User";
  const role = user?.user_level === "userfarmer" ? "Farmer" : user?.user_level;

  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // ── Handler saat salah satu item menu diklik ────────────────────────
  const handleMenuClick = (item: MenuItem) => {
    setIsOpen(false);

    if (item.isLogout) {
      // Eksekusi proses logout
      localStorage.removeItem("user");
      localStorage.removeItem("farmer");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("is_farmer");
      router.push("/login");
    } else if (item.url) {
      // Jalankan redirect biasa
      router.push(item.url);
    }
  };

  return (
    <header
      style={{
        background: COLORS.bgHeader,
        padding: "16px 24px",
        borderBottom: `1px solid ${COLORS.borderBottom}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Bagian kiri */}
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggle}
          style={{
            padding: "8px",
            cursor: "pointer",
            border: "none",
            background: "transparent",
            fontSize: "22px",
            color: COLORS.textTitle,
          }}
        >
          ☰
        </button>

        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.textTitle }}>
            {process.env.NEXT_PUBLIC_HEADER_TITLE}
          </h2>
          <div style={{ fontSize: 12, color: COLORS.textSubtitle, fontWeight: 500 }}>
            {process.env.NEXT_PUBLIC_HEADER_SUBTITLE}
          </div>
        </div>
      </div>

      {/* Bagian kanan */}
      <div 
        ref={dropdownRef}
        style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}
      >
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textName }}>{name}</div>
          <div style={{ fontSize: 11, color: COLORS.textRole, fontWeight: 600 }}>{role}</div>
        </div>

        {/* Tombol Avatar Bulat */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: COLORS.bgAvatar,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: COLORS.textAvatar,
            fontSize: 14,
            border: "1px solid rgba(255, 255, 255, 0.25)",
            cursor: "pointer",
            padding: 0,
            outline: "none"
          }}
        >
          {initials}
        </button>

        {/* ════════════════════ DROPDOWN MENU (DYNAMIC MAPPING) ════════════════════ */}
        {isOpen && (
          <div
            className="land-fade"
            style={{
              position: "absolute",
              right: 0,
              top: "48px",
              background: COLORS.bgDropdown,
              border: `1px solid ${COLORS.borderDropdown}`,
              borderRadius: 12,
              width: 170,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: "6px 0"
            }}
          >
            {MENU_ITEMS.map((item, index) => {
              // Jika ini menu logout, tampilkan pemisah garis (divider) sebelumnya
              const isLogout = item.isLogout;

              return (
                <div key={index}>
                  {isLogout && (
                    <div style={{ height: "1px", background: COLORS.borderDropdown, margin: "6px 0" }} />
                  )}
                  <button
                    onClick={() => handleMenuClick(item)}
                    style={{
                      ...menuItemStyle,
                      color: isLogout ? "#dc2626" : COLORS.textDropdown
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isLogout ? "#fef2f2" : COLORS.bgDropdownHover;
                      if (!isLogout) e.currentTarget.style.color = COLORS.textDropdownHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = isLogout ? "#dc2626" : COLORS.textDropdown;
                    }}
                  >
                    <span style={{ marginRight: "8px" }}>{item.icon}</span>
                    {item.label}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

const menuItemStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "transparent",
  border: "none",
  fontSize: 13,
  fontWeight: 500,
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
  display: "flex",
  alignItems: "center",
  outline: "none",
  transition: "all 0.15s ease",
};