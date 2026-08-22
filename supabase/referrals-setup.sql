-- Student referral program — students who have paid for Builder 1, Builder 2,
-- or Pro get a code they can share; when someone they referred pays for any
-- of those plans, the referrer earns a flat ₦5,000. Run this in your
-- Supabase project's SQL Editor after schema.sql and admin-setup.sql.
--
-- The payout rule is intentionally strict: at most ONE ₦5,000 credit per
-- referred student, ever — not one per plan they buy. A student who signs
-- up via a link, buys Builder 1, and later buys Builder 2 separately still
-- only ever earns their referrer a single payout. That's enforced with a
-- database constraint (referral_earnings.referral_id is unique), not just
-- application logic, since this is the one rule that must never be wrong.
--
-- Attribution is link-only (?ref=CODE, captured client-side and passed
-- through signUp()'s metadata) — there is deliberately no manual "enter a
-- referral code" field anywhere, so there's only one path into the
-- referrals table for the trigger below to trust.

-- 1. Referral codes — one per user, created on demand (not at signup) so a
--    student who never visits the Refer & Earn page never gets one. No
--    client insert/update policy: codes are minted only by
--    get_or_create_my_referral_code() below, which is also the "must have
--    paid for something" gate — a client-writable code here would let
--    anyone hand out a working code without ever having enrolled.
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

create policy "Users can view their own referral code"
  on public.referral_codes for select
  using (auth.uid() = user_id);

-- 2. Referrals — one row per referred signup, written once by
--    handle_new_user() (extended below) at account-creation time, never by
--    the client directly. referred_user_id is unique: a person can only
--    ever be attributed to the one referrer whose link they first signed
--    up through, so there's no double-crediting or re-attribution later.
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referred_user_id uuid not null unique references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  constraint referrals_no_self_referral check (referrer_id <> referred_user_id)
);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

create policy "Referrers can view their own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

-- 3. Referral earnings — the payout ledger. Written only by
--    paystack-webhook (service role, after a real charge is verified) and
--    updated only by admin_mark_referral_earning_paid() below.
--
--    referral_id is UNIQUE: this is the actual enforcement of "at most one
--    payout per referred student, ever." payment_id is also unique, purely
--    as a second guard against a retried webhook delivery double-inserting
--    for the exact same charge.
create table if not exists public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null unique references public.referrals (id) on delete cascade,
  referrer_id uuid not null references auth.users (id) on delete cascade,
  payment_id uuid not null unique references public.payments (id) on delete cascade,
  plan text not null check (plan in ('builder1', 'builder2', 'pro')),
  amount numeric not null default 5000,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_by uuid references auth.users (id)
);

create index if not exists referral_earnings_referrer_id_idx on public.referral_earnings (referrer_id);
create index if not exists referral_earnings_status_idx on public.referral_earnings (status);

alter table public.referral_earnings enable row level security;

create policy "Referrers can view their own earnings"
  on public.referral_earnings for select
  using (auth.uid() = referrer_id);

-- 4. Extend the existing signup trigger to capture referral attribution.
--    Everything above the "Referral attribution" block is unchanged from
--    schema.sql — this is a CREATE OR REPLACE of the same function the
--    existing on_auth_user_created trigger already calls, so no trigger
--    redefinition is needed.
--
--    The referral half is wrapped in its own exception-swallowing block:
--    a missing code, a code that doesn't exist, or any other problem here
--    must never block account creation, which is the one thing this
--    function absolutely cannot fail to do.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_code text;
  ref_owner uuid;
begin
  insert into public.profiles (id, email, display_name, is_byu_student)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email ilike '%@byupathway.edu'
  );
  insert into public.entitlements (user_id) values (new.id);

  begin
    ref_code := upper(trim(new.raw_user_meta_data ->> 'referral_code'));
    if ref_code is not null and ref_code <> '' then
      select user_id into ref_owner from public.referral_codes where code = ref_code;
      if ref_owner is not null and ref_owner <> new.id then
        insert into public.referrals (referrer_id, referred_user_id, code)
        values (ref_owner, new.id, ref_code);
      end if;
    end if;
  exception when others then
    null;
  end;

  return new;
end;
$$;

-- 5. get_or_create_my_referral_code — the only way a referral_codes row
--    gets created. Gated to students who have ever held a Builder 1 or
--    Builder 2 entitlement (current or expired — someone whose access
--    lapsed is still a real student) or is_admin. Returns the existing
--    code on every call after the first.
create or replace function public.get_or_create_my_referral_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  existing text;
  base text;
  candidate text;
  attempt int := 0;
  inserted_code text;
