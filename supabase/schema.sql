-- Social Dev Technologies — Supabase schema
-- Run this in your Supabase project's SQL Editor (Project → SQL Editor → New query)
--
-- Privilege fields (is_pro, is_admin, pro_expires_at, payment_provider) live in
-- `entitlements`, a separate table with NO client update policy — writes only
-- happen via the service role (Edge Functions) or the SECURITY DEFINER admin
-- functions in admin-setup.sql, which perform their own admin check. This is
-- deliberate: a client-writable privilege column on `profiles` would let any
-- logged-in user grant themselves Pro/admin via a direct REST call.

-- 1. Profiles table — one row per user, created automatically on sign up.
--    Only user-editable, non-privileged fields belong here.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  is_byu_student boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Entitlements table — privilege data, never client-writable.
--    builder1_expires_at / builder2_expires_at are the source of truth for
--    per-tier access (one-time payment, 6 months each). is_pro/pro_expires_at
--    are legacy columns from the old single-Pro-subscription model — kept
--    for historical data continuity but no longer read or written anywhere.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_pro boolean not null default false,
  pro_expires_at timestamptz,
  payment_provider text, -- 'paystack'
  is_admin boolean not null default false,
  updated_at timestamptz not null default now(),
  builder1_expires_at timestamptz,
  builder2_expires_at timestamptz
);

alter table public.entitlements enable row level security;

create policy "Users can view their own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for authenticated/anon roles.
-- Writes only via the service role key (used inside Edge Functions) or the
-- SECURITY DEFINER admin_* functions below.

-- Keep updated_at fresh on every write
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_entitlements_updated_at on public.entitlements;
create trigger set_entitlements_updated_at
  before update on public.entitlements
  for each row execute procedure public.set_updated_at();

-- 3. Automatically create a profile + a default (free) entitlements row
--    whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, is_byu_student)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email ilike '%@byupathway.edu'
  );
  insert into public.entitlements (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Not meant to be called directly via the PostgREST API — only via the trigger.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- 4. Progress table — one row per user, holds XP/streak/completed agents/history
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 0,
  last_visit text,
  completed jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "Users can view their own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.progress for update
  using (auth.uid() = user_id);

drop trigger if exists set_progress_updated_at on public.progress;
create trigger set_progress_updated_at
  before update on public.progress
  for each row execute procedure public.set_updated_at();

-- 5. Payments ledger — lets webhooks verify amount/plan and stay idempotent
--    against duplicate delivery. Only the service role writes here.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null check (provider in ('paystack')),
  provider_transaction_id text unique not null,
  amount numeric not null,
  currency text not null,
  status text not null,
  created_at timestamptz not null default now(),
  plan text check (plan in ('builder1', 'builder2', 'pro'))
);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);
-- No client insert/update policy — only the service role (Edge Functions) writes here.

-- 6. Course content — the actual gated guide/prompt/starter-code content for
--    each agent session. Public metadata (title, difficulty, XP, tech stack)
--    stays in the static JS bundle (src/data/agents*.js); only the valuable
--    content lives here, keyed by course_id and gated by tier so it's never
--    shipped to non-entitled users in the client bundle.
create table if not exists public.course_content (
  course_id integer primary key,
  what_you_build text,
  what_you_learn jsonb,
  session jsonb,
  starter_code text,
  test_it_out text,
  troubleshooting jsonb,
  resources jsonb,
  updated_at timestamptz not null default now(),
  tier text not null check (tier in ('builder1', 'builder2', 'admin_only'))
);

alter table public.course_content enable row level security;

-- Readable only by admins, or by users with an active entitlement matching
-- this row's tier. admin_only content (Advanced/World Class) has no active-
-- entitlement branch at all — it is genuinely unpurchasable, admin access only.
create policy "Tiered course content requires matching active entitlement or admin"
  on public.course_content for select
  using (
    exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true)
    or (tier = 'builder1' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.builder1_expires_at is not null and e.builder1_expires_at > now()
    ))
    or (tier = 'builder2' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.builder2_expires_at is not null and e.builder2_expires_at > now()
    ))
  );
-- No client insert/update/delete policy — content is managed via the service role.
