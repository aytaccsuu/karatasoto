"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, MagnifyingGlassIcon, PhoneIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { getCached, setCached, invalidateCache } from "@/lib/cache";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Customer } from "@/types";

const CACHE_KEY = "customers_v1";

const S = {
  page: {} as React.CSSProperties,
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  sub: { fontSize: 13, color: "#64748b", margin: "2px 0 0 0" } as React.CSSProperties,
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#4f46e5", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "none", cursor: "pointer" } as React.CSSProperties,
  searchWrap: { position: "relative", marginBottom: 16 } as React.CSSProperties,
  searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#94a3b8", pointerEvents: "none" } as React.CSSProperties,
  searchInput: { width: "100%", paddingLeft: 36, paddingRight: 14, paddingTop: 8, paddingBottom: 8, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", backgroundColor: "#fff", outline: "none", boxSizing: "border-box" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thR: { textAlign: "right" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13 } as React.CSSProperties,
  tdR: { padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  avatar: { width: 28, height: 28, borderRadius: "50%", backgroundColor: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 } as React.CSSProperties,
  center: { display: "flex", justifyContent: "center", padding: "48px 0" } as React.CSSProperties,
  empty: { textAlign: "center" as const, padding: "48px 0", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" },
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
};

export default function CustomersPage() {
  const router = useRouter();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);

  const customers = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const q = search.toLowerCase();
    return allCustomers.filter((c) =>
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  }, [allCustomers, search]);

  async function loadCustomers(background = false) {
    if (!background) setLoading(true);
    const res = await fetch("/api/customers");
    const data = await res.json();
    const list: Customer[] = data.data || [];
    setAllCustomers(list);
    setCached(CACHE_KEY, list);
    if (!background) setLoading(false);
  }

  useEffect(() => {
    const cached = getCached<Customer[]>(CACHE_KEY);
    if (cached) {
      setAllCustomers(cached);
      setLoading(false);
      loadCustomers(true);
    } else {
      loadCustomers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function askDelete(id: string, name: string) {
    setConfirmTarget({ id, name });
    setConfirmOpen(true);
  }

  async function executeDelete() {
    if (!confirmTarget) return;
    const res = await fetch(`/api/customers/${confirmTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Müşteri silindi");
      setAllCustomers((prev) => prev.filter((c) => c.id !== confirmTarget.id));
      invalidateCache(CACHE_KEY);
    } else {
      toast.error("Silme işlemi başarısız");
    }
    setConfirmOpen(false);
    setConfirmTarget(null);
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tr:hover td { background-color: #f8fafc; }
        .cust-table-card { display: block; }
        .cust-mobile-list { display: none; }
        @media (max-width: 640px) {
          .cust-table-card { display: none; }
          .cust-mobile-list { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <ConfirmModal
        open={confirmOpen}
        title="Müşteriyi Sil"
        message={confirmTarget ? `${confirmTarget.name} adlı müşteriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : ""}
        confirmLabel="Evet, Sil"
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
      />

      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Müşteriler</h1>
          {!loading && <p style={S.sub}>{customers.length} müşteri</p>}
        </div>
        <Link href="/customers/new" style={S.btnPrimary}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          Yeni Müşteri
        </Link>
      </div>

      <div style={S.searchWrap}>
        <MagnifyingGlassIcon style={S.searchIcon} />
        <input
          type="text" placeholder="Ad, soyad veya telefon ile ara..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={S.searchInput}
        />
      </div>

      {loading ? (
        <div style={S.center}><div style={S.spinner} /></div>
      ) : customers.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 500 }}>
            {search ? `"${search}" için sonuç bulunamadı` : "Müşteri bulunamadı"}
          </p>
        </div>
      ) : (
        <>
          {/* Masaüstü tablo */}
          <div className="cust-table-card" style={S.card}>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Ad Soyad</th>
                    <th style={S.th}>Telefon</th>
                    <th style={S.thR}>Veresiye</th>
                    <th style={{ ...S.th, width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td style={S.td}>
                        <Link href={`/customers/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                          <div style={S.avatar}>{c.first_name?.[0]}{c.last_name?.[0]}</div>
                          <span style={{ fontWeight: 500, color: "#1e293b", fontSize: 13 }}>{c.first_name} {c.last_name}</span>
                        </Link>
                      </td>
                      <td style={S.td}>
                        {c.phone ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b" }}>
                            <PhoneIcon style={{ width: 12, height: 12, color: "#94a3b8" }} />{c.phone}
                          </span>
                        ) : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                      </td>
                      <td style={S.tdR}>
                        {c.total_debt > 0 ? (
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                            {formatCurrency(c.total_debt)}
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                            Borcu Yok
                          </span>
                        )}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                          <button onClick={() => router.push(`/customers/${c.id}/edit`)} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Düzenle</button>
                          <button onClick={() => askDelete(c.id, `${c.first_name} ${c.last_name}`)} style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sil</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobil kart listesi */}
          <div className="cust-mobile-list">
            {customers.map((c) => (
              <div key={c.id} style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Link href={`/customers/${c.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1 }}>
                    <div style={S.avatar}>{c.first_name?.[0]}{c.last_name?.[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{c.first_name} {c.last_name}</div>
                      {c.phone && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.phone}</div>}
                    </div>
                  </Link>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {c.total_debt > 0 ? (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>{formatCurrency(c.total_debt)}</div>
                    ) : (
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 7px", marginBottom: 6, display: "inline-block" }}>Borcu Yok</div>
                    )}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <button onClick={() => router.push(`/customers/${c.id}/edit`)} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Düzenle</button>
                      <button onClick={() => askDelete(c.id, `${c.first_name} ${c.last_name}`)} style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sil</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
