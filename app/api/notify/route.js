export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getUserFromRequest, getProfile } from '../../../lib/auth';
import { readyMessage } from '../../../lib/messages';

// Staff marks a queue entry ready and pushes the customer a notification.
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 403 });

  const { queueSessionId } = await req.json();
  const { data: qs } = await supabaseAdmin
    .from('queue_sessions').select('*').eq('id', queueSessionId).maybeSingle();
  if (!qs || qs.business_id !== profile.business_id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await supabaseAdmin
    .from('queue_sessions').update({ status: 'ready', ready_at: new Date().toISOString() }).eq('id', queueSessionId);

  const { data: biz } = await supabaseAdmin
    .from('businesses').select('business_type, queue_label').eq('id', qs.business_id).single();
  const msg = readyMessage(biz.business_type, biz.queue_label, qs.queue_number, qs.customer_name);

  const { data: sessions } = await supabaseAdmin
    .from('customer_sessions').select('id, push_subscription').eq('queue_session_id', queueSessionId);
  const subs = (sessions || []).filter((s) => s.push_subscription);

  if (subs.length && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@queper.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(s.push_subscription, JSON.stringify({ ...msg, url: '/' }));
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('customer_sessions').update({ push_subscription: null }).eq('id', s.id);
        }
      }
    }));
  }

  return NextResponse.json({ ok: true, notified: subs.length });
}
