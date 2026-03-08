import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const { quoteId } = await params;
  const supabase = createAdminClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  // --- FONT ---
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

  // --- LOGO ---
  const logoH = 28;
  const logoW = 70;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBase64 = fs.readFileSync(logoPath).toString("base64");
    doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", (pw - logoW) / 2, 6, logoW, logoH);
  } catch {
    doc.setFontSize(16);
    doc.setFont(F, "bold");
    doc.text("KARATAS OTO", pw / 2, 18, { align: "center" });
  }

  // Sağ üst: Teklif No ve Tarih
  doc.setFontSize(9);
  doc.setFont(F, "normal");
  doc.text(`Teklif No: ${quote.quote_number}`, pw - 14, 12, { align: "right" });
  doc.text(`Tarih: ${new Date(quote.quote_date).toLocaleDateString("tr-TR")}`, pw - 14, 19, { align: "right" });
  if (quote.valid_until) {
    doc.text(`Geçerlilik: ${new Date(quote.valid_until).toLocaleDateString("tr-TR")}`, pw - 14, 26, { align: "right" });
  }

  // "FİYAT TEKLİFİ" başlık bandı
  let y = 38;
  doc.setFillColor(30, 30, 30);
  doc.rect(10, y, pw - 20, 9, "F");
  doc.setFontSize(11);
  doc.setFont(F, "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("FİYAT TEKLİFİ", pw / 2, y + 6.2, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y += 14;

  // --- MÜŞTERİ & ARAÇ BİLGİLERİ ---
  doc.setFontSize(8.5);
  const lx = 12;
  const rx = pw / 2 + 5;

  const leftInfo = [
    ["Müşteri:", quote.customer_name || "-"],
    ["Araç:", quote.vehicle_info || "-"],
  ];
  const rightInfo: string[][] = [];

  const rowH = 7;
  for (let i = 0; i < leftInfo.length; i++) {
    doc.setFont(F, "bold");
    doc.text(leftInfo[i][0], lx, y + i * rowH);
    doc.setFont(F, "normal");
    doc.text(leftInfo[i][1], lx + 28, y + i * rowH);
  }
  for (let i = 0; i < rightInfo.length; i++) {
    doc.setFont(F, "bold");
    doc.text(rightInfo[i][0], rx, y + i * rowH);
    doc.setFont(F, "normal");
    doc.text(rightInfo[i][1], rx + 36, y + i * rowH);
  }

  y += Math.max(leftInfo.length, rightInfo.length) * rowH + 4;

  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.line(10, y, pw - 10, y);
  y += 5;

  // --- KALEMLER TABLOSU ---
  const lineItems: { name: string; quantity: number; unit_price: number; line_total: number }[] = quote.line_items || [];
  const tableBody = lineItems.map((item) => [
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
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold", fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 18, halign: "center" },
      2: { cellWidth: 38, halign: "right" },
      3: { cellWidth: 39, halign: "right" },
    },
    margin: { left: 10, right: 10 },
  });

  // --- ÖZET ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fy = (doc as any).lastAutoTable.finalY + 6;
  const summaryX = pw - 90;
  const summaryW = 80;
  const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";

  const partsTotal = lineItems.reduce((s, li) => s + li.line_total, 0);

  const summaryRows: { label: string; value: string; bold?: boolean; amber?: boolean }[] = [
    { label: "Parça / Malzeme:", value: fmt(partsTotal) },
  ];

  if (quote.labor_cost > 0) {
    summaryRows.push({ label: "İşçilik:", value: fmt(quote.labor_cost) });
  }

  if (quote.kdv_enabled && quote.kdv_amount > 0) {
    summaryRows.push({ label: "KDV (%20):", value: fmt(quote.kdv_amount), amber: true });
  }

  summaryRows.push({ label: "GENEL TOPLAM:", value: fmt(quote.grand_total), bold: true });

  const summaryRowH = 7;
  const summaryBoxH = summaryRows.length * summaryRowH + 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(summaryX - 2, fy - 3, summaryW + 2, summaryBoxH);

  for (const row of summaryRows) {
    doc.setFont(F, row.bold ? "bold" : "normal");
    doc.setFontSize(9);
    if (row.amber) doc.setTextColor(160, 100, 0);
    else doc.setTextColor(0, 0, 0);
    doc.text(row.label, summaryX, fy);
    doc.text(row.value, pw - 12, fy, { align: "right" });
    fy += summaryRowH;
  }
  doc.setTextColor(0, 0, 0);

  // --- NOT ---
  if (quote.notes) {
    fy += 4;
    doc.setFont(F, "bold");
    doc.setFontSize(8.5);
    doc.text("Not:", 12, fy);
    doc.setFont(F, "normal");
    const noteLines = doc.splitTextToSize(quote.notes, pw - 24);
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
  doc.text("Karataş Oto | Araç Bakım ve Servis | Bu teklif tarafımızca hazırlanmıştır.", pw / 2, pageH - 12, { align: "center" });
  doc.setTextColor(0, 0, 0);

  const pdfBytes = doc.output("arraybuffer");

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="teklif_${quote.quote_number}.pdf"`,
    },
  });
}
