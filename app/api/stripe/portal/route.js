export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getUserFromRequest, getProfile } from '../../../../lib/auth';

// Stripe Customer Portal — manage/cancel the subscription.
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 403 });

  const { data: biz } = await supabaseAdmin
    .from('businesses').select('stripe_customer_id').eq('id', profile.business_id).single();
  if (!biz.stripe_customer_id) return NextResponse.json({ error: 'no customer' }, { status: 400 });

  const origin = req.headers.get('origin') || new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: biz.stripe_customer_id,
    return_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
