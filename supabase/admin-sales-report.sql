-- Admin sales report (2026-11-09): every payment the Paystack webhook recorded
-- in a date range, for /admin/sales (src/pages/admin/AdminSales.jsx), which
-- shows the totals and exports a CSV.
--
-- Read-only. The buyer email is auth.users.email (the confirmed account
-- address), not profiles.email; see CLAUDE.md "Checkout recovery" for why.
-- Payments whose account was deleted keep user_id = NULL and come back with no
-- name or email (account-deletion.sql).
--
-- `product` fills in payments recorded before payments.plan was set (July 2026)
-- from their checkout reference (sdt_<plan>_<uuid>_<ts>), e.g. sdt_pro_... and
-- sdt_live_class_.... It stays NULL for references that don't follow that
-- shape (such as a ₦100 card check).
--
-- Whether a row counts as a sale, and the Paystack fee estimate, are decided in
-- the page (src/lib/salesReport.js), so this function hands back every row.

create or replace function public.admin_get_sales_report(p_from timestamptz, p_to timestamptz)
returns table (
  id uuid,
  created_at timestamptz,
  reference text,
  plan text,
  product text,
  amount numeric,
  currency text,
  status text,
  buyer_name text,
  buyer_email text,
  referral_commission numeric
)
language plpgsql
stable
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

  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Choose a start date before the end date';
  end if;

  return query
    select
      p.id,
      p.created_at,
      p.provider_transaction_id,
      p.plan,
      coalesce(
        p.plan,
        case
          when p.provider_transaction_id like 'sdt\_live\_class\_%' then 'live_class'
          when p.provider_transaction_id ~ '^sdt_[a-z0-9]+_' then split_part(p.provider_transaction_id, '_', 2)
        end
      ),
      p.amount,
      p.currency,
      p.status,
      nullif(pr.display_name, ''),
      u.email::text,
      coalesce((select sum(re.amount) from referral_earnings re where re.payment_id = p.id), 0)
    from payments p
    left join auth.users u on u.id = p.user_id
    left join profiles pr on pr.id = p.user_id
    where p.created_at >= p_from and p.created_at < p_to
    order by p.created_at;
end;
$$;

revoke execute on function public.admin_get_sales_report(timestamptz, timestamptz) from public;
revoke execute on function public.admin_get_sales_report(timestamptz, timestamptz) from anon;
grant execute on function public.admin_get_sales_report(timestamptz, timestamptz) to authenticated;
