export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Store the customer's web-push subscription on their session.
export async function POST(req) {
  const { customerSessionId, subscription } = await req.json();
  if (!customerSessionId || !subscription) return NextResponse.json({ error: 'missing' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('customer_sessions').update({ push_subscription: subscription }).eq('id', customerSessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
