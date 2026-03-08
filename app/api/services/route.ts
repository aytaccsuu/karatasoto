import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import type { ServiceRecordInput } from "@/types";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const paymentType = searchParams.get("payment_type");
  const customerId = searchParams.get("customer_id");
  const vehicleId = searchParams.get("vehicle_id");

  let query = supabase
    .from("service_records")
    .select(
      `id, service_date, km_at_service, labor_cost, parts_total, grand_total,
      kdv_enabled, kdv_amount, payment_type, amount_paid, debt_added, notes, created_at,
      vehicle_id, customer_id,
      vehicle:vehicles(id, plate, brand, model),
      customer:customers(id, first_name, last_name, phone)`
    )
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (from) query = query.gte("service_date", from);
  if (to) query = query.lte("service_date", to);
  if (paymentType) query = query.eq("payment_type", paymentType);
  if (customerId) query = query.eq("customer_id", customerId);
  if (vehicleId) query = query.eq("vehicle_id", vehicleId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json() as ServiceRecordInput & { kdv_enabled?: boolean; kdv_amount?: number };

  // Toplam hesaplama (client-side ile aynı mantık)
  const partsTotal = body.line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const kdvEnabled = body.kdv_enabled || false;
  const kdvAmount = body.kdv_amount || 0;
  const grandTotal = partsTotal + (body.labor_cost || 0) + kdvAmount;
  const debtAdded = body.payment_type === "veresiye" ? grandTotal : 0;
  const amountPaid = body.payment_type === "veresiye" ? 0 : grandTotal;

  // Satır kalemlerini RPC için hazırla
  const lineItemsJson = body.line_items.map((item, index) => ({
    product_id: item.product_id || null,
    name: item.name.trim(),
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.quantity * item.unit_price,
    sort_order: index,
  }));

  // Tek RPC çağrısı: servis + satırlar + borç — hepsi tek DB round-trip
  const { data, error } = await supabase.rpc("create_service_full", {
    p_vehicle_id:    body.vehicle_id,
    p_customer_id:   body.customer_id,
    p_service_date:  body.service_date,
    p_km_at_service: body.km_at_service || null,
    p_labor_cost:    body.labor_cost || 0,
    p_parts_total:   partsTotal,
    p_grand_total:   grandTotal,
    p_kdv_enabled:   kdvEnabled,
    p_kdv_amount:    kdvAmount,
    p_payment_type:  body.payment_type,
    p_amount_paid:   amountPaid,
    p_debt_added:    debtAdded,
    p_notes:         body.notes || null,
    p_line_items:    lineItemsJson,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
