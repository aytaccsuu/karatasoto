"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeftIcon, PlusIcon, TruckIcon, WrenchScrewdriverIcon,
  BanknotesIcon, PencilIcon, XMarkIcon, DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, PAYMENT_TYPE_LABELS } from "@/lib/utils";
import type { Customer, Vehicle, DebtTransaction, ServiceRecord } from "@/types";

interface CustomerDetail extends Customer {
  vehicles?: Vehicle[];
  debt_transactions?: DebtTransaction[];
}

const PAYMENT_BADGE: Record<string, React.CSSProperties> = {
  veresiye: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" },
  nakit: { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
  kredi_karti: { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" },
  eft_havale: { backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" },
};

const S = {
  page: {} as React.CSSProperties,
  backRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 } as React.CSSProperties,
  backBtn: { display: "flex", alignItems: "center", color: "#64748b", textDecoration: "none" } as React.CSSProperties,
  pageTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 16 } as React.CSSProperties,
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" } as React.CSSProperties,
  cardTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 } as React.CSSProperties,
  cardBody: { padding: 16 } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thR: { textAlign: "right" as const, padding: "8px 12px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f8fafc", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdR: { padding: "10px 12px", borderBottom: "1px solid #f8fafc", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"nakit" | "kredi_karti" | "eft_havale">("nakit");
  const [payServiceId, setPayServiceId] = useState("");
  const [paying, setPaying] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  async function load() {
    const [custRes, svcRes] = await Promise.all([
      fetch(`/api/customers/${id}`),
      fetch(`/api/services?customer_id=${id}`),
    ]);
    const custData = await custRes.json();
    const svcData = await svcRes.json();
    setCustomer(custData.data);
    setServices(svcData.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function openPdfPreview() {
    setPdfPreviewUrl(`/api/reports/pdf/customer/${id}`);
  }

  function closePdfPreview() {
    setPdfPreviewUrl(null);
  }

  async function handleWpShare(apiUrl: string, filename: string) {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        toast.error("Bu cihaz dosya paylaşımını desteklemiyor");
      }
    } catch {
      toast.error("Paylaşım başarısız");
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error("Geçersiz tutar"); return; }
    setPaying(true);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: id, amount, description: payMethod === "nakit" ? "Nakit ödeme" : "Kredi kartı ödemesi", service_record_id: payServiceId || null }),
    });
    if (res.ok) {
      toast.success("Ödeme kaydedildi");
      setPayModal(false);
      setPayAmount("");
      setPayMethod("nakit");
      setPayServiceId("");
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Hata oluştu");
    }
    setPaying(false);
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={S.spinner} />
    </div>
  );

  if (!customer) return <p style={{ color: "#64748b", fontSize: 13 }}>Müşteri bulunamadı.</p>;

  const hasDebt = customer.total_debt > 0;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tr:hover td { background-color: #f8fafc; }
        .cust-svc-table { display: block; }
        .cust-svc-cards { display: none; }
        @media (max-width: 640px) {
          .cust-svc-table { display: none; }
          .cust-svc-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px; }
        }
      `}</style>

      {/* PDF Önizleme Modal */}
      {pdfPreviewUrl && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, width: "100%", maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>PDF Önizleme</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={pdfPreviewUrl} download={`musteri_${id.slice(0,8)}.pdf`} style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#dc2626", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", textDecoration: "none" }}>
                  <DocumentArrowDownIcon style={{ width: 15, height: 15 }} /> İndir
                </a>
                <button onClick={() => handleWpShare(pdfPreviewUrl!, `musteri_${id.slice(0,8)}.pdf`)} style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#25d366", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  <svg style={{ width: 14, height: 14, fill: "currentColor" }} viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WP ile Gönder
                </button>
                <button onClick={closePdfPreview} style={{ display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "#f1f5f9", color: "#475569", padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  <XMarkIcon style={{ width: 15, height: 15 }} /> Kapat
                </button>
              </div>
            </div>
            <object data={pdfPreviewUrl} type="application/pdf" style={{ flex: 1, border: "none", minHeight: 500, width: "100%" }}><p style={{ padding: 16, color: "#64748b" }}>PDF görüntülenemiyor. <a href={pdfPreviewUrl ?? ""} target="_blank" style={{ color: "#4f46e5" }}>Yeni sekmede aç</a></p></object>
          </div>
        </div>
      )}

      {/* Başlık */}
      <div style={S.backRow}>
        <Link href="/customers" style={S.backBtn}>
          <ChevronLeftIcon style={{ width: 18, height: 18 }} />
        </Link>
        <h1 style={S.pageTitle}>{customer.first_name} {customer.last_name}</h1>
      </div>

      {/* Müşteri bilgileri kartı */}
      <div style={S.card}>
        <div style={{ padding: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>
                {customer.first_name?.[0]}{customer.last_name?.[0]}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{customer.first_name} {customer.last_name}</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{customer.phone || "Telefon yok"}</p>
              </div>
            </div>

            {/* Borç durumu */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>Toplam Veresiye:</span>
              {hasDebt ? (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{formatCurrency(customer.total_debt)}</span>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>Borç yok</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {hasDebt && (
              <button
                onClick={() => setPayModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#059669", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                <BanknotesIcon style={{ width: 16, height: 16 }} />
                Ödeme Al
              </button>
            )}
            <button
              onClick={openPdfPreview}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#fff", color: "#7c3aed", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #ddd6fe", cursor: "pointer" }}
            >
              <DocumentArrowDownIcon style={{ width: 15, height: 15 }} />
              PDF İndir
            </button>
            {customer.phone && (
              <a
                href={`https://wa.me/${customer.phone.replace(/\D/g, "").replace(/^0/, "90")}?text=${encodeURIComponent(`Sayın ${customer.first_name} ${customer.last_name}, hesap özetinizi aşağıdaki linkten görüntüleyebilirsiniz:\n${window.location.origin}/api/reports/pdf/customer/${id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#25d366", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", textDecoration: "none" }}
              >
                <svg style={{ width: 15, height: 15, fill: "currentColor" }} viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            <button
              onClick={() => router.push(`/customers/${id}/edit`)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#fff", color: "#475569", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0", cursor: "pointer" }}
            >
              <PencilIcon style={{ width: 14, height: 14 }} />
              Düzenle
            </button>
          </div>
        </div>
      </div>

      {/* Araçlar */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h2 style={S.cardTitle}>
            <TruckIcon style={{ width: 16, height: 16, color: "#7c3aed" }} />
            Araçlar
          </h2>
          <Link href={`/vehicles/new?customer_id=${id}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>
            <PlusIcon style={{ width: 14, height: 14 }} /> Yeni Araç
          </Link>
        </div>
        <div style={S.cardBody}>
          {!customer.vehicles?.length ? (
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Araç bulunamadı.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {customer.vehicles.map((v) => (
                <Link key={v.id} href={`/vehicles/${v.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", textDecoration: "none" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{v.plate}</p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{v.brand} {v.model}{v.year ? ` (${v.year})` : ""}</p>
                  </div>
                  {v.km && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{v.km.toLocaleString("tr-TR")} km</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Servis geçmişi */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h2 style={S.cardTitle}>
            <WrenchScrewdriverIcon style={{ width: 16, height: 16, color: "#d97706" }} />
            Servis Geçmişi
          </h2>
          <Link href={`/services/new?customer_id=${id}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>
            <PlusIcon style={{ width: 14, height: 14 }} /> Yeni Servis
          </Link>
        </div>
        {!services.length ? (
          <div style={{ ...S.cardBody }}>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Henüz servis kaydı yok.</p>
          </div>
        ) : (
          <>
            {/* Masaüstü tablo */}
            <div className="cust-svc-table" style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Tarih</th>
                    <th style={S.th}>Plaka</th>
                    <th style={S.thR}>Toplam</th>
                    <th style={S.th}>Ödeme</th>
                    <th style={{ ...S.th, width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td style={{ ...S.td, color: "#64748b", whiteSpace: "nowrap" }}>{formatDate(s.service_date)}</td>
                      <td style={{ ...S.td, fontWeight: 700, color: "#0f172a" }}>{(s.vehicle as { plate: string })?.plate}</td>
                      <td style={{ ...S.tdR, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(s.grand_total)}</td>
                      <td style={S.td}>
                        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...(PAYMENT_BADGE[s.payment_type] ?? {}) }}>
                          {PAYMENT_TYPE_LABELS[s.payment_type]}
                        </span>
                      </td>
                      <td style={S.td}>
                        <Link href={`/services/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>Detay</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobil kart listesi */}
            <div className="cust-svc-cards">
              {services.map((s) => (
                <div key={s.id} style={{ backgroundColor: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{(s.vehicle as { plate: string })?.plate}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>{formatDate(s.service_date)}</span>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...(PAYMENT_BADGE[s.payment_type] ?? {}) }}>
                      {PAYMENT_TYPE_LABELS[s.payment_type]}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(s.grand_total)}</span>
                    <Link href={`/services/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}>Detay →</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Veresiye hareketleri */}
      {(customer.debt_transactions?.length || 0) > 0 && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h2 style={S.cardTitle}>
              <BanknotesIcon style={{ width: 16, height: 16, color: "#dc2626" }} />
              Veresiye Hareketleri
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Tarih</th>
                  <th style={S.th}>Açıklama</th>
                  <th style={S.thR}>Tutar</th>
                  <th style={S.thR}>Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {customer.debt_transactions?.map((t) => (
                  <tr key={t.id}>
                    <td style={{ ...S.td, color: "#64748b", whiteSpace: "nowrap", fontSize: 12 }}>{formatDate(t.created_at)}</td>
                    <td style={{ ...S.td, fontSize: 12, color: "#475569" }}>{t.description || "—"}</td>
                    <td style={{ ...S.tdR, fontWeight: 700, fontSize: 12, color: t.amount > 0 ? "#dc2626" : "#16a34a" }}>
                      {t.amount > 0 ? "+" : ""}{formatCurrency(t.amount)}
                    </td>
                    <td style={{ ...S.tdR, fontSize: 12, fontWeight: 600, color: "#475569" }}>{formatCurrency(t.balance_after)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ödeme Al Modal */}
      {payModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {/* Modal başlık */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BanknotesIcon style={{ width: 16, height: 16, color: "#059669" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>Ödeme Al</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{customer.first_name} {customer.last_name}</p>
                </div>
              </div>
              <button onClick={() => setPayModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8" }}>
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Mevcut borç */}
            <div style={{ margin: "16px 20px 0", padding: "10px 14px", backgroundColor: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
              <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Mevcut Borç</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", margin: 0 }}>{formatCurrency(customer.total_debt)}</p>
            </div>

            {/* Form */}
            <form onSubmit={handlePayment} style={{ padding: "16px 20px 20px" }}>
              {/* Servis seçimi */}
              {services.filter(s => s.payment_type === "veresiye").length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    İlgili Servis (opsiyonel)
                  </label>
                  <select
                    value={payServiceId}
                    onChange={(e) => setPayServiceId(e.target.value)}
                    style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box", backgroundColor: "#fff" }}
                  >
                    <option value="">— Servis seçin (opsiyonel)</option>
                    {services
                      .filter(s => s.payment_type === "veresiye")
                      .map(s => {
                        const v = s.vehicle as { plate: string } | undefined;
                        return (
                          <option key={s.id} value={s.id}>
                            {formatDate(s.service_date)} — {v?.plate} — {formatCurrency(s.grand_total)}
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}
              {/* Ödeme yöntemi */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Ödeme Yöntemi
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {([
                    { key: "nakit",       label: "Nakit",       color: "#059669", bg: "#f0fdf4" },
                    { key: "kredi_karti", label: "Kredi Kartı", color: "#2563eb", bg: "#eff6ff" },
                    { key: "eft_havale",  label: "EFT/Havale",  color: "#7c3aed", bg: "#f5f3ff" },
                  ] as const).map(({ key, label, color, bg }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPayMethod(key)}
                      style={{ flex: 1, minWidth: 90, padding: "8px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: payMethod === key ? `2px solid ${color}` : "1px solid #e2e8f0", backgroundColor: payMethod === key ? bg : "#fff", color: payMethod === key ? color : "#64748b", cursor: "pointer" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Ödeme Tutarı (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 16, fontWeight: 600, color: "#0f172a", outline: "none", boxSizing: "border-box", backgroundColor: "#fff" }}
                  autoFocus
                />
              </div>

              {/* Kalan borç önizleme */}
              {payAmount && parseFloat(payAmount) > 0 && (
                <div style={{ marginBottom: 16, padding: "8px 12px", backgroundColor: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 2px 0" }}>Ödeme sonrası kalan borç</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#059669", margin: 0 }}>
                    {formatCurrency(Math.max(0, customer.total_debt - parseFloat(payAmount)))}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={paying}
                  style={{ flex: 1, backgroundColor: paying ? "#6ee7b7" : "#059669", color: "#fff", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.8 : 1 }}
                >
                  {paying ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPayModal(false); setPayAmount(""); setPayMethod("nakit" as const); setPayServiceId(""); }}
                  style={{ flex: 1, backgroundColor: "#fff", color: "#475569", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0", cursor: "pointer" }}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
