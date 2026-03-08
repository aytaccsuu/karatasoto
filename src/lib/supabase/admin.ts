import { createClient } from '@supabase/supabase-js';

// Service role key varsa RLS bypass eder, yoksa anon key kullanir
// Her iki durumda da sadece server-side API route'larda kullanilir
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)!;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
