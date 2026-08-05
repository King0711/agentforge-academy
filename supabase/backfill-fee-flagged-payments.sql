-- Backfill: grant access for payments that were flagged only because
-- Paystack's transaction fee was passed through to the customer (see
-- paystack-webhook's FEE_CEILING_MULTIPLIER fix). Every row with status
-- 'flagged_unrecognized_amount' comes from a genuinely successful
-- charge.success event — the webhook only ever reaches the flagging logic
-- after confirming payload.event === 'charge.success' and
-- payload.data.status === 'success'. So "flagged" here means "paid, but
-- not yet granted," not "payment failed."
--
-- Our own checkout flow encodes the plan and user id directly in the
-- reference we generate (see create-paystack-checkout: `sdt_<plan>_<uuid>_<ts>`),
-- so we can recover both even though the webhook never got that far.
--
-- Safe to re-run: only touches rows still in 'flagged_unrecognized_amount'
-- status, and marks each one it fixes so it won't be picked up again.
--
-- Run this in Supabase SQL Editor. Review the RAISE NOTICE output (or the
-- final SELECT) before trusting it blindly.

do $$
declare
  r record;
  parsed_plan text;
  parsed_user_id uuid;
  expected_price numeric;
begin
  for r in
    select * from public.payments
    where status = 'flagged_unrecognized_amount'
      and provider_transaction_id like 'sdt\_%' escape '\'
  loop
    parsed_plan := split_part(r.provider_transaction_id, '_', 2);
    parsed_user_id := (substring(r.provider_transaction_id from 'sdt_[a-z0-9]+_([0-9a-f-]{36})_'))::uuid;

    expected_price := case parsed_plan
      when 'builder1' then 50000
      when 'builder2' then 50000
      when 'pro' then 90000
      else null
    end;

    -- Only backfill if: plan is recognized, user id parsed cleanly, the user
    -- still exists, and the charged amount is at/above price and within a
    -- sane fee ceiling (same 6% used in the webhook fix) — anything outside
    -- that band is left flagged for manual review rather than auto-granted.
    if expected_price is not null
       and parsed_user_id is not null
       and exists (select 1 from auth.users u where u.id = parsed_user_id)
       and r.amount >= expected_price
       and r.amount <= expected_price * 1.06
    then
      if parsed_plan = 'pro' then
        update public.entitlements
        set builder1_expires_at = now() + interval '182 days',
            builder2_expires_at = now() + interval '182 days',
            payment_provider = 'paystack'
        where user_id = parsed_user_id;
      elsif parsed_plan = 'builder1' then
        update public.entitlements
        set builder1_expires_at = now() + interval '182 days',
            payment_provider = 'paystack'
        where user_id = parsed_user_id;
      elsif parsed_plan = 'builder2' then
        update public.entitlements
        set builder2_expires_at = now() + interval '182 days',
            payment_provider = 'paystack'
        where user_id = parsed_user_id;
      end if;

      update public.payments
      set user_id = parsed_user_id,
          plan = parsed_plan,
          status = 'granted_backfill_fee_mismatch'
      where id = r.id;

      raise notice 'Granted % to user % (payment %)', parsed_plan, parsed_user_id, r.id;
    else
      raise notice 'SKIPPED payment % — plan=%, parsed_user_id=%, amount=% — needs manual review',
        r.id, parsed_plan, parsed_user_id, r.amount;
    end if;
  end loop;
end $$;

-- Review what happened:
select id, user_id, plan, amount, status, created_at
from public.payments
where status in ('granted_backfill_fee_mismatch', 'flagged_unrecognized_amount')
order by created_at desc;
