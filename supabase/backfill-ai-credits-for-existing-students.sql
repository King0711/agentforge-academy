-- ============================================================
-- Social Dev Technologies — AI Builder Credits backfill
-- Run once, in Supabase: Project → SQL Editor → New query
--
-- Students who paid and enrolled BEFORE the AI Builder Credits system
-- shipped would otherwise open the new Credits tab and see a balance of
-- zero, despite being fully paid, active students. This grants each of
-- them the standard allotment for the access they currently hold.
--
-- Idempotent via ai_grant_credits' own 24h-windowed duplicate check on
-- (user, type, description) — safe to re-run; it will not double-grant
-- a student it already backfilled.
-- ============================================================

do $$
declare
  r record;
  v_settings record;
  v_amount integer;
  v_granted integer := 0;
begin
  select grant_builder1, grant_builder2, grant_pro
  into v_settings
  from ai_platform_settings where id = true;

  for r in
    select e.user_id,
      (e.builder1_expires_at is not null and e.builder1_expires_at > now()) as has_b1,
      (e.builder2_expires_at is not null and e.builder2_expires_at > now()) as has_b2
    from entitlements e
    where (e.builder1_expires_at > now() or e.builder2_expires_at > now())
      and e.is_admin = false  -- admins bypass credit gating entirely; nothing to backfill
  loop
    if r.has_b1 and r.has_b2 then
      v_amount := v_settings.grant_pro;
    elsif r.has_b1 then
      v_amount := v_settings.grant_builder1;
    else
      v_amount := v_settings.grant_builder2;
    end if;

    perform public.ai_grant_credits(
      r.user_id,
      v_amount,
      'initial_allocation',
      'Backfill — active student before AI Builder Credits launch'
    );
    v_granted := v_granted + 1;
  end loop;

  raise notice 'Backfilled % student wallet(s)', v_granted;
end $$;
