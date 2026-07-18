import { createClient } from '@supabase/supabase-js';

// Browser client (anon key). Carries the logged-in staff JWT after sign-in,
// so RLS applies as the authenticated user.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
