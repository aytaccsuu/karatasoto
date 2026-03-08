"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import type { Customer, Vehicle, Product, ServiceLineItemInput } from "@/types";

const S = {
  page: {} as React.CSSProperties,
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
  mobileLineCard: { border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: "#fafafa" } as React.CSSProperties,
  rowTotal: { fontSize: 13, fontWeight: 600, color: "#0f172a", textAlign: "right" as const } as React.CSSProperties,
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 4 } as React.CSSProperties,
  summaryTotal: { display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 4 } as React.CSSProperties,
  ptBtn: (active: boolean, color: string): React.CSSProperties => ({
    flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
    border: active ? `2px solid ${color}` : "1px solid #e2e8f0",
    backgroundColor: active ? (color === "#dc2626" ? "#fef2f2" : color === "#16a34a" ? "#f0fdf4" : "#eff6ff") : "#fff",
    color: active ? color : "#64748b", cursor: "pointer"
  }),
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

function NewServiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preVehicleId = searchParams.get("vehicle_id") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [kmAtService, setKmAtService] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [paymentType, setPaymentType] = useState<"nakit" | "kredi_karti" | "veresiye">("nakit");
  const [notes, setNotes] = useState("");
  const [kdvEnabled, setKdvEnabled] = useState(false);
  const [lineItems, setLineItems] = useState<(ServiceLineItemInput & { key: number })[]>([
    { key: Date.now(), product_id: "", name: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    fetch("/api/products?active=true").then((r) => r.json()).then((d) => setProducts(d.data || []));

    if (preVehicleId) {
      fetch(`/api/vehicles/${preVehicleId}`)
        .then((r) => r.json())
        .then((d) => {
          const v = d.data;
          setSelectedVehicle(v);
          if (v.customer) {
            setSelectedCustomer(v.customer);
            setCustomerSearch(`${v.customer.first_name} ${v.customer.last_name}`);
            fetch(`/api/vehicles?customer_id=${v.customer.id}`)
              .then((r) => r.json())
              .then((vd) => setCustomerVehicles(vd.data || []));
          }
        });
    }
  }, [preVehicleId]);

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

  function updateLineItem(key: number, field: string, value: string | number) {
    setLineItems((prev) => prev.map((li) => li.key === key ? { ...li, [field]: value } : li));
  }

  function addLine() {
    setLineItems((prev) => [...prev, { key: Date.now(), product_id: "", name: "", quantity: 1, unit_price: 0 }]);
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
    if (!selectedCustomer) { toast.error("Müşteri seçin"); return; }
    if (!selectedVehicle) { toast.error("Araç seçin"); return; }
    const validLines = lineItems.filter((li) => li.name.trim() && li.quantity > 0 && li.unit_price >= 0);
    if (validLines.length === 0) { toast.error("En az bir işlem kalemi ekleyin"); return; }

    setLoading(true);

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle_id: selectedVehicle.id,
        customer_id: selectedCustomer.id,
        service_date: serviceDate,
        km_at_service: kmAtService ? parseInt(kmAtService) : undefined,
        labor_cost: laborNum,
        kdv_enabled: kdvEnabled,
        kdv_amount: kdvAmount,
        payment_type: paymentType,
        notes: notes || undefined,
        line_items: validLines.map(({ key: _k, ...li }) => li),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Hata oluştu");
      setLoading(false);
      return;
    }
    toast.success("Servis kaydı oluşturuldu");
    router.push(`/services/${data.data.id}`);
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .svc-table-wrap { display: block; }
        .svc-mobile-cards { display: none; }
        @media (max-width: 600px) {
          .svc-table-wrap { display: none; }
          .svc-mobile-cards { display: block; }
          .svc-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={S.backRow}>
        <Link href="/services" style={S.backBtn}>
          <ChevronLeftIcon style={{ width: 18, height: 18 }} />
        </Link>
        <h1 style={S.h1}>Yeni Servis Kaydı</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Müşteri ve Araç */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>Müşteri ve Araç</p>
            <div style={{ position: "relative", marginBottom: selectedCustomer ? 12 : 0 }}>
              <label style={S.label}>Müşteri Ara *</label>
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
                  placeholder="Müşteri adı ile ara..."
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
                  <Link href="/customers/new" style={{ ...S.dropdownItem, color: "#4f46e5", textDecoration: "none", fontSize: 12, borderTop: "1px solid #f1f5f9" }}>
                    + Yeni müşteri ekle
                  </Link>
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div>
                <label style={S.label}>Araç *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {customerVehicles.map((v) => (
                    <button key={v.id} type="button" onClick={() => setSelectedVehicle(v)}
                      style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: selectedVehicle?.id === v.id ? "2px solid #4f46e5" : "1px solid #e2e8f0", backgroundColor: selectedVehicle?.id === v.id ? "#eef2ff" : "#fff", color: selectedVehicle?.id === v.id ? "#4f46e5" : "#475569", cursor: "pointer" }}>
                      {v.plate} <span style={{ fontSize: 11, opacity: 0.7 }}>{v.brand} {v.model}</span>
                    </button>
                  ))}
                  <Link href={`/vehicles/new?customer_id=${selectedCustomer.id}`}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px dashed #818cf8", color: "#4f46e5", textDecoration: "none" }}>
                    + Yeni araç
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Servis Bilgileri */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>Servis Bilgileri</p>
            <div className="svc-row2" style={S.row2}>
              <div>
                <label style={S.label}>Tarih *</label>
                <input type="date" required value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} style={S.inp} />
              </div>
              <div>
                <label style={S.label}>KM (opsiyonel)</label>
                <input type="number" min="0" value={kmAtService} onChange={(e) => setKmAtService(e.target.value)} placeholder="75000" style={S.inp} />
              </div>
            </div>
          </div>
        </div>

        {/* İşlem Kalemleri */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>İşlemler</p>
            {/* Masaüstü tablo */}
            <div className="svc-table-wrap">
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
                    <input type="text" placeholder="Ürün / hizmet adı" value={li.name}
                      onChange={(e) => {
                        updateLineItem(li.key, "name", e.target.value);
                        const match = products.find((p) => p.name === e.target.value);
                        if (match) { updateLineItem(li.key, "unit_price", match.unit_price); updateLineItem(li.key, "product_id", match.id); }
                      }}
                      list={`products-${li.key}`} style={S.inpSm} />
                    <datalist id={`products-${li.key}`}>{products.map((p) => <option key={p.id} value={p.name} />)}</datalist>
                  </div>
                  <input type="number" step="0.001" min="0.001" value={li.quantity}
                    onChange={(e) => updateLineItem(li.key, "quantity", parseFloat(e.target.value) || 1)}
                    style={{ ...S.inpSm, textAlign: "center" }} />
                  <input type="number" step="0.01" min="0" value={li.unit_price}
                    onChange={(e) => updateLineItem(li.key, "unit_price", parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()} style={{ ...S.inpSm, textAlign: "right" }} />
                  <div style={S.rowTotal}>{formatCurrency(li.quantity * li.unit_price)}</div>
                  <button type="button" onClick={() => removeLine(li.key)} style={S.trashBtn}>
                    <TrashIcon style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Mobil kart düzeni */}
            <div className="svc-mobile-cards">
              {lineItems.map((li) => (
                <div key={li.key} style={S.mobileLineCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ürün / Hizmet</span>
                    <button type="button" onClick={() => removeLine(li.key)} style={S.trashBtn}>
                      <TrashIcon style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                  <input type="text" placeholder="Ürün / hizmet adı" value={li.name}
                    onChange={(e) => {
                      updateLineItem(li.key, "name", e.target.value);
                      const match = products.find((p) => p.name === e.target.value);
                      if (match) { updateLineItem(li.key, "unit_price", match.unit_price); updateLineItem(li.key, "product_id", match.id); }
                    }}
                    list={`products-m-${li.key}`} style={{ ...S.inpSm, marginBottom: 8 }} />
                  <datalist id={`products-m-${li.key}`}>{products.map((p) => <option key={p.id} value={p.name} />)}</datalist>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, display: "block", marginBottom: 4 }}>Adet</span>
                      <input type="number" step="0.001" min="0.001" value={li.quantity}
                        onChange={(e) => updateLineItem(li.key, "quantity", parseFloat(e.target.value) || 1)}
                        style={{ ...S.inpSm, textAlign: "center" }} />
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, display: "block", marginBottom: 4 }}>Birim Fiyat (₺)</span>
                      <input type="number" step="0.01" min="0" value={li.unit_price}
                        onChange={(e) => updateLineItem(li.key, "unit_price", parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()} style={{ ...S.inpSm, textAlign: "right" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(li.quantity * li.unit_price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addLine} style={S.addLineBtn}>
              <PlusIcon style={{ width: 14, height: 14 }} /> Kalem Ekle
            </button>
          </div>
        </div>

        {/* İşçilik, KDV ve Özet */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>İşçilik ve Özet</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={S.label}>İşçilik (₺)</label>
                <input type="number" step="0.01" min="0" value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  placeholder="0.00" style={S.inp} />

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
                <div style={S.summaryRow}>
                  <span>Parça Toplamı:</span>
                  <span>{formatCurrency(partsTotal)}</span>
                </div>
                {laborNum > 0 && (
                  <div style={S.summaryRow}>
                    <span>İşçilik:</span>
                    <span>{formatCurrency(laborNum)}</span>
                  </div>
                )}
                {kdvEnabled && (
                  <div style={{ ...S.summaryRow, color: "#b45309" }}>
                    <span>KDV (%20):</span>
                    <span>+{formatCurrency(kdvAmount)}</span>
                  </div>
                )}
                <div style={S.summaryTotal}>
                  <span>GENEL TOPLAM:</span>
                  <span style={{ color: "#4f46e5" }}>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ödeme Türü */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <p style={S.cardTitle}>Ödeme Türü</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setPaymentType("nakit")} style={S.ptBtn(paymentType === "nakit", "#16a34a")}>Nakit</button>
              <button type="button" onClick={() => setPaymentType("kredi_karti")} style={S.ptBtn(paymentType === "kredi_karti", "#2563eb")}>Kredi Kartı</button>
              <button type="button" onClick={() => setPaymentType("veresiye")} style={S.ptBtn(paymentType === "veresiye", "#dc2626")}>Veresiye</button>
            </div>
            {paymentType === "veresiye" && (
              <p style={{ fontSize: 12, color: "#dc2626", margin: "8px 0 0 0" }}>
                {formatCurrency(grandTotal)} müşterinin borç hanesine eklenecek.
              </p>
            )}
          </div>
        </div>

        {/* Not */}
        <div style={S.card}>
          <div style={S.cardBody}>
            <label style={S.label}>Not (opsiyonel)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              style={{ ...S.inp, resize: "none", fontFamily: "inherit" }} />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Kaydediliyor..." : `Kaydet — ${formatCurrency(grandTotal)}`}
        </button>
        <Link href="/services" style={S.cancelBtn}>İptal</Link>
      </form>
    </div>
  );
}

export default function NewServicePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      </div>
    }>
      <NewServiceForm />
    </Suspense>
  );
}
