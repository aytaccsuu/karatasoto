import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createAdminClient();

  // Servis kayıtları
  let svcQuery = supabase
    .from("service_records")
    .select(`
      id, service_date, km_at_service,
      labor_cost, parts_total, grand_total,
      kdv_enabled, kdv_amount,
      payment_type, amount_paid, debt_added, notes,
      created_at,
      vehicle:vehicles(plate, brand, model),
      customer:customers(id, first_name, last_name, phone),
      line_items:service_line_items(name, quantity, unit_price, line_total, sort_order)
    `)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) svcQuery = svcQuery.gte("service_date", from);
  if (to) svcQuery = svcQuery.lte("service_date", to);

  const { data: services, error: svcErr } = await svcQuery;
  if (svcErr) return NextResponse.json({ error: svcErr.message }, { status: 500 });

  // Ödeme hareketleri (tüm debt_transactions — veresiye ekleme + ödemeler + düzeltmeler)
  let payQuery = supabase
    .from("debt_transactions")
    .select(`
      id, transaction_type, amount, description, balance_after, created_at,
      customer:customers(id, first_name, last_name, phone),
      service_record:service_records(id, service_date, vehicle:vehicles(plate))
    `)
    .order("created_at", { ascending: false });

  if (from) payQuery = payQuery.gte("created_at", from);
  if (to) {
    // to günü dahil: günün sonu
    payQuery = payQuery.lte("created_at", to + "T23:59:59.999Z");
  }

  const { data: payments, error: payErr } = await payQuery;
  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // Özet hesapla
  const svcList = services || [];
  const summary = {
    total_services: svcList.length,
    total_revenue: svcList.reduce((s, r) => s + (r.grand_total || 0), 0),
    by_payment: {
      nakit: svcList.filter((r) => r.payment_type === "nakit").reduce((s, r) => s + r.grand_total, 0),
      kredi_karti: svcList.filter((r) => r.payment_type === "kredi_karti").reduce((s, r) => s + r.grand_total, 0),
      eft_havale: svcList.filter((r) => r.payment_type === "eft_havale").reduce((s, r) => s + r.grand_total, 0),
      veresiye: svcList.filter((r) => r.payment_type === "veresiye").reduce((s, r) => s + r.grand_total, 0),
    },
    total_labor: svcList.reduce((s, r) => s + (r.labor_cost || 0), 0),
    total_parts: svcList.reduce((s, r) => s + (r.parts_total || 0), 0),
    total_payments_received: (payments || [])
      .filter((p) => p.transaction_type === "odeme")
      .reduce((s, p) => s + Math.abs(p.amount), 0),
  };

  return NextResponse.json({ services: svcList, payments: payments || [], summary }, {
    headers: { "Cache-Control": "no-store" },
  });
}
