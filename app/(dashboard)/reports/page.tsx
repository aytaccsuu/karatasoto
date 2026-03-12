"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, formatDateTime, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_COLORS } from "@/lib/utils";

interface ServiceRow {
  id: string;
  service_date: string;
  km_at_service?: number | null;
  labor_cost: number;
  parts_total: number;
  grand_total: number;
  kdv_enabled?: boolean;
  kdv_amount?: number;
  payment_type: string;
  debt_added: number;
  notes?: string | null;
  created_at: string;
  vehicle?: { plate: string; brand: string; model: string } | null;
  customer?: { id: string; first_name: string; last_name: string; phone?: string | null } | null;
  line_items?: { name: string; quantity: number; unit_price: number; line_total: number; sort_order: number }[];
}

interface PaymentRow {
  id: string;
  transaction_type: string;
  amount: number;
  description?: string | null;
  balance_after: number;
  created_at: string;
  customer?: { id: string; first_name: string; last_name: string; phone?: string | null } | null;
  service_record?: { id: string; service_date: string; vehicle?: { plate: string } | null } | null;
}

interface Summary {
  total_services: number;
  total_revenue: number;
  by_payment: { nakit: number; kredi_karti: number; eft_havale: number; veresiye: number };
  total_labor: number;
  total_parts: number;
  total_payments_received: number;
}

