-- Guest checkout + lead capture (2026-10-13).
--
-- Signed-out visitors no longer have to create an account and verify an email
-- code BEFORE paying. They give a name, email and phone number; create-paystack-
-- checkout stores that as a checkout_leads row (so abandoned buyers stay on the
-- list) and sends them to Paystack with metadata.lead_id. paystack-webhook then,
-- only after a verified, amount-checked payment, creates (or finds) the account
-- for that email and grants access. The email is verified at the buyer's first
-- login (an emailed code), never before they pay.
--
-- Apply BEFORE deploying create-paystack-checkout / paystack-webhook /
-- guest-checkout-status, then merge the frontend.

-- ---------- leads ----------
create table if not exists public.checkout_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  -- E.164 with the country code the buyer chose, e.g. +2348012345678.
  phone text not null,
  country_iso text,
  -- The plan they were buying when they filled the form.
  plan text not null,
  referral_code text,
  -- Keyed hash of the caller's IP (same scheme as scholarship_applications) so
  -- the function can rate-limit without keeping the address.
  ip_hash text,
  -- Filled in by paystack-webhook once a verified payment resolves this lead to
  -- an account.
  user_id uuid references auth.users (id) on delete set null,
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  constraint checkout_leads_email_len check (char_length(email) between 3 and 254),
  constraint checkout_leads_name_len check (char_length(btrim(name)) between 2 and 80),
  constraint checkout_leads_phone_format check (phone ~ '^\+[1-9][0-9]{7,14}$')
);

create index if not exists checkout_leads_created_idx on public.checkout_leads (created_at desc);
create index if not exists checkout_leads_email_idx on public.checkout_leads (lower(email));
create index if not exists checkout_leads_ip_idx
  on public.checkout_leads (ip_hash, created_at)
  where ip_hash is not null;

-- Server-only: the Edge Functions use the service role. Nothing in the browser
-- reads or writes this table directly.
alter table public.checkout_leads enable row level security;
revoke all on public.checkout_leads from anon, authenticated;

-- ---------- profile phone ----------
-- Server-only on purpose (see profiles-column-grants.sql): the client may update
-- display_name and industry only, and a new column is NOT client-writable
-- unless it is added to that grant. A user can still read their own row.
alter table public.profiles add column if not exists phone text;

-- ---------- admin: list leads ----------
-- Admin-gated, with the three revoke/grant statements this project requires for
-- any admin_* RPC. ip_hash is deliberately not returned.
create or replace function public.admin_list_checkout_leads(p_limit int default 1000)
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  country_iso text,
  plan text,
  paid boolean,
  paid_at timestamptz,
  created_at timestamptz
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
    select l.id, l.name, l.email, l.phone, l.country_iso, l.plan,
           (l.paid_at is not null) as paid, l.paid_at, l.created_at
    from checkout_leads l
    order by l.created_at desc
    limit greatest(1, least(coalesce(p_limit, 1000), 5000));
end;
$$;

revoke execute on function public.admin_list_checkout_leads(int) from public;
revoke execute on function public.admin_list_checkout_leads(int) from anon;
grant execute on function public.admin_list_checkout_leads(int) to authenticated;
