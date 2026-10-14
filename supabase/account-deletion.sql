-- Self-serve account deletion (the `delete-account` Edge Function calls this).
--
-- One SECURITY DEFINER function does the whole job in a single transaction, so a
-- failure part-way can't leave a half-deleted person. Only service_role can run it
-- (the function verifies the caller's JWT and email confirmation before calling).
--
-- Why a bare `delete from auth.users` isn't enough — found by listing every FK to
-- auth.users on 2026-10-14:
--   * payments, testimonials, email_log, checkout_leads reference the user with
--     NO ACTION, so the delete fails outright for anyone who has ever paid.
--   * referrals cascades on both sides, and referral_earnings cascades from
--     referrals — so deleting a *referred* student would silently erase the
--     referrer's unpaid commission. Hence the two refusals below.
--
-- What is kept: `payments` rows (financial records) with user_id set to NULL. Their
-- provider_transaction_id still embeds the old user uuid (sdt_<plan>_<uuid>_<ts>),
-- which is no longer linkable to anyone once the account is gone.
-- What goes: everything else tied to the person, including community messages,
-- certificates (so /verify/<id> stops resolving), progress, and any email-list,
-- scholarship, lead and email-log rows matched by their address.
--
-- Run order: apply this file, then deploy `delete-account`, then merge the frontend.

create or replace function public.delete_account_data(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = p_user;
  if v_email is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Admins (and the community assistant, which is flagged admin) are never
  -- self-deletable: community_bot_settings.bot_user_id would block it anyway, and an
  -- accidental click shouldn't be able to lock the team out.
  if exists (select 1 from entitlements where user_id = p_user and is_admin) then
    return jsonb_build_object('ok', false, 'reason', 'admin_account');
  end if;

  -- Commission owed to this person, or owed to their referrer because of them,
  -- would be erased by the cascades. Make a human settle it first.
  if exists (
    select 1
    from referral_earnings e
    left join referrals r on r.id = e.referral_id
    where e.status = 'pending'
      and (e.referrer_id = p_user or r.referred_user_id = p_user)
  ) then
    return jsonb_build_object('ok', false, 'reason', 'pending_referral_earnings');
  end if;

  update payments set user_id = null where user_id = p_user;

  delete from testimonials where user_id = p_user;
  delete from email_log where user_id = p_user or lower(email) = lower(v_email);
  delete from checkout_leads where user_id = p_user or lower(email) = lower(v_email);
  delete from email_subscribers where lower(email) = lower(v_email);
  delete from scholarship_applications where lower(email) = lower(v_email);

  -- Cascades take profiles, entitlements, guide_purchases, progress, certificates,
  -- community_*, referrals, notifications, ai_* and the sessions/identities in auth.
  delete from auth.users where id = p_user;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.delete_account_data(uuid) from public;
revoke execute on function public.delete_account_data(uuid) from anon;
revoke execute on function public.delete_account_data(uuid) from authenticated;
grant  execute on function public.delete_account_data(uuid) to service_role;
