-- ============================================================
-- Discount codes (2026-10-16) — AI Agent Mastery first
--
-- An admin generates codes at /admin/discount-codes; a buyer types one into the
-- price card on /ai-agent-mastery and pays DISCOUNT_CODE_PRICE_NAIRA (10,000)
-- instead of the normal price. create-paystack-checkout re-checks the code
-- server-side and puts the code's id in the signed Paystack metadata;
-- paystack-webhook redeems it only after the verified, amount-checked payment.
--
-- A code is a bearer secret (anyone who has it can use it), so they are random
-- 10-character strings from a 32-symbol alphabet (50 bits), generated here from
-- gen_random_uuid() (a CSPRNG) rather than random(). Each code is single-use by
-- default; max_uses can be raised for a shared code, expires_at is optional.
--
-- Access model: RLS on, NO policies, no grants to anon/authenticated — the
-- tables are unreachable from the REST API. The Edge Functions read them with
-- the service role; admins go through the admin_* RPCs below.
--
-- Depends on admin-mfa.sql (public.admin_session_ok()).
-- Apply BEFORE deploying create-paystack-checkout / paystack-webhook.
-- ============================================================

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    check (code ~ '^[A-Z2-9]{5}-[A-Z2-9]{5}$'),
  -- Only aimastery for now; the column is here so other products can follow.
  plan text not null default 'aimastery'
    check (plan in ('aimastery')),
  -- Admin's own note: who it was made for, which campaign.
  label text check (label is null or char_length(label) <= 80),
  max_uses integer not null default 1 check (max_uses between 1 and 1000),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  disabled boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- One row per redeemed payment. payment_reference is UNIQUE so a retried
-- webhook delivery can't count the same payment twice. user_id is a plain uuid
-- (no FK to auth.users) so account deletion is never blocked by it.
create table if not exists public.discount_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.discount_codes(id) on delete cascade,
  payment_reference text not null unique,
  user_id uuid,
  redeemed_at timestamptz not null default now()
);
create index if not exists discount_code_redemptions_code_idx
  on public.discount_code_redemptions (code_id);

alter table public.discount_codes enable row level security;
alter table public.discount_code_redemptions enable row level security;
revoke all on public.discount_codes from anon, authenticated;
revoke all on public.discount_code_redemptions from anon, authenticated;

-- ---------- Edge Function: redeem after a verified payment ----------
-- service_role only. Idempotent per payment reference. Returns true when this
-- call counted the use. If two buyers raced for the last use of a single-use
-- code, both have already paid the quoted price, so the second is still
-- recorded (never refuse a paid-for grant) but used_count is capped at
-- max_uses; compare redemptions to max_uses to spot it.
create or replace function public.redeem_discount_code(p_code_id uuid, p_reference text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into discount_code_redemptions (code_id, payment_reference, user_id)
  values (p_code_id, p_reference, p_user_id)
  on conflict (payment_reference) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return false;
  end if;

  update discount_codes
     set used_count = least(used_count + 1, max_uses)
   where id = p_code_id;
  return true;
end;
$$;

revoke execute on function public.redeem_discount_code(uuid, text, uuid) from public;
revoke execute on function public.redeem_discount_code(uuid, text, uuid) from anon;
revoke execute on function public.redeem_discount_code(uuid, text, uuid) from authenticated;
grant execute on function public.redeem_discount_code(uuid, text, uuid) to service_role;

-- ---------- admin: generate ----------
create or replace function public.admin_create_discount_codes(
  p_count integer,
  p_label text default null,
  p_max_uses integer default 1,
  p_expires_at timestamptz default null
)
returns setof public.discount_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 symbols, no I/O/0/1
  v_made integer := 0;
  v_tries integer := 0;
  v_bytes bytea;
  v_code text;
  v_row public.discount_codes;
  i integer;
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  if p_count is null or p_count < 1 or p_count > 100 then
    raise exception 'Generate between 1 and 100 codes at a time';
  end if;
  if p_max_uses is null or p_max_uses < 1 or p_max_uses > 1000 then
    raise exception 'Uses per code must be between 1 and 1000';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'The expiry must be in the future';
  end if;

  while v_made < p_count loop
    v_tries := v_tries + 1;
    if v_tries > p_count * 10 then
      raise exception 'Could not generate unique codes, try again';
    end if;

    -- 16 random bytes from two UUIDs; 256 is divisible by 32, so mod is unbiased.
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    for i in 0..9 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    v_code := substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5);

    begin
      insert into discount_codes (code, label, max_uses, expires_at, created_by)
      values (v_code, nullif(btrim(p_label), ''), p_max_uses, p_expires_at, auth.uid())
      returning * into v_row;
    exception when unique_violation then
      continue;
    end;

    v_made := v_made + 1;
    return next v_row;
  end loop;
  return;
end;
$$;

revoke execute on function public.admin_create_discount_codes(integer, text, integer, timestamptz) from public;
revoke execute on function public.admin_create_discount_codes(integer, text, integer, timestamptz) from anon;
grant execute on function public.admin_create_discount_codes(integer, text, integer, timestamptz) to authenticated;

-- ---------- admin: list ----------
create or replace function public.admin_list_discount_codes()
returns table (
  id uuid,
  code text,
  plan text,
  label text,
  max_uses integer,
  used_count integer,
  expires_at timestamptz,
  disabled boolean,
  created_at timestamptz,
  last_redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select d.id, d.code, d.plan, d.label, d.max_uses, d.used_count, d.expires_at, d.disabled, d.created_at,
           (select max(r.redeemed_at) from discount_code_redemptions r where r.code_id = d.id)
    from discount_codes d
    order by d.created_at desc
    limit 500;
end;
$$;

revoke execute on function public.admin_list_discount_codes() from public;
revoke execute on function public.admin_list_discount_codes() from anon;
grant execute on function public.admin_list_discount_codes() to authenticated;

-- ---------- admin: disable / re-enable ----------
create or replace function public.admin_set_discount_code_disabled(p_id uuid, p_disabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update discount_codes set disabled = coalesce(p_disabled, false) where id = p_id;
  if not found then
    raise exception 'Code not found';
  end if;
end;
$$;

revoke execute on function public.admin_set_discount_code_disabled(uuid, boolean) from public;
revoke execute on function public.admin_set_discount_code_disabled(uuid, boolean) from anon;
grant execute on function public.admin_set_discount_code_disabled(uuid, boolean) to authenticated;
