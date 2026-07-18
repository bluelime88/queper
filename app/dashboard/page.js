'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

const ACTIVE = ['created', 'waiting', 'ready'];
const TYPES = [
  { value: 'restaurant', label: 'Restaurant', queue: 'Order Number' },
  { value: 'clinic', label: 'Clinic', queue: 'Queue Number' },
  { value: 'pharmacy', label: 'Pharmacy', queue: 'Claim Number' },
  { value: 'service_center', label: 'Service Center', queue: 'Ticket Number' },
  { value: 'generic', label: 'Other', queue: 'Queue Number' },
];

export default function Dashboard() {
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [rows, setRows] = useState([]);
  const [newNum, setNewNum] = useState('');
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('restaurant');
  const [obErr, setObErr] = useState('');
  const [obBusy, setObBusy] = useState(false);
  const channelRef = useRef(null);

  const load = useCallback(async (businessId) => {
    const { data } = await supabase
      .from('queue_sessions')
      .select('*')
      .eq('business_id', businessId)
      .in('status', ACTIVE)
      .order('created_at', { ascending: true });
    setRows(data || []);
  }, []);

  const init = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/login'); return; }
    const { data: profile } = await supabase
      .from('profiles').select('business_id').eq('user_id', session.user.id).maybeSingle();
    if (!profile) { setNeedsOnboarding(true); setReady(true); return; }
    const { data: biz } = await supabase
      .from('businesses').select('*').eq('id', profile.business_id).single();
    setBusiness(biz);
    setNeedsOnboarding(false);
    setReady(true);
    load(biz.id);
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase
      .channel('queue-' + biz.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'queue_sessions', filter: `business_id=eq.${biz.id}` },
        () => load(biz.id))
      .subscribe();
  }, [router, load]);

  useEffect(() => {
    init();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [init]);

  // Logged-in user without a business finishes setup here (not /signup).
  async function submitOnboarding(e) {
    e.preventDefault();
    setObErr('');
    setObBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const queueLabel = TYPES.find((t) => t.value === bizType)?.queue || 'Queue Number';
    const res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ businessName: bizName, businessType: bizType, queueLabel }),
    });
    setObBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setObErr(j.error || 'Could not create business.');
      return;
    }
    setReady(false);
    init();
  }

  async function createQueue(e) {
    e.preventDefault();
    const n = newNum.trim();
    if (!n) return;
    await supabase.from('queue_sessions').insert({ business_id: business.id, queue_number: n, status: 'created' });
    setNewNum('');
    load(business.id);
  }

  async function notify(row) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ queueSessionId: row.id }),
    });
    load(business.id);
  }

  async function complete(row) {
    await supabase.from('queue_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', row.id);
    load(business.id);
  }
  async function cancel(row) {
    await supabase.from('queue_sessions').update({ status: 'cancelled' }).eq('id', row.id);
    load(business.id);
  }
  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!ready) return <main className="center"><p className="muted">Loading…</p></main>;

  if (needsOnboarding) {
    return (
      <main className="center">
        <form className="card" onSubmit={submitOnboarding}>
          <h1 className="brand">QUEPER</h1>
          <p className="tagline">One more step — set up your business.</p>
          <label>Business name</label>
          <input value={bizName} onChange={(e) => setBizName(e.target.value)} required />
          <label>Business type</label>
          <select value={bizType} onChange={(e) => setBizType(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 16 }}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {obErr && <p className="error">{obErr}</p>}
          <button disabled={obBusy}>{obBusy ? '…' : 'CREATE BUSINESS'}</button>
          <button type="button" className="link" onClick={logout} style={{ marginTop: 14 }}>Log out</button>
        </form>
      </main>
    );
  }

  return (
    <main className="wrap">
      <header className="topbar">
        <div>
          <span className="brand sm">QUEPER</span>
          <span className="bizname">{business.name}</span>
        </div>
        <button className="link" onClick={logout}>Logout</button>
      </header>

      <div className="actions">
        <Link className="btn" href="/dashboard/qr">DISPLAY QR CODE</Link>
      </div>

      <form className="createrow" onSubmit={createQueue}>
        <input placeholder={`New ${business.queue_label}`} value={newNum} onChange={(e) => setNewNum(e.target.value)} />
        <button className="btn">CREATE</button>
      </form>

      <h2 className="section">ACTIVE QUEUE</h2>
      {rows.length === 0 && <p className="muted">No active entries yet.</p>}
      <ul className="queue">
        {rows.map((row) => (
          <li key={row.id} className="qrow">
            <span className="qnum">
              #{row.queue_number}
              {row.customer_name && <span className="qname"> · {row.customer_name}</span>}
            </span>
            <span className={'badge ' + row.status}>
              {row.status === 'created' ? 'WAITING FOR CUSTOMER' : row.status.toUpperCase()}
            </span>
            <span className="rowactions">
              {row.status === 'waiting' && <button className="btn sm" onClick={() => notify(row)}>NOTIFY</button>}
              {row.status === 'ready' && <button className="btn sm" onClick={() => complete(row)}>COMPLETE</button>}
              <button className="btn ghost sm" onClick={() => cancel(row)}>CANCEL</button>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
