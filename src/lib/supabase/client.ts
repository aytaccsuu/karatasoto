import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)!;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anon
  );
}
