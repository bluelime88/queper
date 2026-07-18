export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createCheckout, PLANS } from '../../../../lib/maya';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getUserFromRequest, getProfile } from '../../../../lib/auth';

// Start a Maya Checkout for the logged-in business (monthly or annual).
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 403 });

  const { plan } = await req.json();
  const cfg = PLANS[plan];
  if (!cfg) return NextResponse.json({ error: 'invalid plan' }, { status: 400 });

  // <=36 chars, unique — used to reconcile the webhook back to this payment.
  const reference = `qpr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const origin = req.headers.get('origin') || new URL(req.url).origin;

  const { data: pay } = await supabaseAdmin
    .from('maya_payments')
    .insert({ business_id: profile.business_id, plan, reference, amount: cfg.amount, status: 'pending' })
    .select().single();

  let checkout;
  try {
    checkout = await createCheckout({
      amount: cfg.amount,
      reference,
      description: cfg.label,
      successUrl: `${origin}/dashboard?sub=success`,
      failureUrl: `${origin}/dashboard/billing?sub=failed`,
      cancelUrl: `${origin}/dashboard/billing?sub=cancel`,
    });
  } catch (e) {
    await supabaseAdmin.from('maya_payments').update({ status: 'failed' }).eq('id', pay.id);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  await supabaseAdmin.from('maya_payments').update({ checkout_id: checkout.checkoutId }).eq('id', pay.id);
  return NextResponse.json({ url: checkout.redirectUrl });
}
