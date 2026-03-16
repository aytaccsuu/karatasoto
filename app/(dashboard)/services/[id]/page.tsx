"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeftIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency, formatDate, PAYMENT_TYPE_LABELS } from "@/lib/utils";
import type { ServiceRecord, DebtTransaction, Product } from "@/types";

interface ServiceAuditLog {
  id: string;
  action: "add" | "remove";
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  note?: string | null;
  created_at: string;
}

interface ServiceRecordFull extends ServiceRecord {
  debt_transactions?: DebtTransaction[];
  service_item_audit?: ServiceAuditLog[];
}

interface RemoveTarget {
  id: string;
  name: string;
  note: string;
}

interface AddForm {
  product_id: string;
  name: string;
  quantity: string;
  unit_price: string;
  note: string;
}

const S = {
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 16 } as React.CSSProperties,
  cardBody: { padding: 20 } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #f1f5f9" },
  thR: { textAlign: "right" as const, padding: "8px 0", fontSize: 12, fontWeight: 600, color: "#64748b", borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 0", borderBottom: "1px solid #f8fafc", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdR: { padding: "10px 0", borderBottom: "1px solid #f8fafc", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
  input: { border: "1px solid #d1d5db", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", background: "#fff" } as React.CSSProperties,
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<ServiceRecordFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ product_id: "", name: "", quantity: "1", unit_price: "", note: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  // Ödeme türü düzenleme
  const [editPayType, setEditPayType] = useState(false);
  const [payTypeLoading, setPayTypeLoading] = useState(false);
  // Kalem inline adet azaltma (sadece azaltmaya izin verilir)
  const [editingItem, setEditingItem] = useState<{ id: string; origQty: number; quantity: string } | null>(null);
  const [itemSaveLoading, setItemSaveLoading] = useState(false);
  // İşçilik düzenleme
  const [editLabor, setEditLabor] = useState(false);
  const [laborInput, setLaborInput] = useState("");
  const [laborLoading, setLaborLoading] = useState(false);

  const fetchRecord = useCallback(() => {
    setLoading(true);
    fetch(`/api/services/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setRecord(d.data); setLoading(false); });
  }, [id]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  async function enterEditMode() {
    if (!editMode && products.length === 0) {
      const res = await fetch("/api/products?active=true", { cache: "no-store" });
      const d = await res.json();
      setProducts(d.data || []);
    }
    setEditMode(true);
    setShowAddRow(false);
    setRemoveTarget(null);
  }

  function exitEditMode() {
    setEditMode(false);
    setShowAddRow(false);
    setRemoveTarget(null);
    setEditingItem(null);
    setAddForm({ product_id: "", name: "", quantity: "1", unit_price: "", note: "" });
  }

  function handleProductSelect(productId: string) {
    if (!productId) {
      setAddForm((f) => ({ ...f, product_id: "", name: "", unit_price: "" }));
      return;
    }
    const p = products.find((x) => x.id === productId);
    setAddForm((f) => ({
      ...f,
      product_id: productId,
      name: p?.name || "",
      unit_price: p?.unit_price?.toString() || "",
    }));
  }

  async function handlePayTypeChange(newType: string) {
    setPayTypeLoading(true);
    const res = await fetch(`/api/services/${id}/payment-type`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_type: newType }),
    });
    if (res.ok) {
      toast.success("Ödeme türü güncellendi");
      setEditPayType(false);
      fetchRecord();
    } else {
      const d = await res.json();
      toast.error(d.error || "Güncellenemedi");
    }
    setPayTypeLoading(false);
  }

  async function handleItemSave() {
    if (!editingItem) return;
    const qty = parseFloat(editingItem.quantity);
    if (!qty || qty <= 0 || isNaN(qty)) { toast.error("Geçersiz adet"); return; }
    if (qty >= editingItem.origQty) { toast.error("Adet mevcut değerden küçük olmalı"); return; }
    setItemSaveLoading(true);
    const res = await fetch(`/api/services/${id}/items/${editingItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    if (res.ok) {
      toast.success("Adet güncellendi");
      setEditingItem(null);
      fetchRecord();
    } else {
      const d = await res.json();
      toast.error(d.error || "Güncellenemedi");
    }
    setItemSaveLoading(false);
  }

  async function handleAddItem() {
    if (!addForm.name.trim() || !addForm.quantity || !addForm.unit_price) {
      toast.error("Ürün adı, miktar ve birim fiyat zorunludur");
      return;
    }
    setAddLoading(true);
    const res = await fetch(`/api/services/${id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      toast.success("Kalem eklendi");
      setAddForm({ product_id: "", name: "", quantity: "1", unit_price: "", note: "" });
      setShowAddRow(false);
      fetchRecord();
    } else {
      const d = await res.json();
      toast.error(d.error || "Eklenemedi");
    }
    setAddLoading(false);
  }

  async function handleRemoveItem() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    const res = await fetch(`/api/services/${id}/items/${removeTarget.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: removeTarget.note }),
    });
    if (res.ok) {
      toast.success("Kalem silindi");
      setRemoveTarget(null);
      fetchRecord();
    } else {
      const d = await res.json();
      toast.error(d.error || "Silinemedi");
    }
    setRemoveLoading(false);
  }

  async function handleLaborSave() {
    const val = parseFloat(laborInput);
    if (isNaN(val) || val < 0) { toast.error("Geçersiz işçilik ücreti"); return; }
    setLaborLoading(true);
    const res = await fetch(`/api/services/${id}/labor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labor_cost: val }),
    });
    if (res.ok) {
      toast.success("İşçilik güncellendi");
      setEditLabor(false);
      fetchRecord();
    } else {
      const d = await res.json();
      toast.error(d.error || "Güncellenemedi");
    }
    setLaborLoading(false);
  }

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
      if (!res.ok) throw new Error();
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

  const vehicle = record.vehicle as { plate: string; brand: string; model: string } | undefined;
  const customer = record.customer as { id: string; first_name: string; last_name: string; phone?: string; total_debt: number } | undefined;
  const lineItems = [...(record.line_items || [])].sort((a, b) => a.sort_order - b.sort_order);
  const transactions = record.debt_transactions || [];
  const auditLogs = [...(record.service_item_audit || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const payments = transactions.filter((t) => t.transaction_type === "odeme");
  const totalPaid = payments.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const isVeresiye = record.payment_type === "veresiye";
  const paymentColor = record.payment_type === "veresiye" ? "#dc2626" : record.payment_type === "nakit" ? "#16a34a" : record.payment_type === "eft_havale" ? "#7c3aed" : "#2563eb";
  const rec = record as ServiceRecordFull & { kdv_enabled?: boolean; kdv_amount?: number };

  return (
    <div>
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
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Servis Fişi</h1>
        <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>#{id.slice(0, 8)}</span>
      </div>

      {/* Aksiyon butonları */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <button onClick={downloadPdf} disabled={pdfLoading}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#dc2626", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: pdfLoading ? "not-allowed" : "pointer", opacity: pdfLoading ? 0.6 : 1 }}>
          <DocumentArrowDownIcon style={{ width: 16, height: 16 }} />
          {pdfLoading ? "..." : "PDF İndir"}
        </button>
        <button onClick={downloadExcel}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#059669", color: "#fff", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
          <TableCellsIcon style={{ width: 16, height: 16 }} />
          Excel
        </button>
        <button onClick={handleDelete}
          style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "#fff", color: "#ef4444", padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #fecaca", cursor: "pointer" }}>
          Sil
        </button>
      </div>

      {/* Başlık bilgisi */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <div className="svc-info-grid">
            <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Tarih: </span><span style={{ fontWeight: 500 }}>{formatDate(record.service_date)}</span></div>
            <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Plaka: </span>
              <Link href={`/vehicles/${record.vehicle_id}`} style={{ fontWeight: 700, color: "#4f46e5", textDecoration: "none" }}>{vehicle?.plate}</Link>
            </div>
            <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Müşteri: </span>
              <Link href={`/customers/${record.customer_id}`} style={{ fontWeight: 500, color: "#4f46e5", textDecoration: "none" }}>
                {customer?.first_name} {customer?.last_name}
              </Link>
            </div>
            <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Araç: </span><span style={{ fontWeight: 500 }}>{vehicle?.brand} {vehicle?.model}</span></div>
            {record.km_at_service && (
              <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>KM: </span><span style={{ fontWeight: 500 }}>{record.km_at_service.toLocaleString("tr-TR")} km</span></div>
            )}
            {customer?.phone && (
              <div style={{ fontSize: 13 }}><span style={{ color: "#64748b" }}>Tel: </span><span style={{ fontWeight: 500 }}>{customer.phone}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Kalemler */}
      <div style={S.card}>
        <div style={{ padding: "14px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>Yapılan İşlemler</h2>
          {!editMode ? (
            <button onClick={enterEditMode}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
              <PencilSquareIcon style={{ width: 14, height: 14 }} />
              Düzenle
            </button>
          ) : (
            <button onClick={exitEditMode}
              style={{ fontSize: 12, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>
              Kapat
            </button>
          )}
        </div>
        <div style={{ padding: "12px 20px 16px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Ürün / Hizmet</th>
                <th style={{ ...S.thR, width: 60 }}>Adet</th>
                <th style={{ ...S.thR, width: 120 }}>Birim Fiyat</th>
                <th style={{ ...S.thR, width: 120 }}>Toplam</th>
                {editMode && <th style={{ width: 36 }} />}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => {
                const isRemoving = removeTarget?.id === item.id;
                if (isRemoving) {
                  return (
                    <tr key={item.id} style={{ background: "#fff5f5" }}>
                      <td colSpan={editMode ? 5 : 4} style={{ padding: "10px 0", borderBottom: "1px solid #fecaca" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                            &ldquo;{item.name}&rdquo; silinsin mi?
                          </span>
                          <input
                            value={removeTarget.note}
                            onChange={(e) => setRemoveTarget({ ...removeTarget, note: e.target.value })}
                            placeholder="Sebep (isteğe bağlı)"
                            style={{ ...S.input, width: 180, fontSize: 11 }}
                          />
                          <button onClick={handleRemoveItem} disabled={removeLoading}
                            style={{ fontSize: 11, background: "#dc2626", color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontWeight: 600, opacity: removeLoading ? 0.6 : 1 }}>
                            {removeLoading ? "..." : "Sil"}
                          </button>
                          <button onClick={() => setRemoveTarget(null)}
                            style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>
                            İptal
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                const isEditing = editingItem?.id === item.id;
                const newQtyNum = isEditing ? parseFloat(editingItem.quantity || "0") : item.quantity;
                const previewTotal = isEditing && !isNaN(newQtyNum)
                  ? newQtyNum * item.unit_price
                  : item.line_total;
                const canSave = isEditing &&
                  !isNaN(newQtyNum) && newQtyNum > 0 && newQtyNum < item.quantity;

                return (
                  <tr key={item.id} style={{ background: isEditing ? "#f0f4ff" : undefined }}>
                    <td style={S.td}>{item.name}</td>

                    {/* Adet — sadece azaltmaya izin verilir */}
                    <td style={S.tdR}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0.001"
                          max={item.quantity - 0.001}
                          step="0.001"
                          value={editingItem.quantity}
                          onChange={(e) =>
                            setEditingItem((ei) => ei ? { ...ei, quantity: e.target.value } : ei)
                          }
                          onKeyDown={(e) => { if (e.key === "Enter" && canSave) handleItemSave(); if (e.key === "Escape") setEditingItem(null); }}
                          style={{ ...S.input, width: 70, textAlign: "right", fontSize: 12 }}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            if (editMode) setEditingItem({ id: item.id, origQty: item.quantity, quantity: String(item.quantity) });
                          }}
                          style={{
                            cursor: editMode ? "pointer" : "default",
                            textDecoration: editMode ? "underline dotted #a5b4fc" : "none",
                            color: editMode ? "#4f46e5" : undefined,
                          }}
                          title={editMode ? "Adeti azaltmak için tıkla" : undefined}
                        >
                          {item.quantity}
                        </span>
                      )}
                    </td>

                    {/* Birim Fiyat — düzenlenemez */}
                    <td style={S.tdR}>{formatCurrency(item.unit_price)}</td>

                    {/* Toplam — anlık önizleme */}
                    <td style={{ ...S.tdR, fontWeight: 600, color: isEditing && canSave ? "#4f46e5" : undefined }}>
                      {formatCurrency(previewTotal)}
                    </td>

                    {/* Aksiyon */}
                    {editMode && (
                      <td style={{ padding: "6px 0", borderBottom: "1px solid #f8fafc", textAlign: "center" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button
                              onClick={handleItemSave}
                              disabled={!canSave || itemSaveLoading}
                              style={{ fontSize: 10, background: canSave ? "#4f46e5" : "#e2e8f0", color: canSave ? "#fff" : "#94a3b8", border: "none", borderRadius: 4, padding: "3px 8px", cursor: canSave && !itemSaveLoading ? "pointer" : "default", fontWeight: 700 }}>
                              {itemSaveLoading ? "..." : "Kaydet"}
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              style={{ fontSize: 10, background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer" }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRemoveTarget({ id: item.id, name: item.name, note: "" })}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 2, display: "flex", alignItems: "center" }}
                            title="Kalemi tamamen sil">
                            <XMarkIcon style={{ width: 15, height: 15 }} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Yeni kalem ekleme satırı */}
              {editMode && showAddRow && (
                <tr style={{ background: "#f0fdf4" }}>
                  <td colSpan={5} style={{ padding: "10px 0", borderBottom: "1px solid #bbf7d0" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start" }}>
                      {products.length > 0 && (
                        <select
                          value={addForm.product_id}
                          onChange={(e) => handleProductSelect(e.target.value)}
                          style={{ ...S.input, minWidth: 150, fontSize: 11 }}
                        >
                          <option value="">Katalogdan seç...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      <input
                        value={addForm.name}
                        onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Ürün / Hizmet adı *"
                        style={{ ...S.input, width: 160, fontSize: 11 }}
                      />
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={addForm.quantity}
                        onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
                        placeholder="Adet *"
                        style={{ ...S.input, width: 70, fontSize: 11 }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={addForm.unit_price}
                        onChange={(e) => setAddForm((f) => ({ ...f, unit_price: e.target.value }))}
                        placeholder="Birim fiyat *"
                        style={{ ...S.input, width: 100, fontSize: 11 }}
                      />
                      <input
                        value={addForm.note}
                        onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="Sebep (isteğe bağlı)"
                        style={{ ...S.input, width: 160, fontSize: 11 }}
                      />
                      <button onClick={handleAddItem} disabled={addLoading}
                        style={{ fontSize: 11, background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontWeight: 600, opacity: addLoading ? 0.6 : 1 }}>
                        {addLoading ? "..." : "Ekle"}
                      </button>
                      <button onClick={() => setShowAddRow(false)}
                        style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 5, padding: "5px 10px", cursor: "pointer" }}>
                        İptal
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {editMode && !showAddRow && (
            <button
              onClick={() => setShowAddRow(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12, color: "#16a34a", background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600 }}>
              <PlusIcon style={{ width: 13, height: 13 }} />
              Yeni Kalem Ekle
            </button>
          )}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#64748b" }}>
                <span>İşçilik:</span>
                {!editLabor ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{record.labor_cost > 0 ? formatCurrency(record.labor_cost) : "—"}</span>
                    <button
                      onClick={() => { setLaborInput(record.labor_cost > 0 ? String(record.labor_cost) : ""); setEditLabor(true); }}
                      style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontWeight: 600 }}>
                      <PencilSquareIcon style={{ width: 11, height: 11 }} />
                      {record.labor_cost > 0 ? "Düzenle" : "Ekle"}
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
                      style={{ ...S.input, width: 90, textAlign: "right" }}
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
              {rec.kdv_enabled && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#b45309" }}>
                  <span>KDV (%20):</span>
                  <span>+{formatCurrency(rec.kdv_amount || 0)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 2 }}>
                <span>GENEL TOPLAM:</span>
                <span style={{ color: "#4f46e5" }}>{formatCurrency(record.grand_total)}</span>
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editPayType ? 8 : 0 }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>Ödeme Türü:</span>
                  {!editPayType ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontWeight: 600, color: paymentColor, fontSize: 13 }}>{PAYMENT_TYPE_LABELS[record.payment_type]}</span>
                      <button
                        onClick={() => setEditPayType(true)}
                        style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#4f46e5", background: "#eef2ff", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontWeight: 600 }}>
                        <PencilSquareIcon style={{ width: 11, height: 11 }} />
                        Değiştir
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setEditPayType(false)}
                      style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>
                      İptal
                    </button>
                  )}
                </div>
                {editPayType && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {([
                      { key: "nakit",       label: "Nakit",       color: "#16a34a", bg: "#f0fdf4" },
                      { key: "kredi_karti", label: "Kredi Kartı", color: "#2563eb", bg: "#eff6ff" },
                      { key: "eft_havale",  label: "EFT/Havale",  color: "#7c3aed", bg: "#f5f3ff" },
                      { key: "veresiye",    label: "Veresiye",    color: "#dc2626", bg: "#fef2f2" },
                    ] as const).map(({ key, label, color, bg }) => {
                      const isActive = record.payment_type === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isActive || payTypeLoading}
                          onClick={() => handlePayTypeChange(key)}
                          style={{ flex: 1, minWidth: 70, padding: "6px 4px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                            border: isActive ? `2px solid ${color}` : "1px solid #e2e8f0",
                            backgroundColor: isActive ? bg : "#fafafa",
                            color: isActive ? color : "#94a3b8",
                            cursor: isActive || payTypeLoading ? "default" : "pointer",
                            opacity: payTypeLoading && !isActive ? 0.5 : 1 }}>
                          {payTypeLoading && !isActive ? "..." : label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
                  {["Tarih", "Açıklama", "Ödenen", "Kalan Borç"].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 2 ? "right" : "left", padding: "8px 20px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                  ))}
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

      {/* Değişiklik Kaydı — sadece dahili, PDF'e yansımaz */}
      {auditLogs.length > 0 && (
        <div style={{ ...S.card, border: "1px solid #fde68a", background: "#fffbeb" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: 0 }}>
              Değişiklik Kaydı
            </h2>
            <span style={{ fontSize: 10, color: "#a16207", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
              İÇ KULLANIM — PDF&apos;E YANSIMAZ
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Tarih/Saat", "İşlem", "Ürün / Hizmet", "Adet", "Birim Fiyat", "Tutar", "Sebep"].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 3 && i <= 5 ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 600, color: "#92400e", background: "#fef3c7", borderBottom: "1px solid #fde68a", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ background: log.action === "add" ? "#f0fdf4" : "#fff5f5" }}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{formatDateTime(log.created_at)}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: log.action === "add" ? "#16a34a" : "#dc2626", background: log.action === "add" ? "#dcfce7" : "#fee2e2", borderRadius: 4, padding: "1px 7px" }}>
                        {log.action === "add" ? "EKLENDİ" : "SİLİNDİ"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a", fontSize: 12, color: "#1e293b" }}>{log.item_name}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a", fontSize: 12, textAlign: "right", color: "#475569" }}>{log.quantity}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a", fontSize: 12, textAlign: "right", color: "#475569" }}>{formatCurrency(log.unit_price)}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a", fontSize: 12, textAlign: "right", fontWeight: 600, color: log.action === "add" ? "#16a34a" : "#dc2626" }}>
                      {log.action === "add" ? "+" : "-"}{formatCurrency(log.line_total)}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #fde68a", fontSize: 11, color: "#78716c" }}>{log.note || "—"}</td>
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
