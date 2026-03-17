import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const supabase = createAdminClient();

  // Müşteri bilgisi + borç hareketleri
  const { data: customer, error: custErr } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
  }

  // Servis kayıtları (araç plakası ile)
  const { data: services } = await supabase
    .from("service_records")
    .select("id, service_date, grand_total, payment_type, created_at, vehicle:vehicles(plate)")
    .eq("customer_id", customerId)
    .order("service_date", { ascending: false });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  // Font yükle
  let fontLoaded = false;
  try {
    const regularPath = path.join(process.cwd(), "public", "DejaVuSans.ttf");
    const boldPath = path.join(process.cwd(), "public", "DejaVuSans-Bold.ttf");
    const regularData = fs.readFileSync(regularPath).toString("base64");
    const boldData = fs.readFileSync(boldPath).toString("base64");
    doc.addFileToVFS("DejaVuSans.ttf", regularData);
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", boldData);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVuSans", "bold");
    fontLoaded = true;
  } catch { /* helvetica fallback */ }

  const F = fontLoaded ? "DejaVuSans" : "helvetica";

  // Logo
  const logoH = 24;
  const logoW = 60;
  let logoLoaded = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoData = fs.readFileSync(logoPath).toString("base64");
    doc.addImage(logoData, "PNG", (pw - logoW) / 2, 10, logoW, logoH);
    logoLoaded = true;
  } catch { /* logo yoksa atla */ }

  let y = logoLoaded ? 10 + logoH + 4 : 14;

  // Başlık
  doc.setFont(F, "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("MÜŞTERİ HESABİ", pw / 2, y, { align: "center" });
  y += 7;

  // Tarih
  doc.setFont(F, "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const today = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  doc.text(`Düzenleme Tarihi: ${today}`, pw / 2, y, { align: "center" });
  y += 8;

  // Ayraç
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pw - 14, y);
  y += 6;

  // Müşteri bilgileri
  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${customer.first_name} ${customer.last_name}`, 14, y);
  y += 6;
  if (customer.phone) {
    doc.setFont(F, "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tel: ${customer.phone}`, 14, y);
    y += 5;
  }

  // Borç durumu kutusu
  y += 3;
  const hasDebt = customer.total_debt > 0;
  const boxColor = hasDebt ? [254, 242, 242] : [240, 253, 244];
  const boxBorder = hasDebt ? [254, 202, 202] : [187, 247, 208];
  const textColor = hasDebt ? [220, 38, 38] : [22, 163, 74];

  doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
  doc.setDrawColor(boxBorder[0], boxBorder[1], boxBorder[2]);
  doc.roundedRect(14, y, pw - 28, 12, 2, 2, "FD");

  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const debtLabel = hasDebt
    ? `Güncel Borç: ${customer.total_debt.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
    : "BORCU YOK";
  doc.text(debtLabel, pw / 2, y + 7.5, { align: "center" });
  y += 16;

  // Servis kayıtları tablosu
  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("SERVİS GEÇMİŞİ", 14, y);
  y += 4;

  const PAYMENT_LABELS: Record<string, string> = {
    nakit: "Nakit",
    kredi_karti: "Kredi Kartı",
    eft_havale: "EFT/Havale",
    veresiye: "Veresiye",
  };

  const rows: string[][] = [];

  if (!services || services.length === 0) {
    rows.push(["—", "—", "—", "—"]);
  } else {
    for (const s of services) {
      const date = new Date(s.service_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const vehicleData = s.vehicle as unknown as { plate: string } | { plate: string }[] | null;
      const plate = (Array.isArray(vehicleData) ? vehicleData[0]?.plate : vehicleData?.plate) ?? "—";
      const amount = `${s.grand_total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`;
      const payLabel = PAYMENT_LABELS[s.payment_type] ?? s.payment_type;
      rows.push([date, plate, amount, payLabel]);
    }
  }

  autoTable(doc, {
    startY: y,
    head: [["Tarih", "Plaka", "Tutar", "Ödeme"]],
    body: rows,
    margin: { left: 14, right: 14 },
    styles: { font: F, fontSize: 9, cellPadding: 3, textColor: [51, 65, 85] },
    headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: "bold", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: "auto" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val === "Veresiye") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (val === "Nakit") {
          data.cell.styles.textColor = [22, 163, 74];
        } else if (val === "Kredi Kartı") {
          data.cell.styles.textColor = [37, 99, 235];
        } else if (val === "EFT/Havale") {
          data.cell.styles.textColor = [124, 58, 237];
        }
      }
    },
  });

  // Alt satır
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont(F, "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Bu belge Karataş Oto Servis Takip Sistemi tarafından oluşturulmuştur.", pw / 2, pageH - 8, { align: "center" });

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
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
