import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const anon = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  )!;

  // Mevcut kullanıcıyı doğrula
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anon,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { display_name, phone, email } = body;

  const admin = createAdminClient();

  // user_metadata güncelle (display_name + phone)
  const updatePayload: Record<string, unknown> = {
    user_metadata: {
      ...user.user_metadata,
      display_name: display_name?.trim() || "",
      phone: phone?.trim() || "",
    },
  };

  // E-posta değiştiyse ekle
  if (email && email.trim() !== user.email) {
    updatePayload.email = email.trim();
  }

  const { error } = await admin.auth.admin.updateUserById(
    user.id,
    updatePayload
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
