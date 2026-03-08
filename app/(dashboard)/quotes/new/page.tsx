"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import type { Customer, Vehicle, Product } from "@/types";

interface LineItem {
  key: number;
  name: string;
  quantity: number;
  unit_price: number;
}

const S = {
  backRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20 } as React.CSSProperties,
  backBtn: { display: "flex", alignItems: "center", color: "#64748b", textDecoration: "none" } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.01em" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 12 } as React.CSSProperties,
  cardBody: { padding: 16 } as React.CSSProperties,
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 12px 0" } as React.CSSProperties,
  label: { display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 5 } as React.CSSProperties,
  inp: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box" as const, backgroundColor: "#fff" } as React.CSSProperties,
  inpSm: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#0f172a", outline: "none", width: "100%", boxSizing: "border-box" as const, backgroundColor: "#fff" } as React.CSSProperties,
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  tableHead: { display: "grid", gridTemplateColumns: "3fr 80px 100px 80px 32px", gap: 8, padding: "0 0 6px 0", borderBottom: "1px solid #f1f5f9", marginBottom: 6 } as React.CSSProperties,
  tableHeadCell: { fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  tableRow: { display: "grid", gridTemplateColumns: "3fr 80px 100px 80px 32px", gap: 8, alignItems: "center", marginBottom: 6 } as React.CSSProperties,
  rowTotal: { fontSize: 13, fontWeight: 600, color: "#0f172a", textAlign: "right" as const } as React.CSSProperties,
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 4 } as React.CSSProperties,
  summaryTotal: { display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 4 } as React.CSSProperties,
  submitBtn: { width: "100%", backgroundColor: "#4f46e5", color: "#fff", padding: "12px 0", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", marginBottom: 8 } as React.CSSProperties,
  cancelBtn: { display: "block", textAlign: "center" as const, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#64748b", border: "1px solid #e2e8f0", textDecoration: "none", backgroundColor: "#fff" } as React.CSSProperties,
  dropdownWrap: { position: "absolute" as const, zIndex: 20, width: "100%", top: "100%", marginTop: 4, backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto" as const } as React.CSSProperties,
  dropdownItem: { display: "block", width: "100%", textAlign: "left" as const, padding: "9px 14px", fontSize: 13, color: "#0f172a", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f8fafc" } as React.CSSProperties,
  trashBtn: { padding: 4, background: "none", border: "none", cursor: "pointer", color: "#f87171", borderRadius: 6 } as React.CSSProperties,
  addLineBtn: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 4 } as React.CSSProperties,
  kdvToggle: (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
    border: active ? "2px solid #f59e0b" : "1px solid #e2e8f0",
    backgroundColor: active ? "#fffbeb" : "#fff",
    color: active ? "#b45309" : "#64748b",
    cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%"
  }),
};

export default function NewQuotePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // Form alanları
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState(""); // Serbest metin araç bilgisi
  const [laborCost, setLaborCost] = useState("");
  const [notes, setNotes] = useState("");
  const [kdvEnabled, setKdvEnabled] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: Date.now(), name: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    fetch("/api/products?active=true").then((r) => r.json()).then((d) => setProducts(d.data || []));
  }, []);

  async function searchCustomers(q: string) {
    if (!q.trim()) { setCustomers([]); return; }
    const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
    const data = await res.json();
    setCustomers(data.data || []);
  }

  async function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerSearch(`${c.first_name} ${c.last_name}`);
    setCustomers([]);
    setSelectedVehicle(null);
    const res = await fetch(`/api/vehicles?customer_id=${c.id}`);
    const data = await res.json();
    setCustomerVehicles(data.data || []);
  }

  function updateLine(key: number, field: string, value: string | number) {
    setLineItems((prev) => prev.map((li) => li.key === key ? { ...li, [field]: value } : li));
  }

  function addLine() {
    setLineItems((prev) => [...prev, { key: Date.now(), name: "", quantity: 1, unit_price: 0 }]);
  }

  function removeLine(key: number) {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  }

  const partsTotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);
  const laborNum = parseFloat(laborCost) || 0;
  const subtotal = partsTotal + laborNum;
  const kdvAmount = kdvEnabled ? subtotal * 0.20 : 0;
  const grandTotal = subtotal + kdvAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lineItems.filter((li) => li.name.trim() && li.quantity > 0);
    if (validLines.length === 0) { toast.error("En az bir kalem ekleyin"); return; }

    setLoading(true);
    const customerName = selectedCustomer
      ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
      : customerSearch;

    const vehicleDisplay = selectedVehicle
      ? `${selectedVehicle.plate} — ${selectedVehicle.brand} ${selectedVehicle.model}`
      : vehicleInfo;

    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: selectedCustomer?.id || null,
        customer_name: customerName,
        vehicle_info: vehicleDisplay || null,
        quote_date: quoteDate,
        valid_until: validUntil || null,
        labor_cost: laborNum,
        kdv_enabled: kdvEnabled,
        kdv_amount: kdvAmount,
        grand_total: grandTotal,
        notes: notes || null,
        line_items: validLines.map(({ key: _k, ...li }) => ({
          ...li,
          line_total: li.quantity * li.unit_price,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Hata oluştu");
      setLoading(false);
      return;
    }
    toast.success("Teklif oluşturuldu");
    router.push(`/quotes/${data.data.id}`);
  }

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={S.backRow}>
        <Link href="/quotes" style={S.backBtn}>
          <ChevronLeftIcon style={{ width: 18, height: 18 }} />
        </Link>
        <h1 style={S.h1}>Yeni Fiyat Teklifi</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Müşteri */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>Müşteri Bilgisi</p>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <label style={S.label}>Müşteri (opsiyonel — serbest yazabilirsiniz)</label>
              <div style={{ position: "relative" }}>
                <MagnifyingGlassIcon style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (!e.target.value) { setSelectedCustomer(null); setSelectedVehicle(null); }
                    searchCustomers(e.target.value);
                  }}
                  placeholder="Müşteri adı..."
                  style={{ ...S.inp, paddingLeft: 32 }}
                />
              </div>
              {customers.length > 0 && (
                <div style={S.dropdownWrap}>
                  {customers.map((c) => (
                    <button key={c.id} type="button" onClick={() => selectCustomer(c)} style={S.dropdownItem}>
                      {c.first_name} {c.last_name}
                      {c.phone && <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 12 }}>{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Araç — sistemdekini seç veya serbest yaz */}
            <div>
              <label style={S.label}>Araç Bilgisi</label>
              {customerVehicles.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {customerVehicles.map((v) => (
                    <button key={v.id} type="button" onClick={() => { setSelectedVehicle(v); setVehicleInfo(""); }}
                      style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: selectedVehicle?.id === v.id ? "2px solid #4f46e5" : "1px solid #e2e8f0", backgroundColor: selectedVehicle?.id === v.id ? "#eef2ff" : "#fff", color: selectedVehicle?.id === v.id ? "#4f46e5" : "#475569", cursor: "pointer" }}>
                      {v.plate} <span style={{ fontSize: 11, opacity: 0.7 }}>{v.brand} {v.model}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {!selectedVehicle && (
                <input type="text" placeholder="34 ABC 123 — Marka Model..." value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)} style={S.inp} />
              )}
              {selectedVehicle && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>{selectedVehicle.plate} — {selectedVehicle.brand} {selectedVehicle.model}</span>
                  <button type="button" onClick={() => setSelectedVehicle(null)} style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>değiştir</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarihler */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>Teklif Tarihleri</p>
            <div style={S.row2}>
              <div>
                <label style={S.label}>Teklif Tarihi *</label>
                <input type="date" required value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} style={S.inp} />
              </div>
              <div>
                <label style={S.label}>Geçerlilik Tarihi (opsiyonel)</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={S.inp} />
              </div>
            </div>
          </div>
        </div>

        {/* Kalemler */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>Teklif Kalemleri</p>
            <div style={S.tableHead}>
              <span style={S.tableHeadCell}>Ürün / Hizmet</span>
              <span style={{ ...S.tableHeadCell, textAlign: "center" }}>Adet</span>
              <span style={{ ...S.tableHeadCell, textAlign: "right" }}>Birim Fiyat</span>
              <span style={{ ...S.tableHeadCell, textAlign: "right" }}>Toplam</span>
              <span></span>
            </div>

            {lineItems.map((li) => (
              <div key={li.key} style={S.tableRow}>
                <div>
                  <input
                    type="text"
                    placeholder="Ürün / hizmet adı"
                    value={li.name}
                    onChange={(e) => {
                      updateLine(li.key, "name", e.target.value);
                      const match = products.find((p) => p.name === e.target.value);
                      if (match) { updateLine(li.key, "unit_price", match.unit_price); }
                    }}
                    list={`products-${li.key}`}
                    style={S.inpSm}
                  />
                  <datalist id={`products-${li.key}`}>
                    {products.map((p) => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
                <input type="number" step="0.001" min="0.001" value={li.quantity}
                  onChange={(e) => updateLine(li.key, "quantity", parseFloat(e.target.value) || 1)}
                  style={{ ...S.inpSm, textAlign: "center" }} />
                <input type="number" step="0.01" min="0" value={li.unit_price}
                  onChange={(e) => updateLine(li.key, "unit_price", parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  style={{ ...S.inpSm, textAlign: "right" }} />
                <div style={S.rowTotal}>{formatCurrency(li.quantity * li.unit_price)}</div>
                <button type="button" onClick={() => removeLine(li.key)} style={S.trashBtn}>
                  <TrashIcon style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}

            <button type="button" onClick={addLine} style={S.addLineBtn}>
              <PlusIcon style={{ width: 14, height: 14 }} /> Kalem Ekle
            </button>
          </div>
        </div>

        {/* İşçilik, KDV, Özet */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>İşçilik ve Özet</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={S.label}>İşçilik (₺)</label>
                <input type="number" step="0.01" min="0" value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)} placeholder="0.00" style={S.inp} />
                <div style={{ marginTop: 10 }}>
                  <button type="button" onClick={() => setKdvEnabled(!kdvEnabled)} style={S.kdvToggle(kdvEnabled)}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, border: kdvEnabled ? "2px solid #f59e0b" : "2px solid #cbd5e1", backgroundColor: kdvEnabled ? "#f59e0b" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {kdvEnabled && <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#fff", display: "block" }} />}
                    </span>
                    KDV %20
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={S.summaryRow}><span>Parça Toplamı:</span><span>{formatCurrency(partsTotal)}</span></div>
                {laborNum > 0 && <div style={S.summaryRow}><span>İşçilik:</span><span>{formatCurrency(laborNum)}</span></div>}
                {kdvEnabled && <div style={{ ...S.summaryRow, color: "#b45309" }}><span>KDV (%20):</span><span>+{formatCurrency(kdvAmount)}</span></div>}
                <div style={S.summaryTotal}><span>GENEL TOPLAM:</span><span style={{ color: "#4f46e5" }}>{formatCurrency(grandTotal)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Not */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <label style={S.label}>Teklif Notu (opsiyonel)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              style={{ ...S.inp, resize: "none", fontFamily: "inherit" }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Kaydediliyor..." : `Teklifi Kaydet — ${formatCurrency(grandTotal)}`}
        </button>
        <Link href="/quotes" style={S.cancelBtn}>İptal</Link>
      </form>
    </div>
  );
}
