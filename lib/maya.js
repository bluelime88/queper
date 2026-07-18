// Maya Business (PayMaya) Checkout helper.
// Docs: https://developers.maya.ph/reference/checkout
const BASE = process.env.MAYA_ENV === 'production'
  ? 'https://pg.paymaya.com'
  : 'https://pg-sandbox.paymaya.com';

// Maya uses Basic auth: base64("<key>:"). Public key creates checkouts;
// secret key reads/verifies them.
function authHeader(key) {
  return 'Basic ' + Buffer.from(`${key}:`).toString('base64');
}

export const PLANS = {
  monthly: { amount: 250, days: 30, label: 'Queper Monthly (unlimited)' },
  annual: { amount: 2500, days: 365, label: 'Queper Annual (unlimited)' },
};

export async function createCheckout({ amount, reference, description, successUrl, failureUrl, cancelUrl }) {
  const res = await fetch(`${BASE}/checkout/v1/checkouts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: authHeader(process.env.MAYA_PUBLIC_KEY) },
    body: JSON.stringify({
      totalAmount: { value: amount, currency: 'PHP' },
      requestReferenceNumber: reference,
      redirectUrl: { success: successUrl, failure: failureUrl, cancel: cancelUrl },
      items: [{ name: description, quantity: 1, totalAmount: { value: amount } }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Maya checkout failed (${res.status})`);
  return data; // { checkoutId, redirectUrl }
}

// Server-side verification (Maya webhooks are unsigned).
export async function getCheckoutStatus(checkoutId) {
  const res = await fetch(`${BASE}/checkout/v1/checkouts/${checkoutId}`, {
    headers: { authorization: authHeader(process.env.MAYA_SECRET_KEY) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Maya get-checkout failed (${res.status})`);
  return data.paymentStatus; // e.g. PAYMENT_SUCCESS
}
