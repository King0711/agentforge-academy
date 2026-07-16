-- ============================================================
-- Social Dev Technologies — Admin & BYU Setup
-- Run this in Supabase: Project → SQL Editor → New query
-- ============================================================

-- 1. Add is_byu_student column to profiles
alter table public.profiles
  add column if not exists is_byu_student boolean not null default false;

-- 2. Update the new-user trigger to auto-flag BYU emails
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
  return new;
end;
$$;

-- 3. Admin function: read ALL profiles (only works if caller is admin)
create or replace function public.admin_get_all_profiles()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  is_pro boolean,
  pro_expires_at timestamptz,
  payment_provider text,
  is_admin boolean,
  is_byu_student boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select
      p.id, p.email, p.display_name, p.created_at,
      p.is_pro, p.pro_expires_at, p.payment_provider,
      p.is_admin, p.is_byu_student
    from profiles p
    order by p.created_at desc;
end;
$$;

-- 4. Admin function: grant / revoke Pro for a user
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
    select 1 from profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update profiles
  set
    is_pro = set_pro,
    pro_expires_at = case
      when set_pro then now() + interval '31 days'
      else null
    end
  where id = target_user_id;
end;
$$;

-- 5. Admin function: grant / revoke Admin for a user
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
    select 1 from profiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update profiles
  set is_admin = set_admin
  where id = target_user_id;
end;
$$;

-- 6. (Optional) Trigger to call the notify-signup edge function on new profile insert
--    Replace YOUR_PROJECT_REF with your actual Supabase project ref (from the URL)
--    e.g. https://xyzabcdef.supabase.co → ref is xyzabcdef
--
-- create or replace function public.notify_admin_on_signup()
-- returns trigger language plpgsql security definer as $$
-- begin
--   perform net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-signup',
--     headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
--     body := json_build_object('record', row_to_json(new))::text
--   );
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_profile_created on public.profiles;
-- create trigger on_profile_created
--   after insert on public.profiles
--   for each row execute procedure public.notify_admin_on_signup();
