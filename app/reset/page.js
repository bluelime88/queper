'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

// The recovery link from the email lands here. supabase-js auto-detects the
// token in the URL and establishes a temporary session, so updateUser() can
// set the new password. If the link is bad/expired, updateUser fails and we
// point the user back to /forgot.
export default function Reset() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr('This reset link is invalid or expired. Please request a new one.'); return; }
    setDone(true);
    setTimeout(() => router.replace('/dashboard'), 1500);
  }

  if (done) {
    return (
      <main className="center">
        <div className="card">
          <h1 className="brand">QUEPER</h1>
          <p className="big">Password updated</p>
          <p className="muted">Taking you to your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="center">
      <form className="card" onSubmit={submit}>
        <h1 className="brand">QUEPER</h1>
        <p className="tagline">Choose a new password.</p>
        <label>New password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} />
        <label>Confirm new password</label>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
        {err && <p className="error">{err}</p>}
        <button disabled={busy}>{busy ? '…' : 'UPDATE PASSWORD'}</button>
        {err && (
          <p className="muted" style={{ marginTop: 16 }}>
            <Link href="/forgot">Request a new link</Link>
          </p>
        )}
      </form>
    </main>
  );
}
