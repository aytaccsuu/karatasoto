import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  let query = supabase
    .from("customers")
    .select("id, first_name, last_name, phone, total_debt, created_at, updated_at")
    .order("last_name", { ascending: true })
    .limit(1000);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
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

  const { data, error } = await supabase
    .from("customers")
    .insert({
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      phone: body.phone?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
