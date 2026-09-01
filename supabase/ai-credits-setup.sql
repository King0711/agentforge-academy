-- ============================================================
-- Social Dev Technologies — AI Builder Credits
-- Run in Supabase: Project → SQL Editor → New query
--
-- Additive only. Does not touch profiles, entitlements, payments,
-- or course_content. Safe to run on production.
--
-- Money model: students never hold or transfer value. Credits are an
-- internal rationing unit for OUR prepaid Anthropic balance.
--   1 credit == $0.002 of provider spend (see ai_platform_settings).
-- With a fixed 2,000-credit allotment and no top-up, maximum possible
-- provider cost per student is exactly $4.00, enforced below.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Platform settings — single row, admin-controlled.
--    This is the kill switch. gateway_enabled ships FALSE: the
--    gateway refuses every request until an admin turns it on,
--    so the system can be deployed long before class starts and
--    before any Anthropic account is funded.
-- ------------------------------------------------------------
create table if not exists public.ai_platform_settings (
  id boolean primary key default true constraint ai_platform_settings_singleton check (id),
  gateway_enabled boolean not null default false,
  -- USD of provider spend represented by one credit.
  usd_per_credit numeric not null default 0.002 check (usd_per_credit > 0),
  -- Credits granted when a paid entitlement activates. A setting, not a
  -- constant, so the allotment changes without a code deploy.
  --
  -- 1,500 across all three tiers is a live test value (down from
  -- 2,000/2,000/4,000), tied to evaluating a price cut from N50,000 to
  -- N25,000. Admin-only visibility while this is being tested — see the
  -- SELECT policy below — and per-tier differentiation (Builder 2's real
  -- avg max_tokens runs ~49% higher than Builder 1's, per the cost model)
  -- is a deliberately deferred follow-up, not decided yet.
  grant_builder1 integer not null default 1500 check (grant_builder1 >= 0),
  grant_builder2 integer not null default 1500 check (grant_builder2 >= 0),
  grant_pro      integer not null default 1500 check (grant_pro >= 0),
  -- Per-student ceiling on credits burned in a rolling 24h. Stops one
  -- student draining a whole allotment (and a whole day's budget) in a
  -- single runaway loop, without lowering their total.
  daily_credit_cap_per_user integer not null default 400 check (daily_credit_cap_per_user > 0),
  -- Circuit breaker across ALL students. If total spend in a rolling 24h
  -- crosses this, the gateway stops serving everyone. Last line of defence
  -- before the Anthropic Console spend limit.
  daily_credit_cap_platform integer not null default 5000 check (daily_credit_cap_platform > 0),
  updated_at timestamptz not null default now()
);

insert into public.ai_platform_settings (id) values (true) on conflict (id) do nothing;

alter table public.ai_platform_settings enable row level security;

-- Admin-only read. Originally readable by any signed-in user (reasoning:
-- a future student dashboard could show gateway status), but no such
-- page exists yet, and while pricing/credit amounts are actively being
-- tested pre-launch, least-privilege wins — loosen deliberately later if
-- a real student-facing surface needs it, not by leaving this open by
-- default. No client write policy at all — admin RPC only.
create policy "Only admins can read AI platform settings"
  on public.ai_platform_settings for select
  using (exists (
    select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true
  ));

drop trigger if exists set_ai_platform_settings_updated_at on public.ai_platform_settings;
create trigger set_ai_platform_settings_updated_at
  before update on public.ai_platform_settings
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- 2. Model catalogue — provider rates live here, NOT in code, so
--    credit cost is derived from real pricing and repricing is a
--    row update. min_tier gates which entitlement may use a model.
-- ------------------------------------------------------------
create table if not exists public.ai_models (
  model_key text primary key,
  provider text not null default 'anthropic',
  display_name text not null,
  input_usd_per_mtok numeric not null check (input_usd_per_mtok >= 0),
  output_usd_per_mtok numeric not null check (output_usd_per_mtok >= 0),
  -- Server-side ceiling. A client-supplied max_tokens above this is
  -- clamped by the gateway — students cannot widen their own blast radius.
  max_tokens integer not null default 1024 check (max_tokens > 0),
  rate_limit_per_hour integer not null default 120 check (rate_limit_per_hour > 0),
  min_tier text check (min_tier in ('builder1', 'builder2')),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.ai_models enable row level security;

-- Admin-only read, same reasoning and same timing as ai_platform_settings
-- above: built for a future model-picker UI that doesn't exist yet, and
-- nothing currently depends on broader access. No client write policy —
-- admin RPC only.
create policy "Only admins can read AI models"
  on public.ai_models for select
  using (exists (
    select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true
  ));

drop trigger if exists set_ai_models_updated_at on public.ai_models;
create trigger set_ai_models_updated_at
  before update on public.ai_models
  for each row execute procedure public.set_updated_at();

-- Seed with current published pricing (verified 2026-08-31).
--
-- Haiku is the only ACTIVE model for the first cohort. The Builder 1
-- projects are classify / summarise / extract / rewrite tasks, well within
-- its competence, and a full pass costs ~1,560 credits on Haiku — already
-- tight against the 1,500-credit test allotment above (see that field's
-- comment), let alone Sonnet's roughly double per-request cost. Sonnet
-- ships INACTIVE and can be switched on from the admin panel once real
-- consumption data exists and the allotment question is settled.
--
-- Opus is deliberately absent entirely: at ~$0.021/request it would consume
-- a large majority of course revenue even at the original N50,000 price,
-- which is not viable for included credits at any allotment considered.
insert into public.ai_models
  (model_key, display_name, input_usd_per_mtok, output_usd_per_mtok, max_tokens, rate_limit_per_hour, min_tier, is_active)
values
  ('claude-haiku-4-5', 'Claude Haiku 4.5', 1.00,  5.00, 1500, 120, null, true),
  ('claude-sonnet-5',  'Claude Sonnet 5',  2.00, 10.00, 1500,  60, null, false)
on conflict (model_key) do nothing;

-- ------------------------------------------------------------
-- 3. Wallets — one row per student. Balance can never go below zero
--    (enforced by constraint, not just by application logic).
-- ------------------------------------------------------------
create table if not exists public.ai_credit_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_granted integer not null default 0 check (lifetime_granted >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  updated_at timestamptz not null default now()
);

alter table public.ai_credit_wallets enable row level security;

create policy "Users can view their own wallet"
  on public.ai_credit_wallets for select
  using (auth.uid() = user_id);
-- No client insert/update/delete. Writes only via the SECURITY DEFINER
-- functions below, which hold a row lock while they work.

drop trigger if exists set_ai_credit_wallets_updated_at on public.ai_credit_wallets;
create trigger set_ai_credit_wallets_updated_at
  before update on public.ai_credit_wallets
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- 4. Transaction ledger — every balance change, with before/after,
--    so any dispute is answerable from data.
-- ------------------------------------------------------------
create table if not exists public.ai_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_type text not null check (transaction_type in (
    'initial_allocation', 'purchase', 'usage', 'usage_refund',
    'bonus', 'admin_adjustment', 'refund'
  )),
  credit_amount integer not null,          -- signed: negative = spend
  balance_before integer not null,
  balance_after integer not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists ai_credit_transactions_user_created_idx
  on public.ai_credit_transactions (user_id, created_at desc);

alter table public.ai_credit_transactions enable row level security;

create policy "Users can view their own credit transactions"
  on public.ai_credit_transactions for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. Usage log — one row per gateway request. Written at reserve
--    time (status 'reserved'), updated at settle time. Also backs
--    rate limiting and the daily caps, hence the indexes.
-- ------------------------------------------------------------
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'anthropic',
  model_key text not null,
  project_slug text,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  credits_reserved integer not null default 0 check (credits_reserved >= 0),
  credit_cost integer not null default 0 check (credit_cost >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'success', 'error', 'abandoned')),
  error_message text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists ai_usage_logs_user_created_idx
  on public.ai_usage_logs (user_id, created_at desc);
create index if not exists ai_usage_logs_created_idx
  on public.ai_usage_logs (created_at desc);

alter table public.ai_usage_logs enable row level security;

create policy "Users can view their own AI usage"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6. Credit granting. Called by paystack-webhook (service role) and
--    by the admin RPC.
--
--    Idempotency is WINDOWED to 24 hours, not permanent. A permanent
--    (user, type, description) check silently broke genuine renewals: a
--    student who buys Builder 1, then buys it again 6 months later with
--    the same description text, would get zero credits on the renewal
--    while their entitlement correctly renews — paid, got nothing, no
--    error. Flagged in code review, fixed here. 24 hours is enough to
--    absorb a retried webhook delivery (arrives within minutes) without
--    blocking a real renewal months out. The caller should still use a
--    description unique per real transaction (paystack-webhook embeds
--    the Paystack transaction reference) as defense in depth — the
--    webhook's own idempotency check on payments.provider_transaction_id
--    already means a retried delivery never reaches this function at all
--    for the same transaction.
-- ------------------------------------------------------------
create or replace function public.ai_grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before integer;
  v_after integer;
begin
  if p_amount <= 0 then
    raise exception 'Grant amount must be positive';
  end if;

  if exists (
    select 1 from ai_credit_transactions t
    where t.user_id = p_user_id
      and t.transaction_type = p_type
      and t.description is not distinct from p_description
      and t.created_at > now() - interval '24 hours'
  ) then
    select balance into v_after from ai_credit_wallets where user_id = p_user_id;
    return coalesce(v_after, 0);
  end if;

  insert into ai_credit_wallets (user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update ai_credit_wallets
  set balance = balance + p_amount,
      lifetime_granted = lifetime_granted + p_amount
  where user_id = p_user_id
  returning balance - p_amount, balance into v_before, v_after;

  insert into ai_credit_transactions
    (user_id, transaction_type, credit_amount, balance_before, balance_after, description)
  values (p_user_id, p_type, p_amount, v_before, v_after, p_description);

  return v_after;
end;
$$;

-- ------------------------------------------------------------
-- 7. THE GUARDRAIL. Reserve credits before the provider is called.
--
--    Every check that protects the budget lives here, inside one
--    transaction holding a row lock on the wallet. Doing this in the
--    Edge Function's JavaScript instead would leave a race: ten
--    concurrent requests could all read "balance = 2" and all proceed.
--    The batch projects (Gmail triage loops over 10 emails) hit that
--    race routinely, not rarely.
--
--    Reserves the WORST CASE cost (full max_tokens of output), so a
--    request can never overshoot the balance. ai_settle_request()
--    refunds the difference once real usage is known.
--
--    ALIAS EVERY TABLE REFERENCE BELOW. The RETURNS TABLE clause puts
--    log_id / credits_reserved / max_tokens in scope as plpgsql variables
--    for the whole body, and ai_usage_logs has a credits_reserved column
--    of its own — an unqualified reference throws "column reference is
--    ambiguous" before the wallet check ever runs. Same failure mode as
--    the is_admin bug documented in admin-setup.sql; caught here by the
--    role-simulation probe, not in review.
--
--    Split into a service-role CORE plus an auth.uid() WRAPPER. The
--    gateway also authenticates scripts by a durable student API key
--    (section 9) rather than a Supabase JWT — there is no auth.uid() in
--    that path, so the identity has to be passed explicitly. That is only
--    safe for service_role: an authenticated caller able to reach the core
--    directly could name any user_id and spend someone else's credits.
-- ------------------------------------------------------------
create or replace function public.ai_reserve_request_core(
  p_user_id uuid,
  p_model_key text,
  p_estimated_input_tokens integer,
  p_project_slug text default null
)
returns table (log_id uuid, credits_reserved integer, max_tokens integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings ai_platform_settings%rowtype;
  v_model ai_models%rowtype;
  v_balance integer;
  v_worst_case_usd numeric;
  v_reserve integer;
  v_recent_requests integer;
  v_user_daily integer;
  v_platform_daily integer;
  v_log_id uuid;
begin
  if p_user_id is null then
    raise exception 'Unauthorized: sign in required';
  end if;

  select * into v_settings from ai_platform_settings s where s.id = true;

  -- Kill switch. Ships off; an admin turns it on the day class starts.
  if not v_settings.gateway_enabled then
    raise exception 'AI gateway is currently disabled';
  end if;

  -- Entitlement gate: same rule as course_content. Admins bypass.
  if not exists (
    select 1 from entitlements e
    where e.user_id = p_user_id
      and (
        e.is_admin = true
        or (e.builder1_expires_at is not null and e.builder1_expires_at > now())
        or (e.builder2_expires_at is not null and e.builder2_expires_at > now())
      )
  ) then
    raise exception 'No active course access';
  end if;

  select * into v_model from ai_models m where m.model_key = p_model_key and m.is_active = true;
  if not found then
    raise exception 'Model not available';
  end if;

  -- Tier gate on restricted models.
  if v_model.min_tier is not null then
    if not exists (
      select 1 from entitlements e
      where e.user_id = p_user_id
        and (
          e.is_admin = true
          or (v_model.min_tier = 'builder1' and e.builder1_expires_at > now())
          or (v_model.min_tier = 'builder2' and e.builder2_expires_at > now())
        )
    ) then
      raise exception 'Model not available on your plan';
    end if;
  end if;

  -- Per-model hourly rate limit. Catches runaway loops early, before
  -- they eat the daily cap.
  select count(*) into v_recent_requests
  from ai_usage_logs l
  where l.user_id = p_user_id
    and l.model_key = p_model_key
    and l.created_at > now() - interval '1 hour';

  if v_recent_requests >= v_model.rate_limit_per_hour then
    raise exception 'Rate limit reached — try again shortly';
  end if;

  -- Worst-case cost: the input we were given, plus a FULL max_tokens of
  -- output. Real responses are almost always shorter; the surplus is
  -- refunded at settle time.
  v_worst_case_usd :=
      (greatest(p_estimated_input_tokens, 0)::numeric * v_model.input_usd_per_mtok / 1000000)
    + (v_model.max_tokens::numeric * v_model.output_usd_per_mtok / 1000000);
  v_reserve := greatest(1, ceil(v_worst_case_usd / v_settings.usd_per_credit)::integer);

  -- Rolling 24h caps — per student, then platform-wide circuit breaker.
  select coalesce(sum(greatest(l.credit_cost, l.credits_reserved)), 0) into v_user_daily
  from ai_usage_logs l
  where l.user_id = p_user_id and l.created_at > now() - interval '24 hours';

  if v_user_daily + v_reserve > v_settings.daily_credit_cap_per_user then
    raise exception 'Daily credit limit reached — resets within 24 hours';
  end if;

  select coalesce(sum(greatest(l.credit_cost, l.credits_reserved)), 0) into v_platform_daily
  from ai_usage_logs l
  where l.created_at > now() - interval '24 hours';

  if v_platform_daily + v_reserve > v_settings.daily_credit_cap_platform then
    raise exception 'Platform daily AI limit reached — please contact support';
  end if;

  -- Lock the wallet row. Concurrent requests queue here rather than all
  -- reading the same stale balance.
  select w.balance into v_balance
  from ai_credit_wallets w
  where w.user_id = p_user_id
  for update;

  if not found then
    raise exception 'No AI credit wallet — credits are granted when your course access starts';
  end if;

  if v_balance < v_reserve then
    raise exception 'Not enough credits (need %, have %)', v_reserve, v_balance;
  end if;

  update ai_credit_wallets w
  set balance = w.balance - v_reserve,
      lifetime_spent = w.lifetime_spent + v_reserve
  where w.user_id = p_user_id;

  insert into ai_credit_transactions
    (user_id, transaction_type, credit_amount, balance_before, balance_after, description)
  values (p_user_id, 'usage', -v_reserve, v_balance, v_balance - v_reserve,
          'Reserved for ' || p_model_key || coalesce(' - ' || p_project_slug, ''));

  insert into ai_usage_logs
    (user_id, model_key, project_slug, input_tokens, credits_reserved, status)
  values (p_user_id, p_model_key, p_project_slug, greatest(p_estimated_input_tokens, 0), v_reserve, 'reserved')
  returning id into v_log_id;

  return query select v_log_id, v_reserve, v_model.max_tokens;
end;
$$;

-- Browser path: auth.uid() resolves from the caller's own Supabase JWT.
create or replace function public.ai_reserve_request(
  p_model_key text,
  p_estimated_input_tokens integer,
  p_project_slug text default null
)
returns table (log_id uuid, credits_reserved integer, max_tokens integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.ai_reserve_request_core(
    auth.uid(), p_model_key, p_estimated_input_tokens, p_project_slug);
end;
$$;

-- ------------------------------------------------------------
-- 8. Settle — called after the provider responds. Computes real cost
--    from real token counts and refunds the unused reservation. On a
--    provider error the whole reservation is refunded: a student is
--    never charged for a failed request. Same core/wrapper split as
--    ai_reserve_request, for the same reason.
-- ------------------------------------------------------------
create or replace function public.ai_settle_request_core(
  p_user_id uuid,
  p_log_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
  p_status text,
  p_error_message text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log ai_usage_logs%rowtype;
  v_model ai_models%rowtype;
  v_settings ai_platform_settings%rowtype;
  v_actual_usd numeric;
  v_actual integer;
  v_refund integer;
  v_balance integer;
begin
  select * into v_log from ai_usage_logs l where l.id = p_log_id for update;
  if not found then
    raise exception 'Unknown usage log';
  end if;

  -- A caller may only settle their own reservation.
  if v_log.user_id <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if v_log.status <> 'reserved' then
    return v_log.credit_cost;  -- already settled; make this idempotent
  end if;

  select * into v_settings from ai_platform_settings s where s.id = true;
  select * into v_model from ai_models m where m.model_key = v_log.model_key;

  if p_status = 'success' then
    v_actual_usd :=
        (greatest(p_input_tokens, 0)::numeric  * v_model.input_usd_per_mtok  / 1000000)
      + (greatest(p_output_tokens, 0)::numeric * v_model.output_usd_per_mtok / 1000000);
    v_actual := greatest(1, ceil(v_actual_usd / v_settings.usd_per_credit)::integer);
    -- Never charge more than was reserved, whatever the provider reports.
    v_actual := least(v_actual, v_log.credits_reserved);
  else
    v_actual := 0;  -- failed request: full refund
  end if;

  v_refund := v_log.credits_reserved - v_actual;

  update ai_usage_logs l
  set input_tokens = greatest(p_input_tokens, 0),
      output_tokens = greatest(p_output_tokens, 0),
      credit_cost = v_actual,
      status = p_status,
      error_message = p_error_message,
      settled_at = now()
  where l.id = p_log_id;

  if v_refund > 0 then
    update ai_credit_wallets w
    set balance = w.balance + v_refund,
        lifetime_spent = greatest(0, w.lifetime_spent - v_refund)
    where w.user_id = p_user_id
    returning w.balance into v_balance;

    insert into ai_credit_transactions
      (user_id, transaction_type, credit_amount, balance_before, balance_after, description)
    values (p_user_id, 'usage_refund', v_refund, v_balance - v_refund, v_balance,
            'Unused reservation returned - ' || v_log.model_key);
  end if;

  return v_actual;
end;
$$;

create or replace function public.ai_settle_request(
  p_log_id uuid,
  p_input_tokens integer,
  p_output_tokens integer,
  p_status text,
  p_error_message text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.ai_settle_request_core(
    auth.uid(), p_log_id, p_input_tokens, p_output_tokens, p_status, p_error_message);
end;
$$;

-- ------------------------------------------------------------
-- 9. Student API keys.
--
--    The Builder 1 projects are Python scripts running on a student's
--    laptop, not browser code. A Supabase session JWT expires in about an
--    hour — fine for a web page, useless for a script. Each student gets a
--    durable sdt_live_ key instead, pasted into .env once, and the gateway
--    resolves it to a user_id via ai_resolve_student_key before calling
--    the _core functions above directly.
--
--    Only the SHA-256 hash is stored. The plaintext key is returned once,
--    at creation, and cannot be recovered afterward — a lost key is
--    replaced, not looked up.
--
--    pgcrypto lives in the `extensions` schema on this project, not
--    `public` — these functions correctly pin search_path = public (an
--    unpinned search_path on a SECURITY DEFINER function is a privilege-
--    escalation vector), so gen_random_bytes and digest must be
--    schema-qualified explicitly or the call fails.
-- ------------------------------------------------------------
create table if not exists public.ai_student_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,        -- 'sdt_live_ab12cd34' — display only
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists ai_student_keys_user_idx on public.ai_student_keys (user_id);

alter table public.ai_student_keys enable row level security;

drop policy if exists "Users can view their own API keys" on public.ai_student_keys;
create policy "Users can view their own API keys"
  on public.ai_student_keys for select
  using (auth.uid() = user_id);

create or replace function public.ai_create_student_key(p_label text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_key text; v_active integer;
begin
  if v_user_id is null then raise exception 'Unauthorized: sign in required'; end if;

  select count(*) into v_active from ai_student_keys k
  where k.user_id = v_user_id and k.revoked_at is null;
  if v_active >= 5 then
    raise exception 'You already have 5 active keys. Revoke one before creating another.';
  end if;

  v_key := 'sdt_live_' || encode(extensions.gen_random_bytes(24), 'hex');

  insert into ai_student_keys (user_id, key_hash, key_prefix, label)
  values (v_user_id, encode(extensions.digest(v_key, 'sha256'), 'hex'), left(v_key, 17), p_label);

  return v_key;
end;
$$;

create or replace function public.ai_revoke_student_key(p_key_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update ai_student_keys k set revoked_at = now()
  where k.id = p_key_id and k.user_id = auth.uid() and k.revoked_at is null;
end;
$$;

-- Service-role only: the gateway calls this to turn a key into a user_id.
-- Never granted to authenticated — it would be a key-validation oracle,
-- letting anyone probe arbitrary strings to find a live key by trial.
create or replace function public.ai_resolve_student_key(p_key text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_user_id uuid;
begin
  update ai_student_keys k set last_used_at = now()
  where k.key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex') and k.revoked_at is null
  returning k.user_id into v_user_id;
  return v_user_id;
end;
$$;

-- ------------------------------------------------------------
-- 10. Curriculum rewrite draft workspace.
--
--    course_content has no versioning — an UPDATE is instant and global,
--    with no staging. Rewriting the Builder 1 guides in place would change
--    the steps under a student mid-project. This lets rewritten content be
--    written and reviewed while ONLY admins can see it; live content is
--    untouched until an admin explicitly publishes.
-- ------------------------------------------------------------

-- Point-in-time backup taken before any rewrite work. Restore path if a
-- publish goes wrong: insert back into course_content from here.
--
-- CREATE TABLE ... AS SELECT does NOT carry RLS over from the source
-- table. This table sat with RLS OFF for a period, meaning the paid
-- Builder 1/2 guide content — and the admin_only tier that is explicitly
-- meant to be unpurchasable — was readable by anyone, unauthenticated, via
-- /rest/v1/course_content_backup_20260831. Caught by Supabase's own
-- ERROR-level security advisor, not by review. Verified after fixing with
-- a role-simulation probe: 0 rows to a non-admin student, 0 to anon, the
-- full 44 rows to admin.
create table if not exists public.course_content_backup_20260831 as
  select * from public.course_content;

alter table public.course_content_backup_20260831 enable row level security;

drop policy if exists "Only admins can read the course content backup" on public.course_content_backup_20260831;
create policy "Only admins can read the course content backup"
  on public.course_content_backup_20260831 for select
  using (exists (
    select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true
  ));
-- No insert/update/delete policy — it is a frozen point-in-time snapshot;
-- writes happen only via the service role, if ever.

create table if not exists public.course_content_draft (
  course_id integer primary key,
  what_you_build text,
  what_you_learn jsonb,
  session jsonb,
  starter_code text,
  test_it_out text,
  troubleshooting jsonb,
  resources jsonb,
  tier text not null check (tier in ('builder1', 'builder2', 'admin_only')),
  change_note text,
  updated_at timestamptz not null default now()
);

alter table public.course_content_draft enable row level security;

-- Admins only. No tier branch at all, unlike course_content — a draft is
-- never visible to a student regardless of what they have paid for.
drop policy if exists "Only admins can read course content drafts" on public.course_content_draft;
create policy "Only admins can read course content drafts"
  on public.course_content_draft for select
  using (exists (
    select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true
  ));

drop trigger if exists set_course_content_draft_updated_at on public.course_content_draft;
create trigger set_course_content_draft_updated_at
  before update on public.course_content_draft
  for each row execute procedure public.set_updated_at();

-- Promote a draft into live content. This is the only moment students see
-- a change, and it is deliberately one explicit action per course.
create or replace function public.admin_publish_course_draft(p_course_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_draft course_content_draft%rowtype;
begin
  if not exists (select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true)
  then raise exception 'Unauthorized: Admin access required'; end if;

  select * into v_draft from course_content_draft d where d.course_id = p_course_id;
  if not found then raise exception 'No draft for course %', p_course_id; end if;

  update course_content c
  set what_you_build = v_draft.what_you_build,
      what_you_learn = v_draft.what_you_learn,
      session        = v_draft.session,
      starter_code   = v_draft.starter_code,
      test_it_out    = v_draft.test_it_out,
      troubleshooting = v_draft.troubleshooting,
      resources      = v_draft.resources,
      tier           = v_draft.tier
  where c.course_id = p_course_id;

  if not found then raise exception 'No live course_content row for course %', p_course_id; end if;

  delete from course_content_draft d where d.course_id = p_course_id;
end;
$$;

create or replace function public.admin_discard_course_draft(p_course_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true)
  then raise exception 'Unauthorized: Admin access required'; end if;

  delete from course_content_draft d where d.course_id = p_course_id;
end;
$$;

create or replace function public.admin_list_course_drafts()
returns table (course_id integer, tier text, change_note text, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true)
  then raise exception 'Unauthorized: Admin access required'; end if;

  return query
    select d.course_id, d.tier, d.change_note, d.updated_at
    from course_content_draft d order by d.course_id;
end;
$$;

-- ------------------------------------------------------------
-- 11. Admin RPCs
-- ------------------------------------------------------------
create or replace function public.admin_set_ai_settings(
  p_gateway_enabled boolean,
  p_grant_builder1 integer,
  p_grant_builder2 integer,
  p_grant_pro integer,
  p_daily_cap_per_user integer,
  p_daily_cap_platform integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update ai_platform_settings
  set gateway_enabled = p_gateway_enabled,
      grant_builder1 = p_grant_builder1,
      grant_builder2 = p_grant_builder2,
      grant_pro = p_grant_pro,
      daily_credit_cap_per_user = p_daily_cap_per_user,
      daily_credit_cap_platform = p_daily_cap_platform
  where id = true;
end;
$$;

create or replace function public.admin_adjust_user_credits(
  target_user_id uuid,
  p_amount integer,
  p_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before integer;
  v_after integer;
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  insert into ai_credit_wallets (user_id, balance)
  values (target_user_id, 0)
  on conflict (user_id) do nothing;

  select balance into v_before from ai_credit_wallets where user_id = target_user_id for update;

  -- Clamp at zero rather than failing the check constraint.
  v_after := greatest(0, v_before + p_amount);

  update ai_credit_wallets
  set balance = v_after,
      lifetime_granted = lifetime_granted + greatest(0, v_after - v_before)
  where user_id = target_user_id;

  insert into ai_credit_transactions
    (user_id, transaction_type, credit_amount, balance_before, balance_after, description)
  values (target_user_id, 'admin_adjustment', v_after - v_before, v_before, v_after,
          coalesce(p_description, 'Manual adjustment'));

  return v_after;
end;
$$;

create or replace function public.admin_set_ai_model(
  p_model_key text,
  p_max_tokens integer,
  p_rate_limit_per_hour integer,
  p_min_tier text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update ai_models
  set max_tokens = p_max_tokens,
      rate_limit_per_hour = p_rate_limit_per_hour,
      min_tier = p_min_tier,
      is_active = p_is_active
  where model_key = p_model_key;
end;
$$;

create or replace function public.admin_get_ai_usage_summary()
returns table (
  user_id uuid,
  email text,
  display_name text,
  balance integer,
  lifetime_granted integer,
  lifetime_spent integer,
  requests_24h bigint,
  credits_24h bigint,
  requests_total bigint,
  last_used_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select
      w.user_id, p.email, p.display_name,
      w.balance, w.lifetime_granted, w.lifetime_spent,
      coalesce(count(l.id) filter (where l.created_at > now() - interval '24 hours'), 0),
      coalesce(sum(l.credit_cost) filter (where l.created_at > now() - interval '24 hours'), 0),
      coalesce(count(l.id), 0),
      max(l.created_at)
    from ai_credit_wallets w
    join profiles p on p.id = w.user_id
    left join ai_usage_logs l on l.user_id = w.user_id
    group by w.user_id, p.email, p.display_name, w.balance, w.lifetime_granted, w.lifetime_spent
    order by coalesce(sum(l.credit_cost) filter (where l.created_at > now() - interval '24 hours'), 0) desc;
end;
$$;

-- ------------------------------------------------------------
-- 12. Grants.
--
--     Three statements per function, not one. Postgres grants EXECUTE to
--     PUBLIC by default on CREATE FUNCTION, AND this project's ALTER
--     DEFAULT PRIVILEGES grants EXECUTE directly to anon — revoking only
--     FROM PUBLIC leaves that second grant in place and the function
--     anonymously callable over /rest/v1/rpc/<name>. See CLAUDE.md.
--
--     Verify after running with aclexplode(proacl); a correctly locked
--     function shows no anon entry and no leading '=X/postgres'.
-- ------------------------------------------------------------

-- Internal only — called by the service role (webhook) or other functions.
revoke execute on function public.ai_grant_credits(uuid, integer, text, text) from public;
revoke execute on function public.ai_grant_credits(uuid, integer, text, text) from anon;
revoke execute on function public.ai_grant_credits(uuid, integer, text, text) from authenticated;

-- Core reserve/settle: service-role only. An authenticated caller able to
-- reach these directly could name any user_id and spend someone else's
-- credits — the wrappers below are the only sanctioned entry points.
revoke execute on function public.ai_reserve_request_core(uuid, text, integer, text) from public;
revoke execute on function public.ai_reserve_request_core(uuid, text, integer, text) from anon;
revoke execute on function public.ai_reserve_request_core(uuid, text, integer, text) from authenticated;

revoke execute on function public.ai_settle_request_core(uuid, uuid, integer, integer, text, text) from public;
revoke execute on function public.ai_settle_request_core(uuid, uuid, integer, integer, text, text) from anon;
revoke execute on function public.ai_settle_request_core(uuid, uuid, integer, integer, text, text) from authenticated;

-- Called by the gateway on the student's behalf (student JWT).
revoke execute on function public.ai_reserve_request(text, integer, text) from public;
revoke execute on function public.ai_reserve_request(text, integer, text) from anon;
grant  execute on function public.ai_reserve_request(text, integer, text) to authenticated;

revoke execute on function public.ai_settle_request(uuid, integer, integer, text, text) from public;
revoke execute on function public.ai_settle_request(uuid, integer, integer, text, text) from anon;
grant  execute on function public.ai_settle_request(uuid, integer, integer, text, text) to authenticated;

-- Student key management — a student manages their own keys directly.
revoke execute on function public.ai_create_student_key(text) from public;
revoke execute on function public.ai_create_student_key(text) from anon;
grant  execute on function public.ai_create_student_key(text) to authenticated;

revoke execute on function public.ai_revoke_student_key(uuid) from public;
revoke execute on function public.ai_revoke_student_key(uuid) from anon;
grant  execute on function public.ai_revoke_student_key(uuid) to authenticated;

-- Key resolution: service-role only. Granting this to authenticated would
-- make it a key-validation oracle — anyone could probe strings to find a
-- live key by trial and error.
revoke execute on function public.ai_resolve_student_key(text) from public;
revoke execute on function public.ai_resolve_student_key(text) from anon;
revoke execute on function public.ai_resolve_student_key(text) from authenticated;

-- Course draft workflow.
revoke execute on function public.admin_publish_course_draft(integer) from public;
revoke execute on function public.admin_publish_course_draft(integer) from anon;
grant  execute on function public.admin_publish_course_draft(integer) to authenticated;

revoke execute on function public.admin_discard_course_draft(integer) from public;
revoke execute on function public.admin_discard_course_draft(integer) from anon;
grant  execute on function public.admin_discard_course_draft(integer) to authenticated;

revoke execute on function public.admin_list_course_drafts() from public;
revoke execute on function public.admin_list_course_drafts() from anon;
grant  execute on function public.admin_list_course_drafts() to authenticated;

revoke execute on function public.admin_set_ai_settings(boolean, integer, integer, integer, integer, integer) from public;
revoke execute on function public.admin_set_ai_settings(boolean, integer, integer, integer, integer, integer) from anon;
grant  execute on function public.admin_set_ai_settings(boolean, integer, integer, integer, integer, integer) to authenticated;

revoke execute on function public.admin_adjust_user_credits(uuid, integer, text) from public;
revoke execute on function public.admin_adjust_user_credits(uuid, integer, text) from anon;
grant  execute on function public.admin_adjust_user_credits(uuid, integer, text) to authenticated;

revoke execute on function public.admin_set_ai_model(text, integer, integer, text, boolean) from public;
revoke execute on function public.admin_set_ai_model(text, integer, integer, text, boolean) from anon;
grant  execute on function public.admin_set_ai_model(text, integer, integer, text, boolean) to authenticated;

revoke execute on function public.admin_get_ai_usage_summary() from public;
revoke execute on function public.admin_get_ai_usage_summary() from anon;
grant  execute on function public.admin_get_ai_usage_summary() to authenticated;
