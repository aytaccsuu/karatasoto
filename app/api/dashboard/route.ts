import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dashboard_stats")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, {
    headers: {
      // 30 saniye cache, 60 saniye stale-while-revalidate
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
    },
  });
}
