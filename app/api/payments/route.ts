import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();
  const { customer_id, amount, description, service_record_id } = body;

  if (!customer_id || !amount || amount <= 0) {
    return NextResponse.json({ error: "Gecersiz odeme verisi" }, { status: 400 });
  }

  // Tek RPC çağrısı: borç güncelleme + işlem kaydı — tek DB round-trip
  const { data, error } = await supabase.rpc("record_payment", {
    p_customer_id:       customer_id,
    p_amount:            amount,
    p_description:       description || "Manuel odeme",
    p_service_record_id: service_record_id || null,
  });

  if (error) {
    // "Musteri bulunamadi" hatası için 404
    if (error.message?.includes("bulunamadi")) {
      return NextResponse.json({ error: "Musteri bulunamadi" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data.transaction, new_debt: data.new_debt }, { status: 201 });
}
