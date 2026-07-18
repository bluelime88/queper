export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Anonymous status poll for the customer's open page (fallback to push).
export async function GET(req) {
  const cs = new URL(req.url).searchParams.get('cs');
  if (!cs) return NextResponse.json({ error: 'missing' }, { status: 400 });

  const { data } = await supabaseAdmin
    .from('customer_sessions')
    .select('id, queue_sessions(status, queue_number, expires_at)')
    .eq('id', cs).maybeSingle();
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const q = data.queue_sessions;
  let status = q?.status || 'expired';
  if (q?.expires_at && new Date(q.expires_at) < new Date()) status = 'expired';

  return NextResponse.json({ status, number: q?.queue_number });
}
