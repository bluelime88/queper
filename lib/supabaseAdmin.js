import { createClient } from '@supabase/supabase-js';

// Server-only client (service role key). Bypasses RLS — never import from a
// client component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
