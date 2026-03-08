import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const {
    customer_id,
    customer_name,
    vehicle_info,
    quote_date,
    valid_until,
    labor_cost,
    kdv_enabled,
    kdv_amount,
    grand_total,
    notes,
    line_items,
  } = body;

  if (!customer_name || !quote_date || !line_items?.length) {
    return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
  }

  // Teklif numarası oluştur: TEK-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const quote_number = `TEK-${dateStr}-${rand}`;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      quote_number,
      customer_id: customer_id || null,
      customer_name,
      vehicle_info: vehicle_info || null,
      quote_date,
      valid_until: valid_until || null,
      status: "taslak",
      labor_cost: labor_cost || 0,
      kdv_enabled: kdv_enabled || false,
      kdv_amount: kdv_amount || 0,
      grand_total: grand_total || 0,
      notes: notes || null,
      line_items,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
