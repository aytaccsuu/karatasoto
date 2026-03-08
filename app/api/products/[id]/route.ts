import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("products")
    .update({
      name: body.name.trim(),
      unit_price: Number(body.unit_price),
      unit: body.unit || "adet",
      is_active: body.is_active !== undefined ? body.is_active : true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Önce hard delete dene; FK kısıtlaması varsa soft delete (is_active=false)
  const { error: hardError } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (hardError) {
    // FK violation — sadece pasife al
    const { error: softError } = await supabase
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (softError) {
      return NextResponse.json({ error: softError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, soft: true });
  }

  return NextResponse.json({ success: true });
}
