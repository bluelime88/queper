'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';

const ACTIVE = ['created', 'waiting', 'ready'];

export default function Dashboard() {
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [rows, setRows] = useState([]);
  const [newNum, setNewNum] = useState('');
  const [ready, setReady] = useState(false);

  const load = useCallback(async (businessId) => {
    const { data } = await supabase
      .from('queue_sessions')
      .select('*')
      .eq('business_id', businessId)
      .in('status', ACTIVE)
      .order('created_at', { ascending: true });
    setRows(data || []);
  }, []);

  useEffect(() => {
    let channel;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('business_id').eq('user_id', session.user.id).maybeSingle();
      if (!profile) { router.replace('/signup'); return; }
      const { data: biz } = await supabase
        .from('businesses').select('*').eq('id', profile.business_id).single();
      setBusiness(biz);
      setReady(true);
      load(biz.id);
      // Realtime: dashboard refreshes on any queue change for this business.
      channel = supabase
        .channel('queue-' + biz.id)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'queue_sessions', filter: `business_id=eq.${biz.id}` },
          () => load(biz.id))
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [router, load]);

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
            <span className="qnum">#{row.queue_number}</span>
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
