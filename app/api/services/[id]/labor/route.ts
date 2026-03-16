import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// PATCH: işçilik ücretini güncelle — toplamları, KDV ve veresiye borcunu atomik düzeltir
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const newLabor = parseFloat(body.labor_cost);

  if (isNaN(newLabor) || newLabor < 0) {
    return NextResponse.json({ error: "Geçersiz işçilik ücreti" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: record, error: fetchErr } = await supabase
    .from("service_records")
    .select("id, parts_total, labor_cost, kdv_enabled, kdv_amount, grand_total, debt_added, payment_type, customer_id")
    .eq("id", id)
    .single();

  if (fetchErr || !record) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const oldLabor: number = record.labor_cost;
  if (Math.abs(newLabor - oldLabor) < 0.001) {
    return NextResponse.json({ success: true, message: "Değişiklik yok" });
  }

  // Yeni toplamları hesapla
  const newKdv = record.kdv_enabled
    ? Math.round((record.parts_total + newLabor) * 0.20 * 100) / 100
    : 0;
  const newGrand = Math.round((record.parts_total + newLabor + newKdv) * 100) / 100;
  const grandDiff = newGrand - record.grand_total;

  // Servis kaydını güncelle
  const newDebtAdded = record.payment_type === "veresiye"
    ? Math.max(0, record.debt_added + grandDiff)
    : record.debt_added;

  const { error: updateErr } = await supabase
    .from("service_records")
    .update({
      labor_cost: newLabor,
      kdv_amount: newKdv,
      grand_total: newGrand,
      debt_added: newDebtAdded,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Veresiye ise müşteri borcunu düzelt
  if (record.payment_type === "veresiye" && Math.abs(grandDiff) >= 0.01) {
    const { data: cust } = await supabase
      .from("customers")
      .select("total_debt")
      .eq("id", record.customer_id)
      .single();

    const newDebt = Math.max(0, (cust?.total_debt ?? 0) + grandDiff);

    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", record.customer_id);

    await supabase.from("debt_transactions").insert({
      customer_id: record.customer_id,
      service_record_id: id,
      transaction_type: "duzeltme",
      amount: grandDiff,
      description: `İşçilik güncellendi: ${oldLabor}₺ → ${newLabor}₺`,
      balance_after: newDebt,
    });
  }

  return NextResponse.json({ success: true, new_grand_total: newGrand });
}
