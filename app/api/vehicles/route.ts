import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";


export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");

  let query = supabase
    .from("vehicles")
    .select("*, customer:customers(id, first_name, last_name, phone)")
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const plate = body.plate.trim().toUpperCase();

  // Plaka tekrar kontrolü
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id, plate, customer:customers(first_name, last_name)")
    .eq("plate", plate)
    .maybeSingle();

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const owner = existing.customer as any;
    const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : "başka bir müşteri";
    return NextResponse.json(
      { error: `Bu plaka (${plate}) zaten kayıtlı: ${ownerName}` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      customer_id: body.customer_id,
      plate,
      brand: body.brand.trim(),
      model: body.model.trim(),
      year: body.year || null,
      km: body.km || null,
      chassis_number: body.chassis_number?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