const TH: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const TR: React.CSSProperties = { textAlign: "right", padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const TD: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#334155", verticalAlign: "top" };
const TDR: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#334155", textAlign: "right", verticalAlign: "top" };

function PayBadge({ type }: { type: string }) {
  const color = PAYMENT_TYPE_COLORS[type] || "#64748b";
  const label = PAYMENT_TYPE_LABELS[type] || type;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: color + "18", borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const TX_LABELS: Record<string, string> = {
  veresiye: "Borç Oluştu",
  odeme: "Ödeme Alındı",
  duzeltme: "Düzeltme",
};
const TX_COLORS: Record<string, string> = {
  veresiye: "#dc2626",
  odeme: "#16a34a",
  duzeltme: "#7c3aed",
};

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + "-01";

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [tab, setTab] = useState<"services" | "payments">("services");
  const [data, setData] = useState<{ services: ServiceRow[]; payments: PaymentRow[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const res = await fetch(`/api/reports/data?${p}`, { cache: "no-store" });
    if (res.ok) {
      setData(await res.json());
    } else {
      toast.error("Veri yüklenemedi");
    }
    setLoading(false);
  }

  async function downloadExcel() {
    setXlsxLoading(true);
    try {
      const p = new URLSearchParams();
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      const res = await fetch(`/api/reports/excel?${p}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karatasoto_servis_${today}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel indirildi");
    } catch {
      toast.error("Excel indirme başarısız");
    }
    setXlsxLoading(false);
  }

  const inp: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#0f172a", backgroundColor: "#fff", outline: "none" };
  const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" };

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>Raporlar</h1>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>Servis işlemleri ve ödeme hareketleri</p>

      {/* Filtre satırı */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Başlangıç</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inp} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Bitiş</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inp} />
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{ backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Yükleniyor..." : "Raporu Getir"}
        </button>
        <button
          onClick={downloadExcel}
          disabled={xlsxLoading}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: xlsxLoading ? "not-allowed" : "pointer", opacity: xlsxLoading ? 0.7 : 1 }}>
          <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
          Excel İndir
        </button>
      </div>

      {/* Özet kartlar */}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Toplam Servis", value: data.summary.total_services.toString(), color: "#4f46e5" },
              { label: "Toplam Gelir", value: formatCurrency(data.summary.total_revenue), color: "#0f172a" },
              { label: "Nakit", value: formatCurrency(data.summary.by_payment.nakit), color: "#16a34a" },
              { label: "Kredi Kartı", value: formatCurrency(data.summary.by_payment.kredi_karti), color: "#2563eb" },
              { label: "EFT/Havale", value: formatCurrency(data.summary.by_payment.eft_havale), color: "#7c3aed" },
              { label: "Veresiye", value: formatCurrency(data.summary.by_payment.veresiye), color: "#dc2626" },
              { label: "Toplam İşçilik", value: formatCurrency(data.summary.total_labor), color: "#475569" },
              { label: "Alınan Ödemeler", value: formatCurrency(data.summary.total_payments_received), color: "#16a34a" },
            ].map((c) => (
              <div key={c.label} style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Tab seçimi */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {(["services", "payments"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", backgroundColor: tab === t ? "#4f46e5" : "#f1f5f9", color: tab === t ? "#fff" : "#64748b" }}>
                {t === "services" ? `Servis Kayıtları (${data.services.length})` : `Ödeme Hareketleri (${data.payments.length})`}
              </button>
            ))}
          </div>

          {/* Servis kayıtları tablosu */}
          {tab === "services" && (
            <div style={card}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Tarih</th>
                      <th style={TH}>Müşteri</th>
                      <th style={TH}>Tel</th>
                      <th style={TH}>Plaka</th>
                      <th style={TH}>Araç</th>
                      <th style={{ ...TR, width: 70 }}>KM</th>
                      <th style={TR}>İşçilik</th>
                      <th style={TR}>Parça</th>
                      <th style={TR}>Toplam</th>
                      <th style={TH}>Ödeme</th>
                      <th style={{ ...TH, width: 30 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.length === 0 && (
                      <tr><td colSpan={11} style={{ ...TD, textAlign: "center", color: "#94a3b8", padding: 24 }}>Bu tarih aralığında servis kaydı yok.</td></tr>
                    )}
                    {data.services.map((svc) => (
                      <>
                        <tr key={svc.id} style={{ cursor: "pointer" }} onClick={() => setExpandedService(expandedService === svc.id ? null : svc.id)}>
                          <td style={{ ...TD, whiteSpace: "nowrap" }}>{formatDate(svc.service_date)}</td>
                          <td style={TD}>
                            {svc.customer ? (
                              <Link href={`/customers/${svc.customer.id}`}
                                style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}
                                onClick={(e) => e.stopPropagation()}>
                                {svc.customer.first_name} {svc.customer.last_name}
                              </Link>
                            ) : "—"}
                          </td>
                          <td style={{ ...TD, whiteSpace: "nowrap", color: "#64748b" }}>{svc.customer?.phone || "—"}</td>
                          <td style={{ ...TD, fontWeight: 700 }}>
                            <Link href={`/services/${svc.id}`} style={{ color: "#4f46e5", textDecoration: "none" }}
                              onClick={(e) => e.stopPropagation()}>
                              {svc.vehicle?.plate || "—"}
                            </Link>
                          </td>
                          <td style={{ ...TD, whiteSpace: "nowrap" }}>{svc.vehicle ? `${svc.vehicle.brand} ${svc.vehicle.model}` : "—"}</td>
                          <td style={{ ...TDR, color: "#64748b" }}>{svc.km_at_service ? svc.km_at_service.toLocaleString("tr-TR") : "—"}</td>
                          <td style={TDR}>{formatCurrency(svc.labor_cost)}</td>
                          <td style={TDR}>{formatCurrency(svc.parts_total)}</td>
                          <td style={{ ...TDR, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(svc.grand_total)}</td>
                          <td style={{ ...TD, whiteSpace: "nowrap" }}><PayBadge type={svc.payment_type} /></td>
                          <td style={{ ...TD, textAlign: "center" }}>
                            <ChevronRightIcon style={{ width: 14, height: 14, color: "#94a3b8", transition: "transform 0.15s", transform: expandedService === svc.id ? "rotate(90deg)" : "rotate(0)" }} />
                          </td>
                        </tr>
                        {expandedService === svc.id && (
                          <tr key={svc.id + "-detail"}>
                            <td colSpan={11} style={{ padding: "0 12px 12px 32px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                              <div style={{ paddingTop: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Yapılan İşlemler</div>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
                                  <thead>
                                    <tr>
                                      {["Ürün / Hizmet", "Adet", "Birim Fiyat", "Tutar"].map((h, i) => (
                                        <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "4px 8px", fontSize: 10, fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(svc.line_items || []).sort((a, b) => a.sort_order - b.sort_order).map((li, i) => (
                                      <tr key={i}>
                                        <td style={{ padding: "5px 8px", fontSize: 12, color: "#334155", borderBottom: "1px solid #f1f5f9" }}>{li.name}</td>
                                        <td style={{ padding: "5px 8px", fontSize: 12, color: "#64748b", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{li.quantity}</td>
                                        <td style={{ padding: "5px 8px", fontSize: 12, color: "#64748b", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCurrency(li.unit_price)}</td>
                                        <td style={{ padding: "5px 8px", fontSize: 12, fontWeight: 600, textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCurrency(li.line_total)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                  {svc.notes && <span style={{ fontSize: 11, color: "#64748b" }}><strong>Not:</strong> {svc.notes}</span>}
                                  {svc.kdv_enabled && <span style={{ fontSize: 11, color: "#b45309" }}>KDV: +{formatCurrency(svc.kdv_amount || 0)}</span>}
                                  {svc.payment_type === "veresiye" && svc.debt_added > 0 && (
                                    <span style={{ fontSize: 11, color: "#dc2626" }}>Borç oluştu: {formatCurrency(svc.debt_added)}</span>
                                  )}
                                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Kayıt: {formatDateTime(svc.created_at)}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ödeme hareketleri tablosu */}
          {tab === "payments" && (
            <div style={card}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Tarih / Saat</th>
                      <th style={TH}>Müşteri</th>
                      <th style={TH}>Tel</th>
                      <th style={TH}>Servis / Plaka</th>
                      <th style={TH}>İşlem</th>
                      <th style={TH}>Açıklama</th>
                      <th style={TR}>Tutar</th>
                      <th style={TR}>Kalan Borç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.length === 0 && (
                      <tr><td colSpan={8} style={{ ...TD, textAlign: "center", color: "#94a3b8", padding: 24 }}>Bu tarih aralığında ödeme hareketi yok.</td></tr>
                    )}
                    {data.payments.map((p) => {
                      const txColor = TX_COLORS[p.transaction_type] || "#64748b";
                      return (
                        <tr key={p.id}>
                          <td style={{ ...TD, whiteSpace: "nowrap", color: "#64748b" }}>{formatDateTime(p.created_at)}</td>
                          <td style={TD}>
                            {p.customer ? (
                              <Link href={`/customers/${p.customer.id}`}
                                style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
                                {p.customer.first_name} {p.customer.last_name}
                              </Link>
                            ) : "—"}
                          </td>
                          <td style={{ ...TD, color: "#64748b" }}>{p.customer?.phone || "—"}</td>
                          <td style={TD}>
                            {p.service_record ? (
                              <Link href={`/services/${p.service_record.id}`}
                                style={{ color: "#4f46e5", textDecoration: "none", display: "flex", flexDirection: "column", gap: 1 }}>
                                <span style={{ fontWeight: 700 }}>{p.service_record.vehicle?.plate || "—"}</span>
                                <span style={{ fontSize: 10, color: "#94a3b8" }}>{formatDate(p.service_record.service_date)}</span>
                              </Link>
                            ) : "—"}
                          </td>
                          <td style={TD}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: txColor, background: txColor + "18", borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap" }}>
                              {TX_LABELS[p.transaction_type] || p.transaction_type}
                            </span>
                          </td>
                          <td style={{ ...TD, color: "#64748b" }}>{p.description || "—"}</td>
                          <td style={{ ...TDR, fontWeight: 700, color: txColor }}>
                            {p.amount >= 0 ? "+" : ""}{formatCurrency(p.amount)}
                          </td>
                          <td style={{ ...TDR, color: "#475569" }}>{formatCurrency(p.balance_after)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div style={{ backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Tarih aralığı seçip <strong style={{ color: "#4f46e5" }}>Raporu Getir</strong> butonuna basın</p>
        </div>
      )}
    </div>
  );
}
