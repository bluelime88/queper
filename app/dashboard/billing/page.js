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

  async function subscribe(plan) {
    setErr(''); setBusy(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/maya/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan }),
      });
      const j = await res.json();
      if (!res.ok || !j.url) throw new Error(j.error || 'Could not start checkout.');
      window.location.href = j.url; // Maya hosted checkout
    } catch (e) {
      setErr(e.message);
      setBusy('');
    }
  }

  if (!ready) return <main className="center"><p className="muted">Loading…</p></main>;

  const expires = business.subscription_expires_at ? new Date(business.subscription_expires_at) : null;
  const unlimited = expires && expires > new Date();
  const fmt = (d) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <main className="center">
      <div className="card" style={{ maxWidth: 440 }}>
        <h1 className="brand">QUEPER</h1>
        <p className="tagline">Billing & plan</p>

        <div className="planbar" style={{ justifyContent: 'center', marginBottom: 18 }}>
          {unlimited
            ? <span><b>{business.plan === 'annual' ? 'Annual' : 'Monthly'} plan</b> · Unlimited until {fmt(expires)}</span>
            : <span><b>Free plan</b> · 10 orders/day</span>}
        </div>

        {err && <p className="error">{err}</p>}

        <button onClick={() => subscribe('monthly')} disabled={!!busy}>
          {busy === 'monthly' ? '…' : `${unlimited ? 'EXTEND' : 'SUBSCRIBE'} MONTHLY — ₱250 / 30 days`}
        </button>
        <button className="btn ghost" onClick={() => subscribe('annual')} disabled={!!busy} style={{ marginTop: 10 }}>
          {busy === 'annual' ? '…' : `${unlimited ? 'EXTEND' : 'SUBSCRIBE'} ANNUAL — ₱2,500 / 365 days`}
        </button>
        <p className="muted" style={{ marginTop: 14 }}>
          Both paid plans remove the 10 orders/day limit. Paid via Maya. Access is prepaid — it lapses to the free plan when it expires unless you renew.
        </p>

        <p className="muted" style={{ marginTop: 18 }}>
          <Link href="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </main>
  );
}
