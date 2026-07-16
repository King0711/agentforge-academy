-- AgentForge Academy — Supabase schema
-- Run this in your Supabase project's SQL Editor (Project → SQL Editor → New query)

-- 1. Profiles table — one row per user, created automatically on sign up
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Automatically create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Pro subscription columns on profiles
alter table public.profiles
  add column if not exists is_pro boolean not null default false,
  add column if not exists pro_expires_at timestamptz,
  add column if not exists payment_provider text, -- 'flutterwave' | 'lemonsqueezy'
  add column if not exists is_admin boolean not null default false;

-- To grant yourself admin access, run this in the Supabase SQL Editor
-- (replace the email with your own):
--
-- update public.profiles set is_admin = true where email = 'your@email.com';

-- Webhook handler can update pro status (service role only — bypasses RLS)
-- The edge function runs with the service role key, so no extra policy needed.

-- 2. Progress table — one row per user, holds XP/streak/completed agents/history
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp integer not null default 0,
  streak integer not null default 0,
  last_visit text,
  completed jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "Users can view their own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.progress for update
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every write
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_progress_updated_at on public.progress;
create trigger set_progress_updated_at
  before update on public.progress
  for each row execute procedure public.set_updated_at();
