"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, PAYMENT_TYPE_LABELS } from "@/lib/utils";
import { getCached, setCached } from "@/lib/cache";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { ServiceRecord } from "@/types";

const CACHE_KEY = "services_v1";

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  veresiye: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
  nakit: { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
  kredi_karti: { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
};

const S = {
  page: {} as React.CSSProperties,
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  sub: { fontSize: 13, color: "#64748b", margin: "2px 0 0 0" } as React.CSSProperties,
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#4f46e5", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" } as React.CSSProperties,
  filterCard: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "12px 16px", marginBottom: 16 } as React.CSSProperties,
  filterRow: { display: "flex", flexWrap: "wrap" as const, alignItems: "flex-end", gap: 12 } as React.CSSProperties,
  label: { display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 } as React.CSSProperties,
  inp: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#0f172a", backgroundColor: "#fff", outline: "none" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thR: { textAlign: "right" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdR: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  center: { display: "flex", justifyContent: "center", padding: "48px 0" } as React.CSSProperties,
  empty: { textAlign: "center" as const, padding: "48px 0", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" },
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payFilter, setPayFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchServices = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (payFilter) params.set("payment_type", payFilter);
    const res = await fetch(`/api/services?${params.toString()}`);
    const data = await res.json();
    const list: ServiceRecord[] = data.data || [];
    setServices(list);
    if (!fromDate && !toDate && !payFilter) setCached(CACHE_KEY, list);
    if (!background) setLoading(false);
  }, [fromDate, toDate, payFilter]);

  useEffect(() => {
    const noFilters = !fromDate && !toDate && !payFilter;
    if (noFilters) {
      const cached = getCached<ServiceRecord[]>(CACHE_KEY);
      if (cached) {
        setServices(cached);
        setLoading(false);
        fetchServices(true);
        return;
      }
    }
    fetchServices();
  }, [fetchServices, fromDate, toDate, payFilter]);

  function askDelete(id: string) {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  }

  async function executeDelete() {
    if (!deleteTargetId) return;
    const res = await fetch(`/api/services/${deleteTargetId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Servis kaydı silindi"); fetchServices(); }
    else toast.error("Silme başarısız");
    setConfirmOpen(false);
    setDeleteTargetId(null);
  }

  const total = services.reduce((s, r) => s + r.grand_total, 0);
  const hasFilters = fromDate || toDate || payFilter;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tr:hover td { background-color: #f8fafc; }
        .svc-table-card { display: block; }
        .svc-mobile-list { display: none; }
        @media (max-width: 640px) {
          .svc-table-card { display: none; }
          .svc-mobile-list { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <ConfirmModal
        open={confirmOpen}
        title="Servis Kaydını Sil"
        message="Bu servis kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTargetId(null); }}
      />

      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Servis Kayıtları</h1>
          {!loading && services.length > 0 && (
            <p style={S.sub}>{services.length} kayıt · <strong style={{ color: "#1e293b" }}>{formatCurrency(total)}</strong></p>
          )}
        </div>
        <Link href="/services/new" style={S.btnPrimary}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          Yeni Servis
        </Link>
      </div>

      <div style={S.filterCard}>
        <div style={S.filterRow}>
          <FunnelIcon style={{ width: 14, height: 14, color: "#94a3b8", alignSelf: "center" }} />
          <div>
            <label style={S.label}>Başlangıç</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={S.inp} />
          </div>
          <div>
            <label style={S.label}>Bitiş</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={S.inp} />
          </div>
          <div>
            <label style={S.label}>Ödeme</label>
            <select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} style={S.inp}>
              <option value="">Tümü</option>
              <option value="nakit">Nakit</option>
              <option value="kredi_karti">Kredi Kartı</option>
              <option value="veresiye">Veresiye</option>
            </select>
          </div>
          {hasFilters && (
            <button onClick={() => { setFromDate(""); setToDate(""); setPayFilter(""); }}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
              <XMarkIcon style={{ width: 14, height: 14 }} /> Temizle
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={S.center}><div style={S.spinner} /></div>
      ) : services.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 500 }}>Servis kaydı bulunamadı</p>
        </div>
      ) : (
        <>
          {/* Masaüstü tablo */}
          <div className="svc-table-card" style={S.card}>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Tarih</th>
                    <th style={S.th}>Plaka</th>
                    <th style={S.th}>Müşteri</th>
                    <th style={S.thR}>Toplam</th>
                    <th style={S.th}>Ödeme</th>
                    <th style={{ ...S.th, width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => {
                    const v = s.vehicle as { plate: string; brand: string; model: string } | undefined;
                    const c = s.customer as { id: string; first_name: string; last_name: string } | undefined;
                    const badgeStyle = BADGE_STYLE[s.payment_type] ?? { backgroundColor: "#f1f5f9", color: "#475569" };
                    return (
                      <tr key={s.id}>
                        <td style={{ ...S.td, whiteSpace: "nowrap", color: "#64748b" }}>{formatDate(s.service_date)}</td>
                        <td style={S.td}>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>{v?.plate}</span>
                          {v?.brand && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>{v.brand} {v.model}</span>}
                        </td>
                        <td style={S.td}>
                          {c ? <Link href={`/customers/${c.id}`} style={{ fontWeight: 500, color: "#334155", textDecoration: "none" }}>{c.first_name} {c.last_name}</Link> : "—"}
                        </td>
                        <td style={{ ...S.tdR, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{formatCurrency(s.grand_total)}</td>
                        <td style={S.td}>
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...badgeStyle }}>
                            {PAYMENT_TYPE_LABELS[s.payment_type]}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                            <Link href={`/services/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>Detay</Link>
                            <button onClick={() => askDelete(s.id)} style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobil kart listesi */}
          <div className="svc-mobile-list">
            {services.map((s) => {
              const v = s.vehicle as { plate: string; brand: string; model: string } | undefined;
              const c = s.customer as { id: string; first_name: string; last_name: string } | undefined;
              const badgeStyle = BADGE_STYLE[s.payment_type] ?? { backgroundColor: "#f1f5f9", color: "#475569" };
              return (
                <div key={s.id} style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{v?.plate}</span>
                      {v?.brand && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>{v.brand} {v.model}</span>}
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...badgeStyle }}>
                      {PAYMENT_TYPE_LABELS[s.payment_type]}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      <div>{formatDate(s.service_date)}</div>
                      {c && <div style={{ marginTop: 2 }}>{c.first_name} {c.last_name}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(s.grand_total)}</div>
                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
                        <Link href={`/services/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>Detay</Link>
                        <button onClick={() => askDelete(s.id)} style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sil</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
