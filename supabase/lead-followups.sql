-- Lead follow-ups, WhatsApp leads and admin-added leads (2026-10-24).
--
-- Everything lives on checkout_leads so /admin/leads stays one list:
--   * source: where the lead came from — 'checkout' (the pay-first form, as
--     before), 'whatsapp_form' (the floating WhatsApp button's pre-chat form,
--     written by the capture-whatsapp-lead function) or 'whatsapp_manual' (an
--     admin typed them in after they messaged on WhatsApp).
--   * email is now optional: WhatsApp leads often have only a phone number.
--     Nothing that pays reads a lead without an email — paystack-webhook only
--     resolves leads whose id was put in signed Paystack metadata by
--     create-paystack-checkout, and that path always has an email.
--   * plan holds what they asked about. For WhatsApp leads it can be several
--     comma-separated plan keys ('aimastery,builder1') or 'unspecified'.
-- lead_followups is the log of calls / chats: how it went, the next action and
-- when. next_action_at is what the admin puts on their calendar (the UI offers a
-- Google Calendar link and an .ics download). Each row is stamped with the admin
-- who entered it.
--
-- Access model: RLS on, no policies, no grants to anon/authenticated — admins go
-- through the admin_* RPCs below, the capture function uses the service role.
-- Depends on admin-mfa.sql (public.admin_session_ok()) and guest-checkout.sql.
-- Apply BEFORE deploying capture-whatsapp-lead, then merge the frontend.

alter table public.checkout_leads add column if not exists source text not null default 'checkout';
alter table public.checkout_leads add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.checkout_leads alter column email drop not null;
alter table public.checkout_leads drop constraint if exists checkout_leads_source_check;
alter table public.checkout_leads
  add constraint checkout_leads_source_check check (source in ('checkout', 'whatsapp_form', 'whatsapp_manual'));
alter table public.checkout_leads drop constraint if exists checkout_leads_plan_len;
alter table public.checkout_leads add constraint checkout_leads_plan_len check (char_length(plan) between 1 and 80);
create index if not exists checkout_leads_phone_idx on public.checkout_leads (phone);

create table if not exists public.lead_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.checkout_leads (id) on delete cascade,
  -- How the call / last follow-up went.
  note text,
  next_action text,
  next_action_at timestamptz,
  done_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint lead_followups_note_len check (note is null or char_length(note) <= 2000),
  constraint lead_followups_action_len check (next_action is null or char_length(next_action) <= 300),
  constraint lead_followups_something check (
    nullif(btrim(coalesce(note, '')), '') is not null or nullif(btrim(coalesce(next_action, '')), '') is not null
  ),
  -- A date only makes sense with an action to do on it.
  constraint lead_followups_action_date check (
    next_action_at is null or nullif(btrim(coalesce(next_action, '')), '') is not null
  )
);

create index if not exists lead_followups_lead_idx on public.lead_followups (lead_id, created_at desc);
create index if not exists lead_followups_due_idx on public.lead_followups (created_by, next_action_at)
  where done_at is null and next_action_at is not null;

alter table public.lead_followups enable row level security;
revoke all on public.lead_followups from anon, authenticated;

-- ---------- list leads (adds source; email may now be null) ----------
drop function if exists public.admin_list_checkout_leads(int);
create function public.admin_list_checkout_leads(p_limit int default 1000)
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  country_iso text,
  plan text,
  source text,
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
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select l.id, l.name, l.email, l.phone, l.country_iso, l.plan, l.source,
           (l.paid_at is not null) as paid, l.paid_at, l.created_at
    from checkout_leads l
    order by l.created_at desc
    limit greatest(1, least(coalesce(p_limit, 1000), 5000));
end;
$$;

revoke execute on function public.admin_list_checkout_leads(int) from public;
revoke execute on function public.admin_list_checkout_leads(int) from anon;
grant execute on function public.admin_list_checkout_leads(int) to authenticated;

