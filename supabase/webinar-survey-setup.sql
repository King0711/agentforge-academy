-- Webinar non-converter survey — a public, anonymous, insert-only form for
-- webinar signups who never bought Builder 1 (either never joined the
-- webinar, or joined and didn't convert). Reached only via a direct link, no
-- login required (most respondents never created an account). Run this in
-- your Supabase project's SQL Editor after schema.sql and admin-setup.sql.

-- 1. Responses table. RLS grants anonymous INSERT only — there is
--    deliberately no client select/update/delete policy, so responses (and
--    any emails left in them) can't be read back or tampered with by anon
--    clients. Reading happens only through admin_list_webinar_survey_
--    responses() below.
create table if not exists public.webinar_survey_responses (
  id uuid primary key default gen_random_uuid(),
  attended_webinar boolean not null,
  webinar_rating smallint check (webinar_rating between 1 and 5),
  webinar_feedback text,
  no_join_reason text,
  no_signup_reason text not null,
  no_signup_reason_other text,
  willingness_to_pay text,
  change_mind_feedback text,
  contact_email text,
  created_at timestamptz not null default now()
);

alter table public.webinar_survey_responses enable row level security;

create policy "Anyone can submit a survey response"
  on public.webinar_survey_responses for insert
  with check (true);

-- 2. Admin read — same is_admin-gated SECURITY DEFINER pattern as
--    admin_list_referral_earnings() in referrals-setup.sql, rather than an
--    RLS select policy, so the table stays insert-only for anon/authenticated
--    and every read goes through one auditable, admin-only entry point.
create or replace function public.admin_list_webinar_survey_responses()
returns setof public.webinar_survey_responses
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
  select * from public.webinar_survey_responses
  order by created_at desc;
end;
$$;

revoke execute on function public.admin_list_webinar_survey_responses() from anon, public;
grant execute on function public.admin_list_webinar_survey_responses() to authenticated;
