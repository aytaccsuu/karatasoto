import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // --- Durum güncelleme ---
  if (body.status !== undefined) {
    const validStatuses = ["taslak", "gonderildi", "onaylandi", "reddedildi"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("quotes")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  // --- Kalem güncelleme: adet ve/veya fiyat ---
  if (body.line_items !== undefined) {
    const { data: current, error: fetchErr } = await supabase
      .from("quotes")
      .select("labor_cost, kdv_enabled")
      .eq("id", id)
      .single();
    if (fetchErr || !current) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
    }

    // line_total'ları sunucuda yeniden hesapla
    const items = (body.line_items as { name: string; quantity: number; unit_price: number }[]).map((li) => ({
      name: li.name,
      quantity: Number(li.quantity),
      unit_price: Number(li.unit_price),
      line_total: Math.round(Number(li.quantity) * Number(li.unit_price) * 100) / 100,
    }));

    const partsTotal = items.reduce((s, li) => s + li.line_total, 0);
    const subtotal = partsTotal + (current.labor_cost || 0);
    const kdvAmount = current.kdv_enabled ? Math.round(subtotal * 0.20 * 100) / 100 : 0;
    const grandTotal = Math.round((subtotal + kdvAmount) * 100) / 100;

    const { data, error } = await supabase
      .from("quotes")
      .update({ line_items: items, parts_total: partsTotal, kdv_amount: kdvAmount, grand_total: grandTotal, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Güncellenecek alan belirtilmedi" }, { status: 400 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
