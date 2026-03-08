"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, TrashIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface QuoteLineItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Quote {
  id: string;
  quote_number: string;
  customer_id?: string | null;
  customer_name: string;
  vehicle_info?: string | null;
  quote_date: string;
  valid_until?: string | null;
  status: "taslak" | "gonderildi" | "onaylandi" | "reddedildi";
  labor_cost: number;
  kdv_enabled: boolean;
  kdv_amount: number;
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

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "taslak", label: "Taslak" },
  { value: "gonderildi", label: "Gönderildi" },
  { value: "onaylandi", label: "Onaylandı" },
  { value: "reddedildi", label: "Reddedildi" },
];

const S = {
  backRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 } as React.CSSProperties,
  backBtn: { display: "flex", alignItems: "center", color: "#64748b", textDecoration: "none" } as React.CSSProperties,
  titleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8 } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 12 } as React.CSSProperties,
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" } as React.CSSProperties,
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#1e293b", margin: 0 } as React.CSSProperties,
  cardBody: { padding: 16 } as React.CSSProperties,
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  infoLabel: { fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 2 } as React.CSSProperties,
  infoValue: { fontSize: 13, fontWeight: 600, color: "#0f172a" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thR: { textAlign: "right" as const, padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f8fafc", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdR: { padding: "10px 12px", borderBottom: "1px solid #f8fafc", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 4 } as React.CSSProperties,
  summaryTotal: { display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "#0f172a", borderTop: "2px solid #e2e8f0", paddingTop: 10, marginTop: 6 } as React.CSSProperties,
  deleteBtn: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#fff", color: "#dc2626", padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #fecaca", cursor: "pointer" } as React.CSSProperties,
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    const res = await fetch(`/api/quotes/${id}`);
    const data = await res.json();
    setQuote(data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Durum güncellendi");
      load();
    } else {
      toast.error("Güncelleme başarısız");
    }
    setUpdatingStatus(false);
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/reports/pdf/quote/${id}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `teklif_${quote?.quote_number ?? id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF indirme başarısız");
    }
    setPdfLoading(false);
  }

  async function executeDelete() {
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setConfirmOpen(false);
    if (res.ok) {
      toast.success("Teklif silindi");
      router.push("/quotes");
    } else {
      toast.error("Silinemedi");
    }
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );


  if (!quote) return <p style={{ color: "#64748b", fontSize: 13 }}>Teklif bulunamadı.</p>;

  const partsTotal = (quote.line_items || []).reduce((s, li) => s + li.line_total, 0);

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <ConfirmModal
        open={confirmOpen}
        title="Teklifi Sil"
        message={`${quote.quote_number} numaralı teklifi kalıcı olarak silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sil"
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <div style={S.backRow}>
        <Link href="/quotes" style={S.backBtn}>
          <ChevronLeftIcon style={{ width: 18, height: 18 }} />
        </Link>
        <div style={S.titleRow}>
          <h1 style={S.h1}>Teklif {quote.quote_number}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, ...(STATUS_STYLE[quote.status] ?? {}) }}>
              {STATUS_LABELS[quote.status] ?? quote.status}
            </span>
            <button
              onClick={downloadPdf}
              disabled={pdfLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#dc2626", color: "#fff", padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: pdfLoading ? "not-allowed" : "pointer", opacity: pdfLoading ? 0.6 : 1 }}
            >
              <DocumentArrowDownIcon style={{ width: 14, height: 14 }} />
              {pdfLoading ? "..." : "PDF İndir"}
            </button>
            <button onClick={() => setConfirmOpen(true)} style={S.deleteBtn}>
              <TrashIcon style={{ width: 14, height: 14 }} /> Sil
            </button>
          </div>
        </div>
      </div>

      {/* Durum Güncelle */}
      <div style={S.card}>
        <div style={S.cardHeader}><p style={S.cardTitle}>Durum</p></div>
        <div style={{ ...S.cardBody, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={updatingStatus || quote.status === opt.value}
              onClick={() => updateStatus(opt.value)}
              style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: quote.status === opt.value ? `2px solid ${opt.value === "onaylandi" ? "#16a34a" : opt.value === "reddedildi" ? "#dc2626" : opt.value === "gonderildi" ? "#2563eb" : "#64748b"}` : "1px solid #e2e8f0", backgroundColor: quote.status === opt.value ? (STATUS_STYLE[opt.value]?.backgroundColor ?? "#fff") : "#fff", color: quote.status === opt.value ? (STATUS_STYLE[opt.value]?.color ?? "#475569") : "#64748b", cursor: quote.status === opt.value ? "default" : "pointer", opacity: updatingStatus ? 0.6 : 1 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bilgiler */}
      <div style={S.card}>
        <div style={S.cardHeader}><p style={S.cardTitle}>Teklif Bilgileri</p></div>
        <div style={{ ...S.cardBody, ...S.infoGrid }}>
          <div>
            <p style={S.infoLabel}>Müşteri</p>
            <p style={S.infoValue}>
              {quote.customer_id
                ? <Link href={`/customers/${quote.customer_id}`} style={{ color: "#4f46e5", textDecoration: "none" }}>{quote.customer_name}</Link>
                : quote.customer_name || "—"
              }
            </p>
          </div>
          <div>
            <p style={S.infoLabel}>Araç</p>
            <p style={S.infoValue}>{quote.vehicle_info || "—"}</p>
          </div>
          <div>
            <p style={S.infoLabel}>Teklif Tarihi</p>
            <p style={S.infoValue}>{formatDate(quote.quote_date)}</p>
          </div>
          <div>
            <p style={S.infoLabel}>Geçerlilik</p>
            <p style={S.infoValue}>{quote.valid_until ? formatDate(quote.valid_until) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Kalemler */}
      <div style={S.card}>
        <div style={S.cardHeader}><p style={S.cardTitle}>Teklif Kalemleri</p></div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Ürün / Hizmet</th>
                <th style={{ ...S.thR, width: 60 }}>Adet</th>
                <th style={{ ...S.thR, width: 120 }}>Birim Fiyat</th>
                <th style={{ ...S.thR, width: 120 }}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {(quote.line_items || []).map((li, i) => (
                <tr key={i}>
                  <td style={S.td}>{li.name}</td>
                  <td style={{ ...S.tdR, color: "#64748b" }}>{li.quantity}</td>
                  <td style={S.tdR}>{formatCurrency(li.unit_price)}</td>
                  <td style={{ ...S.tdR, fontWeight: 700 }}>{formatCurrency(li.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Özet */}
      <div style={S.card}>
        <div style={S.cardHeader}><p style={S.cardTitle}>Fiyat Özeti</p></div>
        <div style={{ ...S.cardBody, maxWidth: 320, marginLeft: "auto" }}>
          <div style={S.summaryRow}><span>Parça / Malzeme:</span><span>{formatCurrency(partsTotal)}</span></div>
          {quote.labor_cost > 0 && <div style={S.summaryRow}><span>İşçilik:</span><span>{formatCurrency(quote.labor_cost)}</span></div>}
          {quote.kdv_enabled && <div style={{ ...S.summaryRow, color: "#b45309" }}><span>KDV (%20):</span><span>+{formatCurrency(quote.kdv_amount)}</span></div>}
          <div style={S.summaryTotal}><span>GENEL TOPLAM:</span><span style={{ color: "#4f46e5" }}>{formatCurrency(quote.grand_total)}</span></div>
        </div>
      </div>

      {/* Not */}
      {quote.notes && (
        <div style={S.card}>
          <div style={S.cardHeader}><p style={S.cardTitle}>Not</p></div>
          <div style={S.cardBody}>
            <p style={{ fontSize: 13, color: "#475569", margin: 0, whiteSpace: "pre-wrap" }}>{quote.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
