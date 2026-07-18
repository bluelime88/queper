export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getCheckoutStatus, PLANS } from '../../../../lib/maya';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Maya payment webhook (PAYMENT_SUCCESS / PAYMENT_FAILED). Unsigned, so we
// reconcile by requestReferenceNumber and re-verify status with Maya before
// granting access. Idempotent.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }); }

  const reference = body.requestReferenceNumber;
  if (!reference) return NextResponse.json({ received: true });

  const { data: pay } = await supabaseAdmin
    .from('maya_payments').select('*').eq('reference', reference).maybeSingle();
  if (!pay || pay.status === 'paid') return NextResponse.json({ received: true });

  // Verify server-side rather than trusting the webhook body.
  let ok = false;
  try {
    if (pay.checkout_id) ok = (await getCheckoutStatus(pay.checkout_id)) === 'PAYMENT_SUCCESS';
    else ok = body.paymentStatus === 'PAYMENT_SUCCESS' || body.status === 'PAYMENT_SUCCESS';
  } catch { ok = false; }

  if (!ok) {
    await supabaseAdmin.from('maya_payments').update({ status: 'failed' }).eq('id', pay.id);
    return NextResponse.json({ received: true });
  }

  // Extend from the later of now or the current expiry (stacking renewals).
  const { data: biz } = await supabaseAdmin
    .from('businesses').select('subscription_expires_at').eq('id', pay.business_id).single();
  const current = biz.subscription_expires_at ? new Date(biz.subscription_expires_at).getTime() : 0;
  const startFrom = Math.max(Date.now(), current);
  const expires = new Date(startFrom + PLANS[pay.plan].days * 86400000).toISOString();

  await supabaseAdmin.from('businesses')
    .update({ plan: pay.plan, subscription_expires_at: expires }).eq('id', pay.business_id);
  await supabaseAdmin.from('maya_payments').update({ status: 'paid' }).eq('id', pay.id);

  return NextResponse.json({ received: true });
}
