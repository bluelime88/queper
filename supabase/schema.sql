-- Queper schema. Run in Supabase SQL editor.
-- ponytail: single implicit location per business — PRD's Location table is Phase 2 (multi-location), skipped for MVP.

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text not null default 'generic',   -- restaurant, clinic, pharmacy, service_center, generic
  queue_label text not null default 'Queue Number',
  join_token uuid not null default gen_random_uuid(),
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create unique index if not exists businesses_join_token_idx on businesses(join_token);

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

create table if not exists queue_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  queue_number text not null,
  customer_name text, -- optional name/nickname the customer types when joining
  status text not null default 'created', -- created, waiting, ready, completed, cancelled, expired
  created_at timestamptz not null default now(),
  joined_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz
);
create index if not exists queue_sessions_biz_status_idx on queue_sessions(business_id, status);
create index if not exists queue_sessions_biz_number_idx on queue_sessions(business_id, queue_number);

create table if not exists customer_sessions (
  id uuid primary key default gen_random_uuid(),
  queue_session_id uuid not null references queue_sessions(id) on delete cascade,
  push_subscription jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Row Level Security -------------------------------------------------------
alter table businesses enable row level security;
alter table profiles enable row level security;
alter table queue_sessions enable row level security;
alter table customer_sessions enable row level security;

-- profiles: a user reads only their own row
create policy "own profile" on profiles for select using (auth.uid() = user_id);

-- businesses: staff read/update only their own business
create policy "read own business" on businesses for select
  using (id in (select business_id from profiles where user_id = auth.uid()));
create policy "update own business" on businesses for update
  using (id in (select business_id from profiles where user_id = auth.uid()));

-- queue_sessions: staff have full access to their business's rows (also gates realtime)
create policy "staff select queue" on queue_sessions for select
  using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "staff insert queue" on queue_sessions for insert
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "staff update queue" on queue_sessions for update
  using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "staff delete queue" on queue_sessions for delete
  using (business_id in (select business_id from profiles where user_id = auth.uid()));

-- customer_sessions: no policies on purpose. Anonymous customer flows go through
-- server API routes using the service role key, which bypasses RLS. Nothing
-- reachable with the anon/public key can read a customer's push subscription.

-- Realtime: let the staff dashboard receive live queue changes
alter publication supabase_realtime add table queue_sessions;
