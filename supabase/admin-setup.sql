-- ============================================================
-- Social Dev Technologies — Admin & BYU Setup
-- Run this in Supabase: Project → SQL Editor → New query
--
-- Admin/Pro state lives in `entitlements`, not `profiles` — see schema.sql
-- for why (client-writable privilege columns = self-escalation hole).
-- ============================================================

-- 1. Bootstrap: grant admin to a founder account by email.
--    Run manually with the service role — never from client code.
--
-- update public.entitlements set is_admin = true
-- where user_id = (select id from auth.users where email = 'your@email.com');

-- 2. Admin function: read ALL profiles + entitlements + progress (only works
--    if caller is admin). Returns builder1_expires_at/builder2_expires_at
--    (per-tier, one-time 6-month access) rather than the legacy single
--    is_pro/pro_expires_at pair — see the "restructure_to_builder_tiers"
--    migration — plus xp/streak/completed from `progress` so the admin
--    dashboard can show what each student has actually done.
--
--    IMPORTANT: the admin-check below qualifies every entitlements column
--    with the `ent` alias (ent.user_id, ent.is_admin). Do NOT write a bare
--    `is_admin` here — this function's RETURNS TABLE declares an `is_admin`
--    output column, which plpgsql implicitly turns into an in-scope variable
--    for the whole function body. An unqualified `is_admin` reference then
--    collides with that variable and Postgres throws "column reference
--    is_admin is ambiguous" — this exact bug shipped once already.
create or replace function public.admin_get_all_profiles()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  builder1_expires_at timestamptz,
  builder2_expires_at timestamptz,
  payment_provider text,
  is_admin boolean,
  is_byu_student boolean,
  xp integer,
  streak integer,
  completed jsonb
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
      p.id, p.email, p.display_name, p.created_at,
      e.builder1_expires_at, e.builder2_expires_at, e.payment_provider,
      e.is_admin, p.is_byu_student,
      coalesce(pr.xp, 0), coalesce(pr.streak, 0), coalesce(pr.completed, '[]'::jsonb)
    from profiles p
    join entitlements e on e.user_id = p.id
    left join progress pr on pr.user_id = p.id
    order by p.created_at desc;
end;
$$;

-- 3. Admin function: grant / revoke full Pro access (both Builder 1 + Builder 2,
--    6 months) for a user
create or replace function public.admin_set_user_pro(
  target_user_id uuid,
  set_pro boolean
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

  update entitlements
  set
    builder1_expires_at = case when set_pro then now() + interval '182 days' else null end,
    builder2_expires_at = case when set_pro then now() + interval '182 days' else null end
  where user_id = target_user_id;
end;
$$;

-- 4. Admin function: grant / revoke Admin for a user
create or replace function public.admin_set_user_admin(
  target_user_id uuid,
  set_admin boolean
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

  update entitlements
  set is_admin = set_admin
  where user_id = target_user_id;
end;
$$;

-- These RPCs are meant to be called by any signed-in user attempting an admin
-- action — the function body itself is what rejects non-admins. `anon` gets
-- no grant at all (an unauthenticated caller has no auth.uid() to check).
revoke execute on function public.admin_get_all_profiles() from anon, public;
grant execute on function public.admin_get_all_profiles() to authenticated;

revoke execute on function public.admin_set_user_pro(uuid, boolean) from anon, public;
grant execute on function public.admin_set_user_pro(uuid, boolean) to authenticated;

revoke execute on function public.admin_set_user_admin(uuid, boolean) from anon, public;
grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;

-- 5. Trigger to call the notify-signup edge function on new profile insert.
--    Authenticates to the edge function with the same 'cron_secret' Vault
--    entry already used by the pg_cron-triggered email functions (see
--    cron.job) rather than a bare anon key — the edge function itself
--    rejects any request whose x-cron-secret header doesn't match.
create or replace function public.notify_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/notify-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.notify_admin_on_signup();
