"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCached, setCached } from "@/lib/cache";

const CACHE_KEY = "quotes_v1";

interface QuoteLineItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  vehicle_info: string;
  quote_date: string;
  valid_until?: string | null;
  status: "taslak" | "gonderildi" | "onaylandi" | "reddedildi";
  grand_total: number;
  notes?: string | null;
  line_items: QuoteLineItem[];
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  taslak: "Taslak",
  gonderildi: "Gönderildi",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  taslak: { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" },
  gonderildi: { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
  onaylandi: { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
  reddedildi: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
};

const S = {
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  sub: { fontSize: 13, color: "#64748b", margin: "2px 0 0 0" } as React.CSSProperties,
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#4f46e5", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thR: { textAlign: "right" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "11px 16px", borderBottom: "1px solid #f8fafc", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdR: { padding: "11px 16px", borderBottom: "1px solid #f8fafc", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  center: { display: "flex", justifyContent: "center", padding: "48px 0" } as React.CSSProperties,
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    const res = await fetch("/api/quotes");
    const data = await res.json();
    const list: Quote[] = data.data || [];
    setQuotes(list);
    setCached(CACHE_KEY, list);
    if (!background) setLoading(false);
  }, []);

  useEffect(() => {
    const cached = getCached<Quote[]>(CACHE_KEY);
    if (cached) {
      setQuotes(cached);
      setLoading(false);
      fetchQuotes(true); // arka plan yenileme
    } else {
      fetchQuotes();
    }
  }, [fetchQuotes]);

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .qt-table-card { display: block; }
        .qt-mobile-list { display: none; }
        @media (max-width: 640px) {
          .qt-table-card { display: none; }
          .qt-mobile-list { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Fiyat Teklifleri</h1>
          {!loading && <p style={S.sub}>{quotes.length} teklif</p>}
        </div>
        <Link href="/quotes/new" style={S.btnPrimary}>
          <PlusIcon style={{ width: 15, height: 15 }} />
          Yeni Teklif
        </Link>
      </div>

      {loading ? (
        <div style={S.center}><div style={S.spinner} /></div>
      ) : quotes.length === 0 ? (
        <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Henüz fiyat teklifi yok.</p>
          <Link href="/quotes/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: "#4f46e5", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <PlusIcon style={{ width: 14, height: 14 }} /> İlk teklifi oluştur
          </Link>
        </div>
      ) : (
        <>
          {/* Masaüstü tablo */}
          <div className="qt-table-card" style={S.card}>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Teklif No</th>
                    <th style={S.th}>Müşteri / Araç</th>
                    <th style={S.th}>Tarih</th>
                    <th style={S.th}>Durum</th>
                    <th style={S.thR}>Tutar</th>
                    <th style={{ ...S.th, width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} style={{ cursor: "pointer" }} onClick={() => window.location.href = `/quotes/${q.id}`}>
                      <td style={{ ...S.td, fontWeight: 700, color: "#0f172a" }}>{q.quote_number}</td>
                      <td style={S.td}>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{q.customer_name}</span>
                        {q.vehicle_info && <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{q.vehicle_info}</span>}
                      </td>
                      <td style={{ ...S.td, color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(q.quote_date)}</td>
                      <td style={S.td}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...(STATUS_STYLE[q.status] ?? {}) }}>
                          {STATUS_LABELS[q.status] ?? q.status}
                        </span>
                      </td>
                      <td style={{ ...S.tdR, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(q.grand_total)}</td>
                      <td style={S.td}>
                        <Link href={`/quotes/${q.id}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>Detay</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobil kart listesi */}
          <div className="qt-mobile-list">
            {quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`} style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px", textDecoration: "none", display: "block" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{q.quote_number}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>{formatDate(q.quote_date)}</span>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...(STATUS_STYLE[q.status] ?? {}) }}>
                    {STATUS_LABELS[q.status] ?? q.status}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{q.customer_name}</div>
                    {q.vehicle_info && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{q.vehicle_info}</div>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(q.grand_total)}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
