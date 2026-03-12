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
