"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UsersIcon, TruckIcon, WrenchScrewdriverIcon,
  BanknotesIcon, ExclamationTriangleIcon, PlusIcon, ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { getCached, setCached } from "@/lib/cache";
import type { DashboardStats } from "@/types";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  suffix?: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, suffix }: StatCardProps) {
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color: iconColor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.2, marginTop: 2, marginBottom: 0 }}>
          {value}
          {suffix && <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => setStats(d.data)).finally(() => setLoading(false));

    // Arka planda sık kullanılan verileri önceden yükle (prefetch)
    // Müşteri araması ve servis formu için sessizce cache'e yaz
    const prefetch = async () => {
      await Promise.allSettled([
        !getCached("products_v1") && fetch("/api/products?active=true")
          .then(r => r.json()).then(d => { if (d.data) setCached("products_v1", d.data); }),
        !getCached("customers_v1") && fetch("/api/customers")
          .then(r => r.json()).then(d => { if (d.data) setCached("customers_v1", d.data); }),
        !getCached("vehicles_v1") && fetch("/api/vehicles")
          .then(r => r.json()).then(d => { if (d.data) setCached("vehicles_v1", d.data); }),
        !getCached("services_v1") && fetch("/api/services")
          .then(r => r.json()).then(d => { if (d.data) setCached("services_v1", d.data); }),
      ]);
    };
    // Dashboard yüklendikten 1 saniye sonra başlat (öne geçmesin)
    const t = setTimeout(prefetch, 1000);
    return () => clearTimeout(t);
  }, []);

  const today = new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 192 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    );
  }

  const quickLinks = [
    { href: "/customers/new", label: "Yeni Müşteri", icon: UsersIcon, bg: "#eef2ff", color: "#4338ca" },
    { href: "/services/new", label: "Yeni Servis", icon: WrenchScrewdriverIcon, bg: "#fffbeb", color: "#b45309" },
    { href: "/customers", label: "Müşteri Listesi", icon: ArrowRightIcon, bg: "#f8fafc", color: "#475569" },
    { href: "/reports", label: "Excel Rapor", icon: ArrowRightIcon, bg: "#f0fdf4", color: "#15803d" },
  ];

  return (
    <div>
      <style>{`
        .dash-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .dash-quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        @media (max-width: 640px) {
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .dash-quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>Hoş Geldiniz</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0 0", textTransform: "capitalize" }}>{today}</p>
        </div>
        <Link href="/services/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#4f46e5", color: "#ffffff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          Yeni Servis
        </Link>
      </div>

      <div className="dash-stat-grid">
        <StatCard title="Toplam Müşteri" value={stats?.total_customers ?? 0} icon={UsersIcon} iconBg="#eef2ff" iconColor="#4f46e5" />
        <StatCard title="Toplam Araç" value={stats?.total_vehicles ?? 0} icon={TruckIcon} iconBg="#f5f3ff" iconColor="#7c3aed" />
        <StatCard title="Bugün Gelen" value={stats?.todays_vehicle_count ?? 0} icon={WrenchScrewdriverIcon} iconBg="#fffbeb" iconColor="#d97706" suffix="araç" />
        <StatCard title="Bugünkü Ciro" value={formatCurrency(stats?.todays_revenue ?? 0)} icon={BanknotesIcon} iconBg="#f0fdf4" iconColor="#16a34a" />
        <StatCard title="Toplam Veresiye" value={formatCurrency(stats?.total_credit_debt ?? 0)} icon={ExclamationTriangleIcon} iconBg="#fef2f2" iconColor="#dc2626" />
      </div>

      <div>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px 0" }}>Hızlı Erişim</p>
        <div className="dash-quick-grid">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: item.bg, color: item.color, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
