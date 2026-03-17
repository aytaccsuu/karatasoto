"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, TrashIcon, DocumentArrowDownIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface QuoteLineItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface EditableItem {
  name: string;
  _qty: string;
  _price: string;
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
  inp: { border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 7px", fontSize: 12, outline: "none", background: "#fff", textAlign: "right" as const } as React.CSSProperties,
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFilename, setPdfPreviewFilename] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  // İşçilik düzenleme
  const [editLabor, setEditLabor] = useState(false);
  const [laborInput, setLaborInput] = useState("");
  const [laborLoading, setLaborLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/quotes/${id}`, { cache: "no-store" });
    const data = await res.json();
    setQuote(data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function enterEditMode() {
    if (!quote) return;
    setEditItems(quote.line_items.map((li) => ({
      name: li.name,
      _qty: String(li.quantity),
      _price: String(li.unit_price),
    })));
    setEditMode(true);
  }

  function exitEditMode() {
    setEditMode(false);
    setEditItems([]);
  }

  async function handleLaborSave() {
    const val = parseFloat(laborInput);
    if (isNaN(val) || val < 0) { toast.error("Geçersiz işçilik ücreti"); return; }
    setLaborLoading(true);
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labor_cost: val }),
    });
    if (res.ok) {
      toast.success("İşçilik güncellendi");
      setEditLabor(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Güncellenemedi");
    }
    setLaborLoading(false);
  }

  // Anlık önizleme
  const laborNum = quote?.labor_cost || 0;
  const previewItems = editItems.map((ei) => ({
    name: ei.name,
    quantity: parseFloat(ei._qty) || 0,
    unit_price: parseFloat(ei._price) || 0,
    line_total: Math.round((parseFloat(ei._qty) || 0) * (parseFloat(ei._price) || 0) * 100) / 100,
  }));
  const previewParts = previewItems.reduce((s, li) => s + li.line_total, 0);
  const previewSubtotal = previewParts + laborNum;
  const previewKdv = quote?.kdv_enabled ? Math.round(previewSubtotal * 0.20 * 100) / 100 : 0;
  const previewGrand = Math.round((previewSubtotal + previewKdv) * 100) / 100;

  const isDirty = editItems.some((ei, i) => {
    const orig = quote?.line_items[i];
    return !orig || ei._qty !== String(orig.quantity) || ei._price !== String(orig.unit_price);
  });

  async function handleSaveItems() {
    for (const ei of editItems) {
      const q = parseFloat(ei._qty);
      const p = parseFloat(ei._price);
      if (!q || q <= 0) { toast.error("Tüm adetler 0'dan büyük olmalı"); return; }
      if (isNaN(p) || p < 0) { toast.error("Birim fiyat geçersiz"); return; }
    }
    setSaveLoading(true);
    const items = editItems.map((ei) => ({
      name: ei.name,
      quantity: parseFloat(ei._qty),
      unit_price: parseFloat(ei._price),
    }));
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line_items: items }),
    });
    if (res.ok) {
      toast.success("Kalemler güncellendi");
      setEditMode(false);
      load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Kaydedilemedi");
    }
    setSaveLoading(false);
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Durum güncellendi"); load(); }
    else toast.error("Güncelleme başarısız");
    setUpdatingStatus(false);
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/reports/pdf/quote/${id}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewFilename(`teklif_${quote?.quote_number ?? id.slice(0, 8)}.pdf`);
      setPdfPreviewUrl(url);
    } catch { toast.error("PDF yüklenemedi"); }
    setPdfLoading(false);
  }

  function handlePdfDownload() {
    if (!pdfPreviewUrl) return;
    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    a.download = pdfPreviewFilename;
    a.click();
  }

  function closePdfPreview() {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  }

  async function executeDelete() {
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setConfirmOpen(false);
    if (res.ok) { toast.success("Teklif silindi"); router.push("/quotes"); }
    else toast.error("Silinemedi");
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  if (!quote) return <p style={{ color: "#64748b", fontSize: 13 }}>Teklif bulunamadı.</p>;

  const displayItems = editMode ? previewItems : quote.line_items;
  const displayParts = editMode ? previewParts : (quote.line_items || []).reduce((s, li) => s + li.line_total, 0);
  const displayKdv = editMode ? previewKdv : quote.kdv_amount;
  const displayGrand = editMode ? previewGrand : quote.grand_total;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* PDF Önizleme Modal */}
      {pdfPreviewUrl && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, width: "100%", maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>PDF Önizleme</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handlePdfDownload} style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#dc2626", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  <DocumentArrowDownIcon style={{ width: 15, height: 15 }} /> İndir
                </button>
                <button onClick={closePdfPreview} style={{ display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "#f1f5f9", color: "#475569", padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                  <XMarkIcon style={{ width: 15, height: 15 }} /> Kapat
                </button>
              </div>
            </div>
            <iframe src={pdfPreviewUrl} style={{ flex: 1, border: "none", minHeight: 500 }} title="PDF Önizleme" />
          </div>
        </div>
      )}

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
            <button onClick={downloadPdf} disabled={pdfLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#dc2626", color: "#fff", padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: pdfLoading ? "not-allowed" : "pointer", opacity: pdfLoading ? 0.6 : 1 }}>
              <DocumentArrowDownIcon style={{ width: 14, height: 14 }} />
              {pdfLoading ? "..." : "PDF İndir"}
            </button>
            <button onClick={() => setConfirmOpen(true)} style={S.deleteBtn}>
              <TrashIcon style={{ width: 14, height: 14 }} /> Sil
            </button>
          </div>
        </div>
      </div>

      {/* Durum */}
      <div style={S.card}>
        <div style={S.cardHeader}><p style={S.cardTitle}>Durum</p></div>
        <div style={{ ...S.cardBody, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} disabled={updatingStatus || quote.status === opt.value} onClick={() => updateStatus(opt.value)}
              style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: quote.status === opt.value ? `2px solid ${opt.value === "onaylandi" ? "#16a34a" : opt.value === "reddedildi" ? "#dc2626" : opt.value === "gonderildi" ? "#2563eb" : "#64748b"}` : "1px solid #e2e8f0", backgroundColor: quote.status === opt.value ? (STATUS_STYLE[opt.value]?.backgroundColor ?? "#fff") : "#fff", color: quote.status === opt.value ? (STATUS_STYLE[opt.value]?.color ?? "#475569") : "#64748b", cursor: quote.status === opt.value ? "default" : "pointer", opacity: updatingStatus ? 0.6 : 1 }}>
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
                : quote.customer_name || "—"}
            </p>
          </div>
          <div><p style={S.infoLabel}>Araç</p><p style={S.infoValue}>{quote.vehicle_info || "—"}</p></div>
          <div><p style={S.infoLabel}>Teklif Tarihi</p><p style={S.infoValue}>{formatDate(quote.quote_date)}</p></div>
          <div><p style={S.infoLabel}>Geçerlilik</p><p style={S.infoValue}>{quote.valid_until ? formatDate(quote.valid_until) : "—"}</p></div>
        </div>
      </div>

      {/* Kalemler */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <p style={S.cardTitle}>Teklif Kalemleri</p>
          {!editMode ? (
            <button onClick={enterEditMode}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
              <PencilSquareIcon style={{ width: 14, height: 14 }} />
              Düzenle
            </button>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Adet ve fiyatı düzenleyebilirsiniz</span>
              <button onClick={handleSaveItems} disabled={!isDirty || saveLoading}
                style={{ fontSize: 12, background: isDirty ? "#4f46e5" : "#e2e8f0", color: isDirty ? "#fff" : "#94a3b8", border: "none", borderRadius: 6, padding: "5px 14px", cursor: isDirty && !saveLoading ? "pointer" : "default", fontWeight: 600 }}>
                {saveLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button onClick={exitEditMode}
                style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer" }}>
                <XMarkIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Ürün / Hizmet</th>
                <th style={{ ...S.thR, width: editMode ? 90 : 60 }}>Adet</th>
                <th style={{ ...S.thR, width: editMode ? 130 : 120 }}>Birim Fiyat</th>
                <th style={{ ...S.thR, width: 120 }}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((li, i) => {
                if (!editMode) {
                  return (
                    <tr key={i}>
                      <td style={S.td}>{li.name}</td>
                      <td style={{ ...S.tdR, color: "#64748b" }}>{li.quantity}</td>
                      <td style={S.tdR}>{formatCurrency(li.unit_price)}</td>
                      <td style={{ ...S.tdR, fontWeight: 700 }}>{formatCurrency(li.line_total)}</td>
                    </tr>
                  );
                }
                const ei = editItems[i];
                const origTotal = quote.line_items[i]?.line_total ?? 0;
                const prevTotal = Math.round((parseFloat(ei._qty) || 0) * (parseFloat(ei._price) || 0) * 100) / 100;
                const changed = Math.abs(prevTotal - origTotal) > 0.001;
                return (
                  <tr key={i} style={{ background: changed ? "#f0f4ff" : undefined }}>
                    <td style={S.td}>{li.name}</td>
                    <td style={{ ...S.tdR, padding: "7px 12px" }}>
                      <input
                        type="number" min="0.001" step="0.001"
                        value={ei._qty}
                        onChange={(e) => setEditItems((prev) => prev.map((x, j) => j === i ? { ...x, _qty: e.target.value } : x))}
                        onKeyDown={(e) => { if (e.key === "Enter" && isDirty) handleSaveItems(); if (e.key === "Escape") exitEditMode(); }}
                        style={{ ...S.inp, width: 70 }}
                      />
                    </td>
                    <td style={{ ...S.tdR, padding: "7px 12px" }}>
                      <input
                        type="number" min="0" step="0.01"
                        value={ei._price}
                        onChange={(e) => setEditItems((prev) => prev.map((x, j) => j === i ? { ...x, _price: e.target.value } : x))}
                        onKeyDown={(e) => { if (e.key === "Enter" && isDirty) handleSaveItems(); if (e.key === "Escape") exitEditMode(); }}
                        style={{ ...S.inp, width: 90 }}
                      />
                    </td>
                    <td style={{ ...S.tdR, fontWeight: 700, color: changed ? "#4f46e5" : undefined }}>
                      {formatCurrency(prevTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Özet */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <p style={S.cardTitle}>
            Fiyat Özeti
            {editMode && isDirty && <span style={{ color: "#4f46e5", fontSize: 10, fontWeight: 400, marginLeft: 8 }}>önizleme</span>}
          </p>
        </div>
        <div style={{ ...S.cardBody, maxWidth: 320, marginLeft: "auto" }}>
          <div style={S.summaryRow}><span>Parça / Malzeme:</span><span>{formatCurrency(displayParts)}</span></div>
          <div style={{ ...S.summaryRow, alignItems: "center" }}>
            <span>İşçilik:</span>
            {!editLabor ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{laborNum > 0 ? formatCurrency(laborNum) : "—"}</span>
                <button
                  onClick={() => { setLaborInput(laborNum > 0 ? String(laborNum) : ""); setEditLabor(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontWeight: 600 }}>
                  <PencilSquareIcon style={{ width: 11, height: 11 }} />
                  {laborNum > 0 ? "Düzenle" : "Ekle"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  step="0.01"
                  value={laborInput}
                  onChange={(e) => setLaborInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLaborSave(); if (e.key === "Escape") setEditLabor(false); }}
                  style={{ ...S.inp, width: 90 }}
                />
                <button
                  onClick={handleLaborSave}
                  disabled={laborLoading}
                  style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#4f46e5", border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>
                  {laborLoading ? "..." : "Kaydet"}
                </button>
                <button
                  onClick={() => setEditLabor(false)}
                  style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            )}
          </div>
          {quote.kdv_enabled && <div style={{ ...S.summaryRow, color: "#b45309" }}><span>KDV (%20):</span><span>+{formatCurrency(displayKdv)}</span></div>}
          <div style={{ ...S.summaryTotal }}>
            <span>GENEL TOPLAM:</span>
            <span style={{ color: "#4f46e5" }}>{formatCurrency(displayGrand)}</span>
          </div>
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
