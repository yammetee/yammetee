-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  nickname text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_liked_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  author text not null,
  content text not null check (char_length(trim(content)) > 0),
  is_anonymous boolean not null default false,
  likes integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_created_at on public.comments (created_at);
create index if not exists idx_user_liked_tracks_user_created on public.user_liked_tracks (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at
before update on public.comments
for each row
execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;
alter table public.user_liked_tracks enable row level security;
alter table public.comments enable row level security;

drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.user_profiles;
create policy "profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "liked_tracks_select_own" on public.user_liked_tracks;
create policy "liked_tracks_select_own"
on public.user_liked_tracks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "liked_tracks_insert_own" on public.user_liked_tracks;
create policy "liked_tracks_insert_own"
on public.user_liked_tracks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "liked_tracks_delete_own" on public.user_liked_tracks;
create policy "liked_tracks_delete_own"
on public.user_liked_tracks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "comments_select_all_authenticated" on public.comments;
create policy "comments_select_all_authenticated"
on public.comments
for select
to authenticated
using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "comments_update_owner_or_admin" on public.comments;
create policy "comments_update_owner_or_admin"
on public.comments
for update
to authenticated
using (
  auth.uid() = user_id
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'a.luganko@gmail.com'
)
with check (
  auth.uid() = user_id
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'a.luganko@gmail.com'
);

drop policy if exists "comments_delete_owner_or_admin" on public.comments;
create policy "comments_delete_owner_or_admin"
on public.comments
for delete
to authenticated
using (
  auth.uid() = user_id
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'a.luganko@gmail.com'
);

create or replace function public.increment_comment_likes(comment_id uuid)
returns table (
  id uuid,
  user_id uuid,
  author text,
  content text,
  is_anonymous boolean,
  likes integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  return query
  update public.comments
  set likes = likes + 1
  where comments.id = comment_id
  returning comments.id, comments.user_id, comments.author, comments.content, comments.is_anonymous, comments.likes, comments.created_at;
end;
$$;

revoke all on function public.increment_comment_likes(uuid) from public;
grant execute on function public.increment_comment_likes(uuid) to authenticated;
