-- Queper subscriptions + free-tier daily limit. Run in Supabase SQL editor.
-- Safe to run on an existing project (additive).

alter table businesses
  add column if not exists plan text not null default 'free',                    -- free | monthly | annual
  add column if not exists subscription_status text not null default 'inactive', -- inactive | active | trialing | past_due | canceled
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists businesses_stripe_customer_idx on businesses(stripe_customer_id);

-- Free plan cap: 10 new queue entries per UTC day. Unlimited when subscribed.
-- Runs on every INSERT (staff-created AND customer self-joins), regardless of
-- role, so it can't be bypassed from the client.
-- ponytail: day boundary is UTC. Add a per-business timezone if that matters.
create or replace function enforce_daily_queue_limit()
returns trigger language plpgsql as $$
declare
  unlimited boolean;
  cnt int;
begin
  select (subscription_status in ('active', 'trialing'))
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
