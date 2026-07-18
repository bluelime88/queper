export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getUserFromRequest } from '../../../lib/auth';

// Create a business + link the signed-up staff user to it (one per user).
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { businessName, businessType, queueLabel } = await req.json();
  if (!businessName) return NextResponse.json({ error: 'businessName required' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('profiles').select('business_id').eq('user_id', user.id).maybeSingle();
  if (existing) return NextResponse.json({ businessId: existing.business_id });

  const { data: biz, error: e1 } = await supabaseAdmin
    .from('businesses')
    .insert({ name: businessName, business_type: businessType || 'generic', queue_label: queueLabel || 'Queue Number' })
    .select().single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { error: e2 } = await supabaseAdmin
    .from('profiles').insert({ user_id: user.id, business_id: biz.id, role: 'owner' });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({ businessId: biz.id });
}
