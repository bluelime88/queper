export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { stripe, planForPrice } from '../../../../lib/stripe';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Stripe webhook — keeps each business's subscription_status/plan in sync.
// Uses the raw request body for signature verification.
export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `signature: ${err.message}` }, { status: 400 });
  }

  async function syncFromSubscription(sub, businessId) {
    const priceId = sub.items?.data?.[0]?.price?.id;
    const active = sub.status === 'active' || sub.status === 'trialing';
    const update = {
      subscription_status: sub.status,
      stripe_subscription_id: sub.id,
      plan: active ? planForPrice(priceId) : 'free',
    };
    const query = businessId
      ? supabaseAdmin.from('businesses').update(update).eq('id', businessId)
      : supabaseAdmin.from('businesses').update(update).eq('stripe_customer_id', sub.customer);
    await query;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const sub = await stripe.subscriptions.retrieve(s.subscription);
        await syncFromSubscription(sub, s.client_reference_id);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncFromSubscription(event.data.object, null);
        break;
      case 'customer.subscription.deleted':
        await supabaseAdmin.from('businesses')
          .update({ subscription_status: 'canceled', plan: 'free' })
          .eq('stripe_customer_id', event.data.object.customer);
        break;
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
