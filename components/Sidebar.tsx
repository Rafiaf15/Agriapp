"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const menuGroups = [
  {
    id: "overview",
    title: "OVERVIEW",
    items: [{ name: "Dashboard", path: "/dashboard", icon: "📊" }],
  },
  {
    id: "land_management",
    title: "LAND MANAGEMENT",
    items: [
      { name: "My Lands", path: "/lands", icon: "⛰️" },
      { name: "Polygon Mapping", path: "/land-polygon", icon: "🗺️" },
    ],
  },
  {
    id: "production_crop",
    title: "PRODUCTION & CROP",
    items: [
      { name: "Planting Cycles", path: "/planting-cycles", icon: "🔄" },
      { name: "Activity & Cost Logs", path: "/activities", icon: "📝" },
    ],
  },
  {
    id: "global_compliance",
    title: "GLOBAL COMPLIANCE (EUDR)",
    items: [
      { name: "Land Documents", path: "/documents", icon: "📁" },
      { name: "Certifications", path: "/certifications", icon: "🛡️" },
      { name: "Due Diligence Reports", path: "/due-diligence", icon: "📄" },
    ],
  },
  {
    id: "account",
    title: "ACCOUNT",
    items: [
      { name: "My Profile", path: "/profile", icon: "👤" },
      { name: "Contact Admin", path: "/contact", icon: "💬" },
    ],
  },
];

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [openGroups, setOpenGroups] = useState<{
    [key: string]: boolean;
  }>({
    overview: true,
  });

  // ...existing code...
  useEffect(() => {
    menuGroups.forEach((group) => {
      const active = group.items.some(
        (item) =>
          (pathname || "") === item.path ||
          (pathname || "").startsWith(item.path + "/")
      );

      if (active) {
        setOpenGroups((prev) => ({
          ...prev,
          [group.id]: true,
        }));
      }
    });
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/*
      <div className="sidebar-header">
        ARGANTARA
      </div>
      */ }
      {/* Brand Logo - Diperbarui menjadi AGRANTARA */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24 }}>🌱</span>
        <div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 16, letterSpacing: "0.5px" }}>{process.env.NEXT_PUBLIC_APP_NAME}</div>
          <div style={{ fontSize: 11, color: "#38bdf8" }}>{process.env.NEXT_PUBLIC_APP_SUBTITLE}</div>
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 10px",
        }}
      >
        {menuGroups.map((group) => (
          <div
            key={group.id}
            style={{
              marginBottom: 10,
            }}
          >
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                padding: "10px",
              }}
            >
              <span>{group.title}</span>

              <span>
                {openGroups[group.id] ? "▼" : "▶"}
              </span>
            </button>

            {openGroups[group.id] && (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginTop: 5,
                }}
              >

                {group.items.map((item) => (

                  <button
                    key={item.path}
                    className={`menu-button ${
                      pathname === item.path ? "active" : ""
                    }`}
                    style={{
                      paddingLeft: 20,
                    }}
                    onClick={() => {
                      router.push(item.path);
                      onClose();
                    }}
                  >
                    {item.icon} {item.name}
                  </button>

                ))}

              </div>

            )}
          </div>
        ))}
      </nav>

      <div style={{ padding: 16, borderTop: "1px solid #1e293b", background: "#0a0f1a" }}>
        <button
            style={{ 
            width: "100%", padding: "10px", 
            background: "#311212", border: "1px solid #7f1d1d", 
            color: "#f87171", borderRadius: 8, 
            fontSize: 13, cursor: "pointer", fontWeight: 500 
          }}
          onClick={() => {
            localStorage.clear();
            router.push("/login");
            onClose();
          }}
        >
          🛑 Logout
        </button>
      </div>

    </aside>
  );
}