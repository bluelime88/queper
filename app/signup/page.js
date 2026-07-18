'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

const TYPES = [
  { value: 'restaurant', label: 'Restaurant', queue: 'Order Number' },
  { value: 'clinic', label: 'Clinic', queue: 'Queue Number' },
  { value: 'pharmacy', label: 'Pharmacy', queue: 'Claim Number' },
  { value: 'service_center', label: 'Service Center', queue: 'Ticket Number' },
  { value: 'generic', label: 'Other', queue: 'Queue Number' },
];

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const queueLabel = TYPES.find((t) => t.value === businessType)?.queue || 'Queue Number';

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setBusy(false); setErr(error.message); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      setErr('Account created — confirm your email to continue. (For instant signup, turn off "Confirm email" in Supabase → Authentication → Providers → Email.)');
      return;
    }

    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ businessName, businessType, queueLabel }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Could not create business.');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="center">
      <form className="card" onSubmit={submit}>
        <h1 className="brand">QUEPER</h1>
        <p className="tagline">Create your business account.</p>
        <label>Business name</label>
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        <label>Business type</label>
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 16 }}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {err && <p className="error">{err}</p>}
        <button disabled={busy}>{busy ? '…' : 'CREATE ACCOUNT'}</button>
        <p className="muted" style={{ marginTop: 16 }}>
          Already have one? <Link href="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
