'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <main className="center">
        <div className="card">
          <h1 className="brand">QUEPER</h1>
          <p className="big">Check your email</p>
          <p className="muted">If an account exists for {email}, we&apos;ve sent a link to reset your password.</p>
          <Link className="btn ghost" href="/login" style={{ marginTop: 20 }}>Back to login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="center">
      <form className="card" onSubmit={submit}>
        <h1 className="brand">QUEPER</h1>
        <p className="tagline">Reset your password.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {err && <p className="error">{err}</p>}
        <button disabled={busy}>{busy ? '…' : 'SEND RESET LINK'}</button>
        <p className="muted" style={{ marginTop: 16 }}>
          Remembered it? <Link href="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
