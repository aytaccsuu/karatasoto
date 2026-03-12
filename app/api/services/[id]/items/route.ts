import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { product_id, name, quantity, unit_price, note } = body;

  if (!name?.trim() || !quantity || !unit_price) {
    return NextResponse.json({ error: "Ürün adı, miktar ve birim fiyat zorunludur" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("add_service_item", {
    p_service_record_id: id,
    p_product_id: product_id || null,
    p_name: name.trim(),
    p_quantity: parseFloat(quantity),
    p_unit_price: parseFloat(unit_price),
    p_note: note?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
