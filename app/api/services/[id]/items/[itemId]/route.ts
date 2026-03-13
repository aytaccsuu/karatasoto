import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;

  let note: string | null = null;
  try {
    const body = await request.json();
    note = body.note?.trim() || null;
  } catch {
    // body isteğe bağlı
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("remove_service_item", {
    p_item_id: itemId,
    p_note: note,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

// Kalem güncelle: mevcut kalemi kaldır, yeni değerlerle ekle (atomik toplamlar)
// Kalem adet azalt: sadece mevcut adetten küçük yeni adet kabul edilir
// Birim fiyat değiştirilemez — mevcut kayıttan alınır
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: serviceId, itemId } = await params;
  const body = await request.json();

  const newQty: number = parseFloat(body.quantity);

  if (!newQty || newQty <= 0 || isNaN(newQty)) {
    return NextResponse.json({ error: "Geçersiz adet" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Mevcut kalemi oku
  const { data: item, error: fetchErr } = await supabase
    .from("service_line_items")
    .select("name, product_id, quantity, unit_price")
    .eq("id", itemId)
    .single();

  if (fetchErr || !item) {
    return NextResponse.json({ error: "Kalem bulunamadı" }, { status: 404 });
  }

  // Güvenlik: yeni adet eski adetten küçük olmalı
  if (newQty >= item.quantity) {
    return NextResponse.json(
      { error: `Adet mevcut değerden (${item.quantity}) küçük olmalı` },
      { status: 400 }
    );
  }

  // Birim fiyat değiştirilemez — kayıttaki değer kullanılır
  const keepPrice: number = parseFloat(item.unit_price);
  const auditNote = `Adet azaltıldı: ${item.quantity} → ${newQty} (${item.unit_price}₺/adet)`;

  // 1. Eski kalemi kaldır
  const { error: removeErr } = await supabase.rpc("remove_service_item", {
    p_item_id: itemId,
    p_note: auditNote,
  });
  if (removeErr) {
    return NextResponse.json({ error: removeErr.message }, { status: 400 });
  }

  // 2. Azaltılmış adet ve aynı birim fiyatla yeniden ekle
  const { data: addData, error: addErr } = await supabase.rpc("add_service_item", {
    p_service_record_id: serviceId,
    p_product_id: item.product_id ?? null,
    p_name: item.name,
    p_quantity: newQty,
    p_unit_price: keepPrice,
    p_note: auditNote,
  });
  if (addErr) {
    return NextResponse.json({ error: addErr.message }, { status: 400 });
  }

  return NextResponse.json({ data: addData });
}