begin
  select code into existing from public.referral_codes where user_id = auth.uid();
  if existing is not null then
    return existing;
  end if;

  if not exists (
    select 1 from public.entitlements ent
    where ent.user_id = auth.uid()
      and (ent.builder1_expires_at is not null or ent.builder2_expires_at is not null or ent.is_admin = true)
  ) then
    raise exception 'Only enrolled students can get a referral code';
  end if;

  select upper(regexp_replace(coalesce(display_name, ''), '[^a-zA-Z0-9]', '', 'g'))
    into base
  from public.profiles where id = auth.uid();
  base := left(nullif(base, ''), 8);
  if base is null or base = '' then
    base := 'STUDENT';
  end if;

  loop
    attempt := attempt + 1;
    candidate := base || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    begin
      insert into public.referral_codes (user_id, code)
      values (auth.uid(), candidate)
      on conflict (user_id) do nothing
      returning code into inserted_code;
    exception when unique_violation then
      -- Code collision (not a user_id collision — that's absorbed by ON
      -- CONFLICT above) — loop and try a fresh random suffix.
      inserted_code := null;
    end;

    if inserted_code is not null then
      return inserted_code;
    end if;

    -- Either this call's code collided, or a concurrent call for the same
    -- user already won and inserted first. Either way, check for a row
    -- before spending another attempt.
    select code into existing from public.referral_codes where user_id = auth.uid();
    if existing is not null then
      return existing;
    end if;

    if attempt >= 10 then
      raise exception 'Could not generate a unique referral code, please try again';
    end if;
  end loop;
end;
$$;

-- 6. get_my_referrals — dashboard read. SECURITY DEFINER only to reach
--    across into other users' profiles.display_name; the hard
--    `r.referrer_id = auth.uid()` scope means a caller only ever sees
--    people they themselves referred, never anyone else's.
create or replace function public.get_my_referrals()
returns table (
  referred_display_name text,
  signed_up_at timestamptz,
  paid boolean,
  plan text,
  earning_status text
)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  select
    p.display_name,
    r.created_at,
    (e.id is not null) as paid,
    e.plan,
    e.status
  from public.referrals r
  join public.profiles p on p.id = r.referred_user_id
  left join public.referral_earnings e on e.referral_id = r.id
  where r.referrer_id = auth.uid()
  order by r.created_at desc;
end;
$$;

-- 7. Admin payout queue.
create or replace function public.admin_list_referral_earnings(p_status text default 'pending')
returns table (
  id uuid,
  referrer_display_name text,
  referrer_email text,
  code text,
  plan text,
  amount numeric,
  status text,
  created_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  if p_status not in ('pending', 'paid', 'all') then
    raise exception 'Invalid status';
  end if;

  return query
  select
    re.id, p.display_name, p.email, r.code, re.plan, re.amount, re.status, re.created_at, re.paid_at
  from public.referral_earnings re
  join public.referrals r on r.id = re.referral_id
  join public.profiles p on p.id = re.referrer_id
  where p_status = 'all' or re.status = p_status
  order by re.created_at asc;
end;
$$;

create or replace function public.admin_mark_referral_earning_paid(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update referral_earnings
  set status = 'paid', paid_at = now(), paid_by = auth.uid()
  where id = p_id and status = 'pending';
end;
$$;

-- 8. Grants. handle_new_user() keeps its existing revoke (schema.sql) — not
--    reproduced here since this file only CREATE OR REPLACEs its body,
--    which does not reset a function's ACL. get_my_referrals() is safe for
--    any signed-in user to call (returns an empty set if they have no
--    referrals), so it alone is granted to authenticated without the
--    admin-style revoke-from-anon dance being the *only* thing standing
--    between it and misuse. Every function that can mutate state or read
--    another user's data still gets the full three-statement treatment.
revoke execute on function public.get_or_create_my_referral_code() from anon, public;
grant execute on function public.get_or_create_my_referral_code() to authenticated;

revoke execute on function public.get_my_referrals() from anon, public;
grant execute on function public.get_my_referrals() to authenticated;

revoke execute on function public.admin_list_referral_earnings(text) from anon, public;
grant execute on function public.admin_list_referral_earnings(text) to authenticated;

revoke execute on function public.admin_mark_referral_earning_paid(uuid) from anon, public;
grant execute on function public.admin_mark_referral_earning_paid(uuid) to authenticated;
