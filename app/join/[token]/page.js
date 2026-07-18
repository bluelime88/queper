'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function urlBase64ToUint8Array(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function Join() {
  const { token } = useParams();
  const [num, setNum] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('enter'); // enter | waiting | ready | done | expired
  const [info, setInfo] = useState(null); // { customerSessionId, number }
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function join(e) {
    e.preventDefault();
    setErr('');
    const n = num.trim();
    if (!n) { setErr("We couldn't find that number. Please check your order or queue number."); return; }
    setBusy(true);
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, queueNumber: n, name: name.trim() }),
    });
    setBusy(false);
    if (res.status === 404) { setErr("We couldn't find that business. Please rescan the QR code."); return; }
    if (res.status === 409) { setErr('This number is already connected to a customer. Please ask staff to reset it.'); return; }
    if (res.status === 403) { setErr('This business has reached its limit for today. Please try again tomorrow or ask staff.'); return; }
    if (!res.ok) { setErr('Something went wrong. Please try again.'); return; }
    const j = await res.json();
    setInfo(j);
    setState(j.status === 'ready' ? 'ready' : 'waiting');
    setupPush(j.customerSessionId);
  }

  async function setupPush(customerSessionId) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setNotice('Notifications are not supported here — keep this page open to see your status.');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setNotice('Notifications are off. Keep this page open to see your status, or enable notifications in your browser.');
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ customerSessionId, subscription: sub }),
      });
      setNotice('');
    } catch {
      setNotice('Keep this page open to see your status.');
    }
  }

  // Poll status as the fallback / open-page updater.
  useEffect(() => {
    if (!info || state === 'enter') return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/status?cs=${info.customerSessionId}`);
      if (!res.ok) return;
      const j = await res.json();
      if (j.status === 'ready') setState('ready');
      else if (j.status === 'completed') setState('done');
      else if (j.status === 'expired' || j.status === 'cancelled') setState('expired');
    }, 4000);
    return () => clearInterval(id);
  }, [info, state]);

  if (state === 'enter') {
    return (
      <main className="center">
        <form className="card" onSubmit={join}>
          <h1 className="brand">QUEPER</h1>
          <p className="big">Enter your order or queue number</p>
          <input className="bignum" value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" placeholder="102" />
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Name or nickname (optional)" style={{ marginTop: 10 }} />
          {err && <p className="error">{err}</p>}
          <button disabled={busy}>{busy ? '…' : 'JOIN QUEUE'}</button>
          <p className="muted" style={{ marginTop: 16 }}>No account required.<br />No personal information required.</p>
        </form>
      </main>
    );
  }

  if (state === 'ready') {
    return (
      <main className="center">
        <div className="card status ready">
          <h1 className="brand">QUEPER</h1>
          <p className="huge">YOUR TURN IS READY</p>
          <p className="big">#{info.number}</p>
          <p>Please proceed to the designated counter.</p>
        </div>
      </main>
    );
  }

  if (state === 'done') {
    return (
      <main className="center">
        <div className="card status">
          <h1 className="brand">QUEPER</h1>
          <p className="big">All done</p>
          <p className="muted">Thanks for using Queper.</p>
        </div>
      </main>
    );
  }

  if (state === 'expired') {
    return (
      <main className="center">
        <div className="card status">
          <h1 className="brand">QUEPER</h1>
          <p className="big">Session ended</p>
          <p className="muted">Please rescan the QR code to rejoin.</p>
        </div>
      </main>
    );
  }

  // waiting
  return (
    <main className="center">
      <div className="card status">
        <h1 className="brand">QUEPER</h1>
        <p className="big">#{info.number}</p>
        <p className="huge">YOU'RE ALL SET</p>
        <p>We'll notify you when it's your turn.</p>
        <p className="muted">You can now put your phone away.</p>
        {notice && <p className="hint">{notice}</p>}
      </div>
    </main>
  );
}
