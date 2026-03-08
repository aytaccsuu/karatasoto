"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { Product } from "@/types";

const S = {
  page: {} as React.CSSProperties,
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  sub: { fontSize: 13, color: "#64748b", margin: "2px 0 0 0" } as React.CSSProperties,
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#4f46e5", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thC: { textAlign: "center" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  thR: { textAlign: "right" as const, padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#334155" } as React.CSSProperties,
  tdC: { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, textAlign: "center" as const } as React.CSSProperties,
  tdR: { padding: "11px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, textAlign: "right" as const } as React.CSSProperties,
  editInput: { border: "1px solid #a5b4fc", borderRadius: 6, padding: "4px 8px", fontSize: 13, color: "#0f172a", outline: "none", backgroundColor: "#fff" } as React.CSSProperties,
  center: { display: "flex", justifyContent: "center", padding: "48px 0" } as React.CSSProperties,
  empty: { textAlign: "center" as const, padding: "48px 0", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" },
  spinner: { width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" } as React.CSSProperties,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", unit_price: "", unit: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/products?active=true", { cache: "no-store" });
    const data = await res.json();
    setProducts(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, is_active: !p.is_active }),
    });
    fetchProducts();
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setEditForm({ name: p.name, unit_price: p.unit_price.toString(), unit: p.unit });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, unit_price: parseFloat(editForm.unit_price), unit: editForm.unit, is_active: true }),
    });
    if (res.ok) { toast.success("Ürün güncellendi"); setEditId(null); fetchProducts(); }
    else toast.error("Güncelleme başarısız");
  }

  function askDelete(id: string, name: string) {
    setDeleteTarget({ id, name });
    setConfirmOpen(true);
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Ürün silindi");
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } else {
      toast.error("Silme başarısız. Bu ürün servis kayıtlarında kullanılmış olabilir.");
    }
    setConfirmOpen(false);
    setDeleteTarget(null);
  }

  const activeCount = products.filter(p => p.is_active).length;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        tr:hover td { background-color: #f8fafc; }
        .prod-table-card { display: block; }
        .prod-mobile-list { display: none; }
        @media (max-width: 640px) {
          .prod-table-card { display: none; }
          .prod-mobile-list { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <ConfirmModal
        open={confirmOpen}
        title="Ürünü Sil"
        message={deleteTarget ? `"${deleteTarget.name}" ürününü kalıcı olarak silmek istediğinize emin misiniz?` : ""}
        confirmLabel="Evet, Sil"
        onConfirm={executeDelete}
        onCancel={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />

      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Ürünler / İşçilik</h1>
          {!loading && <p style={S.sub}>{activeCount} aktif · {products.length} toplam</p>}
        </div>
        <Link href="/products/new" style={S.btnPrimary}>
          <PlusIcon style={{ width: 16, height: 16 }} />
          Yeni Ürün
        </Link>
      </div>

      {loading ? (
        <div style={S.center}><div style={S.spinner} /></div>
      ) : products.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 500 }}>Henüz ürün eklenmemiş</p>
        </div>
      ) : (
        <>
        <div className="prod-table-card" style={S.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Ürün Adı</th>
                  <th style={S.th}>Birim</th>
                  <th style={S.thR}>Fiyat</th>
                  <th style={S.thC}>Durum</th>
                  <th style={{ ...S.th, width: 160 }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.45 }}>
                    <td style={S.td}>
                      {editId === p.id
                        ? <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ ...S.editInput, width: "100%" }} />
                        : <span style={{ fontWeight: 500, color: "#1e293b" }}>{p.name}</span>}
                    </td>
                    <td style={S.td}>
                      {editId === p.id
                        ? <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} style={{ ...S.editInput, width: 64 }} />
                        : <span style={{ color: "#64748b" }}>{p.unit}</span>}
                    </td>
                    <td style={S.tdR}>
                      {editId === p.id
                        ? <input type="number" step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })} style={{ ...S.editInput, width: 96, textAlign: "right" }} />
                        : <span style={{ fontWeight: 600, color: "#0f172a" }}>{formatCurrency(p.unit_price)}</span>}
                    </td>
                    <td style={S.tdC}>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, ...(p.is_active ? { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" } : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }) }}>
                        {p.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                        {editId === p.id ? (
                          <>
                            <button onClick={() => saveEdit(p.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#16a34a", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              <CheckIcon style={{ width: 14, height: 14 }} />Kaydet
                            </button>
                            <button onClick={() => setEditId(null)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                              <XMarkIcon style={{ width: 14, height: 14 }} />İptal
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Düzenle</button>
                            <button onClick={() => toggleActive(p)} style={{ fontSize: 12, fontWeight: 600, color: "#d97706", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{p.is_active ? "Deaktif" : "Aktif Et"}</button>
                            <button onClick={() => askDelete(p.id, p.name)} style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sil</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobil kart listesi */}
        <div className="prod-mobile-list">
          {products.map((p) => (
            <div key={p.id} style={{ backgroundColor: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "14px 16px", opacity: p.is_active ? 1 : 0.5 }}>
              {editId === p.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Ürün adı" style={{ ...S.editInput, width: "100%", fontSize: 15 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} placeholder="Birim" style={{ ...S.editInput, fontSize: 15 }} />
                    <input type="number" step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })} placeholder="Fiyat" style={{ ...S.editInput, textAlign: "right", fontSize: 15 }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <button onClick={() => saveEdit(p.id)} style={{ flex: 1, padding: "9px 0", borderRadius: 6, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Kaydet</button>
                    <button onClick={() => setEditId(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 6, backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>İptal</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 16 }}>{p.name}</div>
                    <div style={{ fontSize: 14, color: "#64748b", marginTop: 3 }}>{formatCurrency(p.unit_price)} / {p.unit}</div>
                    <span style={{ display: "inline-flex", alignItems: "center", marginTop: 6, padding: "2px 9px", borderRadius: 5, fontSize: 12, fontWeight: 600, ...(p.is_active ? { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" } : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }) }}>
                      {p.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                    <button onClick={() => startEdit(p)} style={{ fontSize: 14, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Düzenle</button>
                    <button onClick={() => toggleActive(p)} style={{ fontSize: 14, fontWeight: 600, color: "#d97706", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{p.is_active ? "Deaktif" : "Aktif Et"}</button>
                    <button onClick={() => askDelete(p.id, p.name)} style={{ fontSize: 14, fontWeight: 600, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Sil</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
