-- WhatsApp support agent — tables, RLS, and admin RPCs.
-- Run once in the Supabase SQL editor. Idempotent.
--
-- Both tables are service-role only: the Edge Function writes them with the
-- service key, and the admin panel reads them through the SECURITY DEFINER
-- RPCs at the bottom. No client-side grants at all — inbound message bodies
-- are attacker-controlled text from strangers on the internet.

-- ---------------------------------------------------------------------------
-- Message log — also the idempotency ledger.
-- ---------------------------------------------------------------------------
-- wa_message_id is Meta's `wamid.*` and is the PRIMARY KEY, not a surrogate:
-- Meta redelivers a webhook until it gets a 200, so without a uniqueness
-- constraint on their id a slow reply would answer the same customer 3-4
-- times and bill an LLM call each round.
create table if not exists public.whatsapp_messages (
  wa_message_id   text primary key,
  wa_phone        text not null,
  contact_name    text,
  direction       text not null check (direction in ('inbound', 'outbound')),
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists whatsapp_messages_phone_time_idx
  on public.whatsapp_messages (wa_phone, created_at desc);

alter table public.whatsapp_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Escalations — the "needs a human" queue.
-- ---------------------------------------------------------------------------
create table if not exists public.whatsapp_escalations (
  id              uuid primary key default gen_random_uuid(),
  wa_phone        text not null,
  contact_name    text,
  question        text not null,
  reason          text,
  status          text not null default 'open' check (status in ('open', 'resolved')),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

-- Partial index: the admin inbox almost always filters to status='open'.
create index if not exists whatsapp_escalations_open_idx
  on public.whatsapp_escalations (created_at desc) where status = 'open';

alter table public.whatsapp_escalations enable row level security;

-- ---------------------------------------------------------------------------
-- Admin RPCs
-- ---------------------------------------------------------------------------
-- Each one re-checks is_admin internally AND is locked down with the three
-- statements documented in CLAUDE.md — the internal guard alone is not enough,
-- because this project's ALTER DEFAULT PRIVILEGES grants EXECUTE to `anon`
-- directly, on top of Postgres's own default grant to PUBLIC.

create or replace function public.admin_list_whatsapp_escalations(
  status_filter text default 'open'
)
returns table (
  id           uuid,
  wa_phone     text,
  contact_name text,
  question     text,
  reason       text,
  status       text,
  created_at   timestamptz,
  resolved_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid() and e.is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;

  return query
    select e.id, e.wa_phone, e.contact_name, e.question,
           e.reason, e.status, e.created_at, e.resolved_at
    from public.whatsapp_escalations e
    where status_filter is null or e.status = status_filter
    order by e.created_at desc
    limit 200;
end;
$$;

revoke execute on function public.admin_list_whatsapp_escalations(text) from public;
revoke execute on function public.admin_list_whatsapp_escalations(text) from anon;
grant  execute on function public.admin_list_whatsapp_escalations(text) to authenticated;

create or replace function public.admin_resolve_whatsapp_escalation(
  escalation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid() and e.is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;

  update public.whatsapp_escalations
  set status = 'resolved', resolved_at = now()
  where id = escalation_id;
end;
$$;

revoke execute on function public.admin_resolve_whatsapp_escalation(uuid) from public;
revoke execute on function public.admin_resolve_whatsapp_escalation(uuid) from anon;
grant  execute on function public.admin_resolve_whatsapp_escalation(uuid) to authenticated;

-- Full transcript for one phone number, so the owner can read the lead-up
-- before replying personally.
create or replace function public.admin_get_whatsapp_thread(
  phone text
)
returns table (
  direction  text,
  body       text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid() and e.is_admin = true
  ) then
    raise exception 'Not authorized';
  end if;

  return query
    select m.direction, m.body, m.created_at
    from public.whatsapp_messages m
    where m.wa_phone = phone
    order by m.created_at asc
    limit 100;
end;
$$;

revoke execute on function public.admin_get_whatsapp_thread(text) from public;
revoke execute on function public.admin_get_whatsapp_thread(text) from anon;
grant  execute on function public.admin_get_whatsapp_thread(text) to authenticated;

-- Verify the lockdown took. Each row should show only postgres/authenticated/
-- service_role — no empty grantee (that's PUBLIC) and no `anon`.
--
--   select p.proname, a.grantee::regrole::text, a.privilege_type
--   from pg_proc p, aclexplode(p.proacl) a
--   where p.proname like 'admin_%whatsapp%';
