import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

const PAYMENT_LABELS: Record<string, string> = {
  nakit: "Nakit",
  kredi_karti: "Kredi Kartı",
  eft_havale: "EFT/Havale",
  veresiye: "Veresiye",
};

const PAYMENT_COLORS: Record<string, [number, number, number]> = {
  Nakit: [22, 163, 74],
  "Kredi Kartı": [37, 99, 235],
  "EFT/Havale": [124, 58, 237],
  Veresiye: [220, 38, 38],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const supabase = createAdminClient();

  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
  }

  // Servis kayıtları: araç bilgisi + km dahil
  const { data: services } = await supabase
    .from("service_records")
    .select("id, service_date, grand_total, payment_type, km_at_service, vehicle:vehicles(plate, brand, model)")
    .eq("customer_id", customerId)
    .order("service_date", { ascending: false });

  // Tüm borç/ödeme hareketleri
  const { data: transactions } = await supabase
    .from("debt_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  // Font yükle
  let fontLoaded = false;
  try {
    const regularPath = path.join(process.cwd(), "public", "DejaVuSans.ttf");
    const boldPath = path.join(process.cwd(), "public", "DejaVuSans-Bold.ttf");
    doc.addFileToVFS("DejaVuSans.ttf", fs.readFileSync(regularPath).toString("base64"));
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", fs.readFileSync(boldPath).toString("base64"));
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVuSans", "bold");
    fontLoaded = true;
  } catch { /* helvetica fallback */ }

  const F = fontLoaded ? "DejaVuSans" : "helvetica";

  // Logo
  const logoH = 24;
  const logoW = 60;
  let logoLoaded = false;
  try {
    const logoData = fs.readFileSync(path.join(process.cwd(), "public", "logo.png")).toString("base64");
    doc.addImage(logoData, "PNG", (pw - logoW) / 2, 10, logoW, logoH);
    logoLoaded = true;
  } catch { /* yok */ }

  let y = logoLoaded ? 10 + logoH + 4 : 14;

  // Başlık
  doc.setFont(F, "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("MÜŞTERİ HESABİ", pw / 2, y, { align: "center" });
  y += 7;

  doc.setFont(F, "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  doc.text(`Düzenleme Tarihi: ${today}`, pw / 2, y, { align: "center" });
  y += 8;

  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pw - 14, y);
  y += 6;

  // Müşteri bilgileri
  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${customer.first_name} ${customer.last_name}`, 14, y);
  if (customer.phone) {
    doc.setFont(F, "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tel: ${customer.phone}`, pw - 14, y, { align: "right" });
  }
  y += 8;

  // Borç durumu kutusu
  const hasDebt = customer.total_debt > 0;
  const boxBg = hasDebt ? [254, 242, 242] : [240, 253, 244];
  const boxBdr = hasDebt ? [254, 202, 202] : [187, 247, 208];
  const debtTxt = hasDebt ? [220, 38, 38] : [22, 163, 74];
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.setDrawColor(boxBdr[0], boxBdr[1], boxBdr[2]);
  doc.roundedRect(14, y, pw - 28, 12, 2, 2, "FD");
  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(debtTxt[0], debtTxt[1], debtTxt[2]);
  doc.text(
    hasDebt ? `Güncel Borç: ${customer.total_debt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺` : "BORCU YOK",
    pw / 2, y + 7.5, { align: "center" }
  );
  y += 18;

  // ── BÖLÜM 1: SERVİS KAYITLARI ───────────────────────────────
  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("SERVİS KAYITLARI", 14, y);
  y += 4;

  type VehicleShape = { plate: string; brand: string; model: string };

  const svcRows: string[][] = [];
  if (!services || services.length === 0) {
    svcRows.push(["—", "—", "—", "—"]);
  } else {
    for (const s of services) {
      const date = new Date(s.service_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const vRaw = s.vehicle as unknown as VehicleShape | VehicleShape[] | null;
      const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
      const vehicle = v ? `${v.plate} (${v.brand} ${v.model})` : "—";
      const km = s.km_at_service ? `${s.km_at_service.toLocaleString("tr-TR")} km` : "—";
      const amount = `${s.grand_total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`;
      svcRows.push([date, vehicle, km, amount]);
    }
  }

  autoTable(doc, {
    startY: y,
    head: [["Tarih", "Araç", "KM", "Tutar"]],
    body: svcRows,
    margin: { left: 14, right: 14 },
    styles: { font: F, fontSize: 8.5, cellPadding: 3, textColor: [51, 65, 85] },
    headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28 },
      3: { cellWidth: 36, halign: "right" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // ── BÖLÜM 2: ÖDEME HAREKETLERİ ──────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcEndY = (doc as any).lastAutoTable?.finalY ?? y + 10;
  let ty = svcEndY + 10;

  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("ÖDEME HAREKETLERİ", 14, ty);
  ty += 4;

  // Servis kaydı tarihleri — servis id → tarih map
  const svcDateMap: Record<string, string> = {};
  if (services) {
    for (const s of services) {
      svcDateMap[s.id] = new Date(s.service_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
  }

  const payments = (transactions ?? []).filter((t) => t.transaction_type === "odeme");

  const txnRows: string[][] = [];
  if (payments.length === 0) {
    txnRows.push(["—", "—", "—"]);
  } else {
    for (const t of payments) {
      const txDate = new Date(t.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const svcDate = t.service_record_id ? (svcDateMap[t.service_record_id] ?? "—") : "—";
      const amtStr = `${Math.abs(t.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`;
      txnRows.push([svcDate, txDate, amtStr]);
    }
  }

  autoTable(doc, {
    startY: ty,
    head: [["Servis Tarihi", "Ödeme Tarihi", "Tutar"]],
    body: txnRows,
    margin: { left: 14, right: 14 },
    styles: { font: F, fontSize: 8.5, cellPadding: 3, textColor: [51, 65, 85] },
    headStyles: { fillColor: [241, 245, 249], textColor: [100, 116, 139], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: "auto", halign: "right", textColor: [22, 163, 74], fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Alt satır (footer)
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont(F, "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Bu belge Karataş Oto Servis Takip Sistemi tarafından oluşturulmuştur.", pw / 2, pageH - 8, { align: "center" });

  // Kullanılmayan import uyarısını önle
  void PAYMENT_LABELS;
  void PAYMENT_COLORS;

  const pdfBytes = doc.output("arraybuffer");
  const fileName = `musteri_${customer.first_name}_${customer.last_name}_hesabi.pdf`
    .replace(/İ/g, "i").replace(/Ş/g, "s").replace(/Ğ/g, "g")
    .replace(/Ö/g, "o").replace(/Ü/g, "u").replace(/Ç/g, "c")
    .replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ü/g, "u").replace(/ç/g, "c")
    .replace(/\s+/g, "_")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
    },
  });
}
