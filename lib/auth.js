import { supabaseAdmin } from './supabaseAdmin';

// Verify the Supabase JWT from an API request's Authorization header.
export async function getUserFromRequest(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user;
}

export async function getProfile(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}
