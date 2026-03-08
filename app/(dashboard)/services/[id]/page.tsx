"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeftIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, PAYMENT_TYPE_LABELS } from "@/lib/utils";
import type { ServiceRecord, DebtTransaction } from "@/types";

interface ServiceRecordWithTransactions extends ServiceRecord {
  debt_transactions?: DebtTransaction[];
}

const S = {
  page: {} as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 16 } as React.CSSProperties,
  cardBody: { padding: 20 } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #f1f5f9" },
  thR: { textAlign: "right" as const, padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 0", borderBottom: "1px solid #f8fafc", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdR: { padding: "10px 0", borderBottom: "1px solid #f8fafc", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ServiceRecordWithTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then((r) => r.json())
      .then((d) => { setRecord(d.data); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Bu servis kaydını silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Silindi");
      router.push("/services");
    } else {
      toast.error("Silme başarısız");
    }
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/reports/pdf/${id}`);
      if (!res.ok) throw new Error("PDF oluşturulamadı");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `servis_${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF indirme başarısız");
    }
    setPdfLoading(false);
  }

  async function downloadExcel() {
    const res = await fetch(`/api/reports/excel?serviceId=${id}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servis_${id.slice(0, 8)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={S.spinner} />
    </div>
  );
  if (!record) return <p style={{ color: "#64748b", fontSize: 13 }}>Servis kaydı bulunamadı.</p>;

  const vehicle = record.vehicle as { plate: string; brand: string; model: string; km?: number } | undefined;
  const customer = record.customer as { id: string; first_name: string; last_name: string; phone?: string; total_debt: number } | undefined;
  const lineItems = record.line_items || [];
  const transactions = record.debt_transactions || [];

  // Bu servise ait ödemeler
  const payments = transactions.filter((t) => t.transaction_type === "odeme");
  const totalPaid = payments.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const isVeresiye = record.payment_type === "veresiye";
  const paymentColor =
    record.payment_type === "veresiye" ? "#dc2626" :
    record.payment_type === "nakit" ? "#16a34a" : "#2563eb";

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .svc-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; }
        .svc-summary { margin-left: auto; max-width: 340px; }
        @media (max-width: 600px) {
          .svc-info-grid { grid-template-columns: 1fr; gap: 6px; }
          .svc-summary { margin-left: 0; max-width: 100%; }
        }
      `}</style>

      {/* Başlık */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Link href="/services" style={{ display: "flex", alignItems: "center", color: "#64748b", textDecoration: "none" }}>
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" }}>
          Servis Fişi
        </h1>
        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>#{id.slice(0, 8)}</span>
      </div>

      {/* Aksiyon butonları */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <button
          onClick={downloadPdf}
          disabled={pdfLoading}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#dc2626", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: pdfLoading ? "not-allowed" : "pointer", opacity: pdfLoading ? 0.6 : 1 }}
        >
          <DocumentArrowDownIcon style={{ width: 16, height: 16 }} />
          {pdfLoading ? "..." : "PDF İndir"}
        </button>
        <button
          onClick={downloadExcel}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#059669", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          <TableCellsIcon style={{ width: 16, height: 16 }} />
          Excel
        </button>
        <button
          onClick={handleDelete}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#fff", color: "#ef4444", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #fecaca", cursor: "pointer" }}
        >
          Sil
        </button>
      </div>

      {/* Başlık bilgisi */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <div className="svc-info-grid">
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Tarih: </span>
              <span style={{ fontWeight: 500, color: "#0f172a" }}>{formatDate(record.service_date)}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Plaka: </span>
              <Link href={`/vehicles/${record.vehicle_id}`} style={{ fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>{vehicle?.plate}</Link>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Müşteri: </span>
              <Link href={`/customers/${record.customer_id}`} style={{ fontWeight: 500, color: "#4f46e5", textDecoration: "none" }}>
                {customer?.first_name} {customer?.last_name}
              </Link>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>Araç: </span>
              <span style={{ fontWeight: 500, color: "#0f172a" }}>{vehicle?.brand} {vehicle?.model}</span>
            </div>
            {record.km_at_service && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>KM: </span>
                <span style={{ fontWeight: 500, color: "#0f172a" }}>{record.km_at_service.toLocaleString("tr-TR")} km</span>
              </div>
            )}
            {customer?.phone && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Tel: </span>
                <span style={{ fontWeight: 500, color: "#0f172a" }}>{customer.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kalemler */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 12px 0" }}>Yapılan İşlemler</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Ürün / Hizmet</th>
                  <th style={{ ...S.thR, width: 60 }}>Adet</th>
                  <th style={{ ...S.thR, width: 130 }}>Birim Fiyat</th>
                  <th style={{ ...S.thR, width: 130 }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {lineItems
                  .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
                  .map((item: { id: string; name: string; quantity: number; unit_price: number; line_total: number }) => (
                    <tr key={item.id}>
                      <td style={S.td}>{item.name}</td>
                      <td style={S.tdR}>{item.quantity}</td>
                      <td style={S.tdR}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ ...S.tdR, fontWeight: 600 }}>{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Özet */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <div className="svc-summary">
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                <span>Parça Toplamı:</span>
                <span>{formatCurrency(record.parts_total)}</span>
              </div>
              {record.labor_cost > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                  <span>İşçilik:</span>
                  <span>{formatCurrency(record.labor_cost)}</span>
                </div>
              )}
              {(record as ServiceRecordWithTransactions & { kdv_enabled?: boolean; kdv_amount?: number }).kdv_enabled && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#b45309" }}>
                  <span>KDV (%20):</span>
                  <span>+{formatCurrency((record as ServiceRecordWithTransactions & { kdv_amount?: number }).kdv_amount || 0)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 2 }}>
                <span>GENEL TOPLAM:</span>
                <span style={{ color: "#4f46e5" }}>{formatCurrency(record.grand_total)}</span>
              </div>

              {/* Ödeme türü */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 2 }}>
                <span style={{ color: "#64748b" }}>Ödeme Türü:</span>
                <span style={{ fontWeight: 600, color: paymentColor }}>
                  {PAYMENT_TYPE_LABELS[record.payment_type]}
                </span>
              </div>

              {/* Veresiye ise borç/ödeme detayları */}
              {isVeresiye && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Bu Serviste Oluşan Borç:</span>
                    <span style={{ fontWeight: 600, color: "#dc2626" }}>{formatCurrency(record.debt_added)}</span>
                  </div>
                  {totalPaid > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>Sonradan Ödenen:</span>
                      <span style={{ fontWeight: 600, color: "#16a34a" }}>-{formatCurrency(totalPaid)}</span>
                    </div>
                  )}
                  {customer && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px solid #fecaca", paddingTop: 8, marginTop: 2 }}>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>Müşteri Toplam Borcu:</span>
                      <span style={{ fontWeight: 700, color: "#dc2626" }}>{formatCurrency(customer.total_debt)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {record.notes && (
            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 16, paddingTop: 14, fontSize: 13, color: "#475569" }}>
              <span style={{ fontWeight: 600, color: "#374151" }}>Not: </span>{record.notes}
            </div>
          )}
        </div>
      </div>

      {/* Bu servise ait ödeme hareketleri */}
      {payments.length > 0 && (
        <div style={S.card}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>Bu Servise Ait Ödemeler</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" as const, padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Tarih</th>
                  <th style={{ textAlign: "left" as const, padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Açıklama</th>
                  <th style={{ textAlign: "right" as const, padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Ödenen</th>
                  <th style={{ textAlign: "right" as const, padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>Kalan Borç</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(t.created_at)}</td>
                    <td style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#475569" }}>{t.description || "—"}</td>
                    <td style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 13, fontWeight: 700, color: "#16a34a", textAlign: "right" }}>{formatCurrency(Math.abs(t.amount))}</td>
                    <td style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 12, fontWeight: 600, color: "#475569", textAlign: "right" }}>{formatCurrency(t.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
