import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 });
  }

  // Önce cookie'den user'ı al
  const cookieStore = await cookies();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)!;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Cookie'den alınamazsa Authorization header'a bak
  let userId = user?.id;

  if (!userId) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
      userId = tokenUser?.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." }, { status: 401 });
  }

  // Admin client ile şifreyi güncelle (service_role key ile)
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
