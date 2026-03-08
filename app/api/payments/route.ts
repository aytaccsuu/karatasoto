import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { customer_id, amount, description, service_record_id } = body;

  if (!customer_id || !amount || amount <= 0) {
    return NextResponse.json({ error: "Gecersiz odeme verisi" }, { status: 400 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("total_debt")
    .eq("id", customer_id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Musteri bulunamadi" }, { status: 404 });
  }

  const newDebt = Math.max(0, (customer.total_debt || 0) - amount);

  await supabase
    .from("customers")
    .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
    .eq("id", customer_id);

  const { data, error } = await supabase
    .from("debt_transactions")
    .insert({
      customer_id,
      service_record_id: service_record_id || null,
      transaction_type: "odeme",
      amount: -amount,
      description: description || "Manuel odeme",
      balance_after: newDebt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data, new_debt: newDebt }, { status: 201 });
}
