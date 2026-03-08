import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Musteri bulunamadi" }, { status: 404 });
  }

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const { data: debt_transactions } = await supabase
    .from("debt_transactions")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: { ...customer, vehicles, debt_transactions } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("customers")
    .update({
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      phone: body.phone?.trim() || null,
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

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
