'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseBrowser';

export default function Billing() {
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('business_id').eq('user_id', session.user.id).maybeSingle();
      if (!profile) { router.replace('/dashboard'); return; }
      const { data: biz } = await supabase
        .from('businesses').select('*').eq('id', profile.business_id).single();
      setBusiness(biz);
      setReady(true);
    })();
  }, [router]);

  async function post(path, body) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body || {}),
    });
    const j = await res.json();
    if (!res.ok || !j.url) throw new Error(j.error || 'Something went wrong.');
    window.location.href = j.url;
  }

  async function subscribe(plan) {
    setErr(''); setBusy(plan);
    try { await post('/api/stripe/checkout', { plan }); }
    catch (e) { setErr(e.message); setBusy(''); }
  }
  async function manage() {
    setErr(''); setBusy('portal');
    try { await post('/api/stripe/portal'); }
    catch (e) { setErr(e.message); setBusy(''); }
  }

  if (!ready) return <main className="center"><p className="muted">Loading…</p></main>;

  const unlimited = ['active', 'trialing'].includes(business.subscription_status);

  return (
    <main className="center">
      <div className="card" style={{ maxWidth: 440 }}>
        <h1 className="brand">QUEPER</h1>
        <p className="tagline">Billing & plan</p>

        <div className="planbar" style={{ justifyContent: 'center', marginBottom: 18 }}>
          {unlimited
            ? <span><b>{business.plan === 'annual' ? 'Annual' : 'Monthly'} plan</b> · Unlimited orders/day</span>
            : <span><b>Free plan</b> · 10 orders/day</span>}
        </div>

        {err && <p className="error">{err}</p>}

        {!unlimited && (
          <>
            <button onClick={() => subscribe('monthly')} disabled={!!busy}>
              {busy === 'monthly' ? '…' : 'MONTHLY — $5 / month'}
            </button>
            <button className="btn ghost" onClick={() => subscribe('annual')} disabled={!!busy} style={{ marginTop: 10 }}>
              {busy === 'annual' ? '…' : 'ANNUAL — $50 / year (save $10)'}
            </button>
            <p className="muted" style={{ marginTop: 14 }}>Both paid plans remove the 10 orders/day limit.</p>
          </>
        )}

        {business.stripe_customer_id && (
          <button className="btn ghost" onClick={manage} disabled={!!busy} style={{ marginTop: 10 }}>
            {busy === 'portal' ? '…' : 'MANAGE BILLING'}
          </button>
        )}

        <p className="muted" style={{ marginTop: 18 }}>
          <Link href="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  );
}
