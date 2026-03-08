import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params;
  const supabase = createAdminClient();

  const { data: record, error } = await supabase
    .from("service_records")
    .select(
      `*, vehicle:vehicles(*, customer:customers(*)), customer:customers(*), line_items:service_line_items(*)`
    )
    .eq("id", serviceId)
    .single();

  if (error || !record) {
    return NextResponse.json({ error: "Servis kaydi bulunamadi" }, { status: 404 });
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210
  const customer = record.customer || {};
  const vehicle = record.vehicle || {};

  // --- FONT YUKLE (Turkce karakter destegi) ---
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
  } catch {
    // font yuklenemezse helvetica kullan
  }

  const F = fontLoaded ? "DejaVuSans" : "helvetica";

  // --- LOGO (ortada) ---
  const logoH = 28;
  const logoW = 70;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoData = fs.readFileSync(logoPath);
    const logoBase64 = logoData.toString("base64");
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      "PNG",
      (pw - logoW) / 2,
      6,
      logoW,
      logoH
    );
  } catch {
    doc.setFontSize(16);
    doc.setFont(F, "bold");
    doc.text("KARATAS OTO", pw / 2, 18, { align: "center" });
  }

  // Servis tarihi sağ üst
  doc.setFontSize(9);
  doc.setFont(F, "normal");
  doc.text(
    `Tarih: ${new Date(record.service_date).toLocaleDateString("tr-TR")}`,
    pw - 14,
    12,
    { align: "right" }
  );
  doc.text(
    `Servis No: ${serviceId.slice(0, 8).toUpperCase()}`,
    pw - 14,
    19,
    { align: "right" }
  );

  // --- AYIRICI ÇİZGİ ---
  let y = 38;
  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 30, 30);
  doc.line(10, y, pw - 10, y);
  y += 6;

  // --- MÜŞTERİ & ARAÇ BİLGİLERİ (2 sütun) ---
  doc.setFontSize(8.5);
  const lx = 12;
  const rx2 = pw / 2 + 5;

  const infoRows = [
    ["Araç Sahibinin Adı:", `${customer.first_name || ""} ${customer.last_name || ""}`.trim()],
    ["Araç Sahibinin Tel:", customer.phone || "-"],
    ["Plaka / Şasi No:", `${vehicle.plate || ""}${vehicle.chassis_number ? " / " + vehicle.chassis_number : ""}`],
    ["Araç Markası:", vehicle.brand || "-"],
  ];
  const infoRows2 = [
    ["Araç Modeli - Yılı:", `${vehicle.model || ""}${vehicle.year ? " - " + vehicle.year : ""}`],
    ["Kilometre:", record.km_at_service ? record.km_at_service.toLocaleString("tr-TR") + " km" : "-"],
    ["Ödeme Türü:", record.payment_type === "nakit" ? "Nakit" : record.payment_type === "kredi_karti" ? "Kredi Kartı" : "Veresiye"],
    ["", ""],
  ];

  const rowH = 7;
  for (let i = 0; i < infoRows.length; i++) {
    doc.setFont(F, "bold");
    doc.text(infoRows[i][0], lx, y + i * rowH);
    doc.setFont(F, "normal");
    doc.text(infoRows[i][1], lx + 54, y + i * rowH);

    doc.setFont(F, "bold");
    doc.text(infoRows2[i][0], rx2, y + i * rowH);
    doc.setFont(F, "normal");
    doc.text(infoRows2[i][1], rx2 + 46, y + i * rowH);
  }

  y += infoRows.length * rowH + 4;

  // --- AYIRICI ÇİZGİ ---
  doc.setLineWidth(0.3);
  doc.line(10, y, pw - 10, y);
  y += 5;

  // --- KALEMLER TABLOSU ---
  const lineItems = record.line_items || [];
  const tableBody = lineItems
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((item: { name: string; quantity: number; unit_price: number; line_total: number }) => [
      item.name,
      item.quantity.toString(),
      `${item.unit_price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`,
      `${item.line_total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`,
    ]);

  autoTable(doc, {
    head: [["HİZMET / PARÇA ADI", "Adet", "Birim Fiyat", "Toplam"]],
    body: tableBody,
    startY: y,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 3, font: F },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 38, halign: "right" },
      3: { cellWidth: 39, halign: "right" },
    },
    margin: { left: 10, right: 10 },
  });

  // --- ÖZET ALANI ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fy = (doc as any).lastAutoTable.finalY + 6;
  const summaryX = pw - 90;
  const summaryW = 80;

  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);

  const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";

  const summaryRows: { label: string; value: string; bold?: boolean; red?: boolean; amber?: boolean }[] = [
    { label: "Parça Toplamı:", value: fmt(record.parts_total) },
  ];

  if (record.labor_cost > 0) {
    summaryRows.push({ label: "İşçilik Ücreti:", value: fmt(record.labor_cost) });
  }

  if (record.kdv_enabled && record.kdv_amount > 0) {
    summaryRows.push({ label: "KDV (%20):", value: fmt(record.kdv_amount), amber: true });
  }

  summaryRows.push({ label: "GENEL TOPLAM:", value: fmt(record.grand_total), bold: true });

  if (record.payment_type === "veresiye" && customer.total_debt > 0) {
    summaryRows.push({
      label: "Kalan Borç:",
      value: fmt(customer.total_debt),
      bold: true, red: true,
    });
  }

  const summaryRowH = 7;
  const summaryBoxH = summaryRows.length * summaryRowH + 6;
  doc.rect(summaryX - 2, fy - 3, summaryW + 2, summaryBoxH);

  for (const row of summaryRows) {
    doc.setFont(F, row.bold ? "bold" : "normal");
    doc.setFontSize(9);
    if (row.red) doc.setTextColor(180, 0, 0);
    else if (row.amber) doc.setTextColor(160, 100, 0);
    else doc.setTextColor(0, 0, 0);
    doc.text(row.label, summaryX, fy);
    doc.text(row.value, pw - 12, fy, { align: "right" });
    fy += summaryRowH;
  }
  doc.setTextColor(0, 0, 0);

  // --- NOT ---
  if (record.notes) {
    fy += 4;
    doc.setFont(F, "bold");
    doc.setFontSize(8.5);
    doc.text("Notlar:", 12, fy);
    doc.setFont(F, "normal");
    const noteLines = doc.splitTextToSize(record.notes, pw - 24);
    doc.text(noteLines, 12, fy + 6);
    fy += 6 + noteLines.length * 5;
  }

  // --- ALT BİLGİ ---
  const pageH = doc.internal.pageSize.getHeight();
  doc.setLineWidth(0.4);
  doc.setDrawColor(30, 30, 30);
  doc.line(10, pageH - 18, pw - 10, pageH - 18);

  doc.setFontSize(7.5);
  doc.setFont(F, "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Karataş Oto | Araç Bakım ve Servis | Teşekkür ederiz!", pw / 2, pageH - 12, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  const pdfBytes = doc.output("arraybuffer");

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="servis_${serviceId.slice(0, 8)}.pdf"`,
    },
  });
}
