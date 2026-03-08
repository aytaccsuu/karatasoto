import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";


export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ürünler nadiren değişir — 5 dakika browser cache
  return NextResponse.json({ data }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" },
  });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name.trim(),
      unit_price: Number(body.unit_price),
      unit: body.unit || "adet",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
