'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { supabase } from '../../../lib/supabaseBrowser';

export default function QrPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('business_id').eq('user_id', session.user.id).maybeSingle();
      if (!profile) { router.replace('/signup'); return; }
      const { data: biz } = await supabase
        .from('businesses').select('join_token').eq('id', profile.business_id).single();
      const joinUrl = `${window.location.origin}/join/${biz.join_token}`;
      setUrl(joinUrl);
      if (canvasRef.current) QRCode.toCanvas(canvasRef.current, joinUrl, { width: 260, margin: 2 });
    })();
  }, [router]);

  return (
    <main className="center">
      <div className="card qr">
        <h1 className="brand">QUEPER</h1>
        <canvas ref={canvasRef} />
        <p className="big">Scan to join the queue</p>
        <p className="muted">No app required</p>
        {url && <p className="tiny muted">{url}</p>}
        <div className="row">
          <button className="btn" onClick={() => window.print()}>PRINT</button>
          <Link className="btn ghost" href="/dashboard">Back</Link>
        </div>
      </div>
    </main>
  );
}