-- ---------- add a lead by hand (someone who messaged on WhatsApp) ----------
create or replace function public.admin_add_checkout_lead(
  p_name text,
  p_phone text,
  p_email text default null,
  p_country_iso text default null,
  p_plan text default 'unspecified'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  -- The same person messaging twice shouldn't become two leads: point the admin
  -- at the existing one instead.
  if exists (select 1 from checkout_leads l where l.phone = p_phone) then
    raise exception 'A lead with this phone number already exists - search for it and add a follow-up';
  end if;

  insert into checkout_leads (name, phone, email, country_iso, plan, source, created_by)
  values (
    btrim(p_name),
    p_phone,
    nullif(lower(btrim(coalesce(p_email, ''))), ''),
    nullif(btrim(coalesce(p_country_iso, '')), ''),
    coalesce(nullif(btrim(coalesce(p_plan, '')), ''), 'unspecified'),
    'whatsapp_manual',
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_add_checkout_lead(text, text, text, text, text) from public;
revoke execute on function public.admin_add_checkout_lead(text, text, text, text, text) from anon;
grant execute on function public.admin_add_checkout_lead(text, text, text, text, text) to authenticated;

-- ---------- add a follow-up ----------
create or replace function public.admin_add_lead_followup(
  p_lead_id uuid,
  p_note text default null,
  p_next_action text default null,
  p_next_action_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  if not exists (select 1 from checkout_leads l where l.id = p_lead_id) then
    raise exception 'Lead not found';
  end if;

  insert into lead_followups (lead_id, note, next_action, next_action_at, created_by)
  values (
    p_lead_id,
    nullif(btrim(coalesce(p_note, '')), ''),
    nullif(btrim(coalesce(p_next_action, '')), ''),
    case when nullif(btrim(coalesce(p_next_action, '')), '') is null then null else p_next_action_at end,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.admin_add_lead_followup(uuid, text, text, timestamptz) from public;
revoke execute on function public.admin_add_lead_followup(uuid, text, text, timestamptz) from anon;
grant execute on function public.admin_add_lead_followup(uuid, text, text, timestamptz) to authenticated;

-- ---------- list follow-ups ----------
-- Every admin sees every follow-up (a shared lead list needs a shared history);
-- the author's name is returned so the team can see who called. "Mine" is decided
-- in the UI from created_by.
create or replace function public.admin_list_lead_followups(p_limit int default 5000)
returns table (
  id uuid,
  lead_id uuid,
  note text,
  next_action text,
  next_action_at timestamptz,
  done_at timestamptz,
  created_by uuid,
  author text,
  created_at timestamptz
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
    select f.id, f.lead_id, f.note, f.next_action, f.next_action_at, f.done_at, f.created_by,
           coalesce(nullif(p.display_name, ''), nullif(split_part(u.email, '@', 1), ''), 'Admin') as author,
           f.created_at
    from lead_followups f
    left join profiles p on p.id = f.created_by
    left join auth.users u on u.id = f.created_by
    order by f.created_at desc
    limit greatest(1, least(coalesce(p_limit, 5000), 10000));
end;
$$;

revoke execute on function public.admin_list_lead_followups(int) from public;
revoke execute on function public.admin_list_lead_followups(int) from anon;
grant execute on function public.admin_list_lead_followups(int) to authenticated;

-- ---------- mark a next action done / not done ----------
create or replace function public.admin_set_followup_done(p_id uuid, p_done boolean)
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

  update lead_followups
  set done_at = case when coalesce(p_done, false) then now() else null end
  where id = p_id;
  if not found then
    raise exception 'Follow-up not found';
  end if;
end;
$$;

revoke execute on function public.admin_set_followup_done(uuid, boolean) from public;
revoke execute on function public.admin_set_followup_done(uuid, boolean) from anon;
grant execute on function public.admin_set_followup_done(uuid, boolean) to authenticated;
