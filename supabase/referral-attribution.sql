-- Referral attribution for people who already have an account (2026-10-20).
--
-- Until now a referral was recorded in exactly one place: handle_new_user(),
-- when the account was first created. Anyone who already had an account — most
-- often because they had bought a course before — followed a referral link and
-- paid, and the referrer earned nothing. This adds a second path: the payment
-- itself carries the code (create-paystack-checkout puts it in the signed
-- Paystack metadata; guests carry it on their checkout_leads row) and
-- paystack-webhook calls attribute_referral() once the payment is verified and
-- granted, just before the commission is computed.
--
-- First touch wins: referrals.referred_user_id is UNIQUE, so a person who is
-- already referred (at signup or by an earlier payment) keeps their referrer.
-- Self-referral is refused here as well as by the table's check constraint.
-- Returns true only when a new referral row was written.
--
-- Run this before deploying paystack-webhook and create-paystack-checkout.

create or replace function public.attribute_referral(p_user uuid, p_code text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_owner uuid;
  v_rows int;
begin
  if p_user is null or v_code = '' then
    return false;
  end if;

  select user_id into v_owner from public.referral_codes where code = v_code;
  if v_owner is null or v_owner = p_user then
    return false;
  end if;

  insert into public.referrals (referrer_id, referred_user_id, code)
  values (v_owner, p_user, v_code)
  on conflict (referred_user_id) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- Service role only (the webhook). Same default-grant dance as every function
-- in this project: PUBLIC and the direct anon/authenticated grants all go.
revoke execute on function public.attribute_referral(uuid, text) from public;
revoke execute on function public.attribute_referral(uuid, text) from anon;
revoke execute on function public.attribute_referral(uuid, text) from authenticated;
grant  execute on function public.attribute_referral(uuid, text) to service_role;
