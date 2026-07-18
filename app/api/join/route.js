export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const ACTIVE = ['created', 'waiting', 'ready'];
const TTL_MS = 2 * 60 * 60 * 1000; // 2h (PRD section 24)

// Anonymous customer joins a queue by business token + queue number.
export async function POST(req) {
  const { token, queueNumber, name } = await req.json();
  if (!token || !queueNumber) return NextResponse.json({ error: 'missing' }, { status: 400 });
  const num = String(queueNumber).trim();
  const displayName = name ? String(name).trim().slice(0, 40) || null : null;

  const { data: biz } = await supabaseAdmin
    .from('businesses').select('id, name, business_type, queue_label')
    .eq('join_token', token).maybeSingle();
  if (!biz) return NextResponse.json({ error: 'business_not_found' }, { status: 404 });

  const { data: found } = await supabaseAdmin
    .from('queue_sessions').select('*')
    .eq('business_id', biz.id).eq('queue_number', num).in('status', ACTIVE)
    .order('created_at', { ascending: false }).limit(1);
  let session = found && found[0];

  const now = new Date();
  const expires = new Date(now.getTime() + TTL_MS).toISOString();

  if (!session) {
    // Self-service: no staff-created entry — create one and attach.
    const { data, error } = await supabaseAdmin.from('queue_sessions')
      .insert({ business_id: biz.id, queue_number: num, customer_name: displayName, status: 'waiting', joined_at: now.toISOString(), expires_at: expires })
      .select().single();
    if (error) {
      if (String(error.message).includes('FREE_LIMIT_REACHED')) {
        return NextResponse.json({ error: 'free_limit_reached' }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    session = data;
  } else if (session.status === 'created' && !session.joined_at) {
    // Staff pre-created this entry — attach the customer.
    const { data } = await supabaseAdmin.from('queue_sessions')
      .update({ status: 'waiting', customer_name: displayName, joined_at: now.toISOString(), expires_at: expires })
      .eq('id', session.id).select().single();
    session = data;
  } else if (session.status === 'ready') {
    // Joined after it was already called — let them see the ready screen.
  } else if (session.joined_at) {
    // ponytail: no staff "reset/override" UI yet — returns the PRD conflict message. Add a reset button if needed.
    return NextResponse.json({ error: 'already_connected' }, { status: 409 });
  }

  const { data: cs } = await supabaseAdmin.from('customer_sessions')
    .insert({ queue_session_id: session.id, expires_at: expires }).select().single();

  return NextResponse.json({
    customerSessionId: cs.id,
    number: num,
    label: biz.queue_label,
    businessName: biz.name,
    status: session.status,
  });
}
