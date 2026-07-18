export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getUserFromRequest, getProfile } from '../../../../lib/auth';

// Start a Stripe Checkout for the logged-in business (monthly or annual).
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 403 });

  const { plan } = await req.json();
  const price = PRICE_IDS[plan];
  if (!price) return NextResponse.json({ error: 'invalid plan' }, { status: 400 });

  const { data: biz } = await supabaseAdmin
    .from('businesses').select('*').eq('id', profile.business_id).single();

  let customerId = biz.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { business_id: biz.id } });
    customerId = customer.id;
    await supabaseAdmin.from('businesses').update({ stripe_customer_id: customerId }).eq('id', biz.id);
  }

  const origin = req.headers.get('origin') || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: biz.id,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/dashboard?sub=success`,
    cancel_url: `${origin}/dashboard/billing?sub=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
