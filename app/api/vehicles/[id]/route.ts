import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .select("*, customer:customers(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Arac bulunamadi" }, { status: 404 });
  }

  const { data: service_records } = await supabase
    .from("service_records")
    .select("*, line_items:service_line_items(*)")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false });

  return NextResponse.json({ data: { ...vehicle, service_records } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("vehicles")
    .update({
      plate: body.plate.trim().toUpperCase(),
      brand: body.brand.trim(),
      model: body.model.trim(),
      year: body.year || null,
      km: body.km || null,
      chassis_number: body.chassis_number?.trim() || null,
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

  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
