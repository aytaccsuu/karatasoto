"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon, UsersIcon, WrenchScrewdriverIcon,
  CubeIcon, ChartBarIcon, UserCircleIcon, XMarkIcon, DocumentTextIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/dashboard", label: "Ana Sayfa", icon: HomeIcon },
  { href: "/customers", label: "Müşteriler", icon: UsersIcon },
  { href: "/services", label: "Servis Kayıtları", icon: WrenchScrewdriverIcon },
  { href: "/quotes", label: "Fiyat Teklifleri", icon: DocumentTextIcon },
  { href: "/products", label: "Ürünler", icon: CubeIcon },
  { href: "/reports", label: "Raporlar", icon: ChartBarIcon },
  { href: "/profile", label: "Profil", icon: UserCircleIcon },
];

interface SidebarProps { open: boolean; onClose: () => void; }

function NavList({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 500,
              textDecoration: "none",
              marginBottom: "3px",
              backgroundColor: isActive ? "#4f46e5" : "transparent",
              color: isActive ? "#ffffff" : "#94a3b8",
              transition: "background-color 0.15s, color 0.15s",
            }}
          >
            <Icon style={{ width: 20, height: 20, flexShrink: 0, color: isActive ? "#c7d2fe" : "#64748b" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(160deg,#0f172a 0%,#1e293b 100%)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          <Image src="/logo.png" alt="Logo" width={26} height={26} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", lineHeight: "1.2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>Karataş Oto</p>
          <p style={{ fontSize: 10, color: "#64748b", lineHeight: "1.2", margin: 0 }}>Servis Takip</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: "auto", padding: 4, borderRadius: 4, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
            <XMarkIcon style={{ width: 16, height: 16, color: "#94a3b8" }} />
          </button>
        )}
      </div>
      <NavList onClose={onClose} />
      <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, textAlign: "center" }}>
        <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>v1.0</p>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <style>{`
        .sidebar-desktop { width: 224px; flex-shrink: 0; height: 100%; display: block; }
        @media (max-width: 767px) { .sidebar-desktop { display: none; } }
      `}</style>

      {/* Desktop — 768px ve üzeri her zaman görünür */}
      <div className="sidebar-desktop">
        <SidebarContent />
      </div>

      {/* Mobil overlay — hamburger menü açıldığında */}
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 20 }}
            onClick={onClose}
          />
          <div style={{ position: "fixed", top: 0, left: 0, height: "100%", width: 260, zIndex: 30 }}>
            <SidebarContent onClose={onClose} />
          </div>
        </>
      )}
    </>
  );
}
