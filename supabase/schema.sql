-- Dreamscope — Supabase schema
-- Run this once in the Supabase SQL editor, then set env vars:
--   Vercel: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (frontend)
--           SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (optional, server only)

-- Profiles: user preferences (mirrors localStorage guest settings)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'en',
  perspective text not null default 'general',
  theme text not null default 'dark',
  created_at timestamptz not null default now()
);

-- Dreams: the cloud journal (client_id mirrors the local entry id for dedupe)
create table if not exists public.dreams (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id bigint not null,
  dream text not null,
  interpretation text not null,
  language text default 'en',
  perspective text default 'general',
  symbols text[],
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
create index if not exists dreams_user_created on public.dreams (user_id, created_at desc);

-- Feedback: thumbs up/down on interpretations (guests allowed)
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  interpretation_id text,
  helpful boolean not null,
  language text,
  perspective text,
  engine text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.dreams   enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "dreams_owner_all" on public.dreams;
create policy "dreams_owner_all" on public.dreams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any" on public.feedback
  for insert with check (auth.uid() = user_id or user_id is null);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
