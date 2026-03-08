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

  // Toplam hesaplama
  const partsTotal = body.line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const kdvEnabled = body.kdv_enabled || false;
  const kdvAmount = body.kdv_amount || 0;
  const grandTotal = partsTotal + (body.labor_cost || 0) + kdvAmount;
  const debtAdded = body.payment_type === "veresiye" ? grandTotal : 0;
  const amountPaid = body.payment_type === "veresiye" ? 0 : grandTotal;

  // Servis kaydini olustur
  const { data: record, error: recordError } = await supabase
    .from("service_records")
    .insert({
      vehicle_id: body.vehicle_id,
      customer_id: body.customer_id,
      service_date: body.service_date,
      km_at_service: body.km_at_service || null,
      labor_cost: body.labor_cost || 0,
      parts_total: partsTotal,
      grand_total: grandTotal,
      kdv_enabled: kdvEnabled,
      kdv_amount: kdvAmount,
      payment_type: body.payment_type,
      amount_paid: amountPaid,
      debt_added: debtAdded,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (recordError) {
    return NextResponse.json({ error: recordError.message }, { status: 400 });
  }

  // Satir kalemlerini kaydet
  if (body.line_items.length > 0) {
    const lineItemsPayload = body.line_items.map((item, index) => ({
      service_record_id: record.id,
      product_id: item.product_id || null,
      name: item.name.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      sort_order: index,
    }));

    const { error: lineError } = await supabase
      .from("service_line_items")
      .insert(lineItemsPayload);

    if (lineError) {
      return NextResponse.json({ error: lineError.message }, { status: 400 });
    }
  }

  // Veresiye ise musterinin borcunu guncelle
  if (body.payment_type === "veresiye") {
    const { data: customer } = await supabase
      .from("customers")
      .select("total_debt")
      .eq("id", body.customer_id)
      .single();

    const newDebt = (customer?.total_debt || 0) + grandTotal;

    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", body.customer_id);

    await supabase.from("debt_transactions").insert({
      customer_id: body.customer_id,
      service_record_id: record.id,
      transaction_type: "veresiye",
      amount: grandTotal,
      description: `Servis - ${record.service_date}`,
      balance_after: newDebt,
    });
  }

  return NextResponse.json({ data: record }, { status: 201 });
}
