import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("service_records")
    .select(
      `*,
      vehicle:vehicles(*, customer:customers(*)),
      customer:customers(*),
      line_items:service_line_items(*),
      debt_transactions(*),
      service_item_audit(*)`
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Servis kaydi bulunamadi" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Once kaydi getir
  const { data: record } = await supabase
    .from("service_records")
    .select("*")
    .eq("id", id)
    .single();

  if (!record) {
    return NextResponse.json({ error: "Kayit bulunamadi" }, { status: 404 });
  }

  // Veresiye kaydi ise borcu geri al
  if (record.payment_type === "veresiye" && record.debt_added > 0) {
    const { data: customer } = await supabase
      .from("customers")
      .select("total_debt")
      .eq("id", record.customer_id)
      .single();

    const newDebt = Math.max(0, (customer?.total_debt || 0) - record.debt_added);

    await supabase
      .from("customers")
      .update({ total_debt: newDebt, updated_at: new Date().toISOString() })
      .eq("id", record.customer_id);
  }

  const { error } = await supabase.from("service_records").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
