"use client";

import { useState } from "react";
import { TableCellsIcon, ArrowDownTrayIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function downloadExcel() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/reports/excel?${params.toString()}`);
      if (!res.ok) throw new Error("Excel oluşturulamadı");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `karatasoto_servis_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel indirildi");
    } catch {
      toast.error("Excel indirme başarısız");
    }
    setLoading(false);
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#0f172a", backgroundColor: "#fff", outline: "none", boxSizing: "border-box" };
  const label: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 };

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.01em" }}>Raporlar</h1>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px 0" }}>Servis kayıtlarını dışa aktarın</p>

      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <TableCellsIcon style={{ width: 18, height: 18, color: "#16a34a" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: 0 }}>Excel Rapor</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Servis kayıtlarını dışa aktar</p>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={label}>Başlangıç Tarihi</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={label}>Bitiş Tarihi</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inp} />
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px 0" }}>
            Tarih seçmezseniz tüm servis kayıtları indirilir.
          </p>

          <button
            onClick={downloadExcel}
            disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: loading ? "#6ee7b7" : "#059669", color: "#fff", padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            {loading ? "Hazırlanıyor..." : "Excel İndir"}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
        <InformationCircleIcon style={{ width: 16, height: 16, color: "#4f46e5", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#4338ca", margin: 0, lineHeight: 1.6 }}>
          Tek bir servis kaydına ait PDF fişi veya Excel raporu almak için o servisin{" "}
          <strong>detay sayfasına</strong> gidin.
        </p>
      </div>
    </div>
  );
}
