-- Queper subscriptions (Maya prepaid) + free-tier daily limit.
-- Run in Supabase SQL editor. Safe/additive on an existing project.

alter table businesses
  add column if not exists plan text not null default 'free',   -- free | monthly | annual
  add column if not exists subscription_expires_at timestamptz;  -- unlimited while > now()

-- Maya (PayMaya) checkout payments — reconciles webhooks back to a business.
create table if not exists maya_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  plan text not null,                     -- monthly | annual
  reference text not null unique,         -- requestReferenceNumber sent to Maya
  checkout_id text,
  amount int not null,
  status text not null default 'pending', -- pending | paid | failed
  created_at timestamptz not null default now()
);
create index if not exists maya_payments_reference_idx on maya_payments(reference);
alter table maya_payments enable row level security; -- no policies: server-role only

-- Free plan cap: 10 new queue entries per UTC day. Unlimited while subscribed
-- (subscription_expires_at in the future). Runs on every INSERT (staff-created
-- AND customer self-joins), any role, so it can't be bypassed client-side.
-- ponytail: day boundary is UTC. Add a per-business timezone if that matters.
create or replace function enforce_daily_queue_limit()
returns trigger language plpgsql as $$
declare
  unlimited boolean;
  cnt int;
begin
  select (subscription_expires_at is not null and subscription_expires_at > now())
    into unlimited from businesses where id = new.business_id;
  if coalesce(unlimited, false) then
    return new;
  end if;
  select count(*) into cnt from queue_sessions
    where business_id = new.business_id
      and created_at >= date_trunc('day', now());
  if cnt >= 10 then
    raise exception 'FREE_LIMIT_REACHED';
  end if;
  return new;
end $$;

drop trigger if exists trg_daily_queue_limit on queue_sessions;
create trigger trg_daily_queue_limit
  before insert on queue_sessions
  for each row execute function enforce_daily_queue_limit();
