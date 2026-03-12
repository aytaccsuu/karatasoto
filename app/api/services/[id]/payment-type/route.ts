import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const VALID = ["nakit", "kredi_karti", "eft_havale", "veresiye"] as const;
type PayType = (typeof VALID)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const newType: PayType = body.payment_type;

  if (!VALID.includes(newType)) {
    return NextResponse.json({ error: "Geçersiz ödeme türü" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Mevcut kaydı al
  const { data: record, error: fetchErr } = await supabase
    .from("service_records")
    .select("id, payment_type, grand_total, debt_added, customer_id")
    .eq("id", id)
    .single();

  if (fetchErr || !record) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }

  const oldType: PayType = record.payment_type;

  if (oldType === newType) {
    return NextResponse.json({ success: true, message: "Değişiklik yok" });
  }

  const oldIsVeresiye = oldType === "veresiye";
  const newIsVeresiye = newType === "veresiye";

  // Müşteri borcunu oku (sadece veresiye geçişlerinde gerekli)
  let customerDebt = 0;
  if (oldIsVeresiye || newIsVeresiye) {
    const { data: cust } = await supabase
      .from("customers")
      .select("total_debt")
      .eq("id", record.customer_id)
      .single();
    customerDebt = cust?.total_debt ?? 0;
  }

  // Servis kaydını güncelle
  const updateFields: Record<string, unknown> = {
    payment_type: newType,
    updated_at: new Date().toISOString(),
  };

  if (oldIsVeresiye && !newIsVeresiye) {
    // veresiye → ödendi: borcu geri al
    updateFields.debt_added = 0;
  } else if (!oldIsVeresiye && newIsVeresiye) {
    // ödendi → veresiye: toplam tutarı borç olarak ekle
    updateFields.debt_added = record.grand_total;
  }

  const { error: updateErr } = await supabase
    .from("service_records")
    .update(updateFields)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Müşteri borcunu ve log'u güncelle
  if (oldIsVeresiye && !newIsVeresiye && record.debt_added > 0) {
    // Borcu azalt
    const newDebt = Math.max(0, customerDebt - record.debt_added);
    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", record.customer_id);

    await supabase.from("debt_transactions").insert({
      customer_id: record.customer_id,
      service_record_id: id,
      transaction_type: "duzeltme",
      amount: -record.debt_added,
      description: `Ödeme türü değiştirildi: Veresiye → ${newType}`,
      balance_after: newDebt,
    });
  } else if (!oldIsVeresiye && newIsVeresiye) {
    // Borç ekle
    const newDebt = customerDebt + record.grand_total;
    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", record.customer_id);

    await supabase.from("debt_transactions").insert({
      customer_id: record.customer_id,
      service_record_id: id,
      transaction_type: "veresiye",
      amount: record.grand_total,
      description: `Ödeme türü değiştirildi: ${oldType} → Veresiye`,
      balance_after: newDebt,
    });
  }

  return NextResponse.json({ success: true });
}
