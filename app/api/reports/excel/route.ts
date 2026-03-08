import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const serviceId = searchParams.get("serviceId");

  let query = supabase
    .from("service_records")
    .select(
      `*, vehicle:vehicles(plate, brand, model), customer:customers(first_name, last_name, phone), line_items:service_line_items(*)`
    )
    .order("service_date", { ascending: false });

  if (serviceId) {
    query = query.eq("id", serviceId);
  } else {
    if (from) query = query.gte("service_date", from);
    if (to) query = query.lte("service_date", to);
  }

  const { data: records, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const PAYMENT_LABELS: Record<string, string> = {
    nakit: "Nakit",
    kredi_karti: "Kredi Karti",
    veresiye: "Veresiye",
  };

  const rows = (records || []).map((r) => ({
    Tarih: r.service_date,
    Musteri: `${r.customer?.first_name || ""} ${r.customer?.last_name || ""}`.trim(),
    Telefon: r.customer?.phone || "",
    Plaka: r.vehicle?.plate || "",
    "Marka/Model": `${r.vehicle?.brand || ""} ${r.vehicle?.model || ""}`.trim(),
    "KM": r.km_at_service || "",
    "Parca Toplami (TL)": r.parts_total,
    "Iscilik (TL)": r.labor_cost,
    "Genel Toplam (TL)": r.grand_total,
    "Odeme Turu": PAYMENT_LABELS[r.payment_type] || r.payment_type,
    Notlar: r.notes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Sutun genisliklerini ayarla
  ws["!cols"] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Servis Kayitlari");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `karatasoto_servis_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
