'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
    else router.push('/dashboard');
  }

  return (
    <main className="center">
      <form className="card" onSubmit={submit}>
        <h1 className="brand">QUEPER</h1>
        <p className="tagline">Know when it's your turn.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="error">{err}</p>}
        <button disabled={busy}>{busy ? '…' : 'LOGIN'}</button>
        <p className="muted" style={{ marginTop: 16 }}>
          <Link href="/forgot">Forgot password?</Link>
        </p>
        <p className="muted" style={{ marginTop: 4 }}>
          No account? <Link href="/signup">Create one</Link>
        </p>
      </form>
    </main>
  );
}
