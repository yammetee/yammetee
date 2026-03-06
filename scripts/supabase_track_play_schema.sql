-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.track_stats (
  track_id text primary key,
  plays_total bigint not null default 0,
  unique_listeners bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.track_unique_listeners (
  track_id text not null,
  listener_key text not null,
  first_played_at timestamptz not null default now(),
  last_played_at timestamptz not null default now(),
  primary key (track_id, listener_key)
);

create table if not exists public.track_play_events (
  id uuid primary key default gen_random_uuid(),
  track_id text not null,
  listener_key text not null,
  user_id uuid references auth.users(id) on delete set null,
  played_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_track_play_events_track_created_at
  on public.track_play_events (track_id, created_at desc);

create index if not exists idx_track_play_events_listener_track_created_at
  on public.track_play_events (listener_key, track_id, created_at desc);

alter table public.track_stats enable row level security;
alter table public.track_unique_listeners enable row level security;
alter table public.track_play_events enable row level security;

drop policy if exists "track_stats_select_all" on public.track_stats;
create policy "track_stats_select_all"
on public.track_stats
for select
to anon, authenticated
using (true);

create or replace function public.register_track_play(
  p_track_id text,
  p_session_id text,
  p_played_seconds integer default 0
)
returns table (
  accepted boolean,
  track_id text,
  plays_total bigint,
  unique_listeners bigint
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_user_id uuid;
  v_listener_key text;
  v_recent_exists boolean;
  v_unique_inserted integer;
begin
  if p_track_id is null or char_length(trim(p_track_id)) = 0 then
    raise exception 'track_id is required';
  end if;

  v_user_id := auth.uid();
  v_listener_key := coalesce(v_user_id::text, nullif(trim(p_session_id), ''));

  if v_listener_key is null then
    raise exception 'session_id is required for anonymous listener';
  end if;

  select exists (
    select 1
    from public.track_play_events e
    where e.track_id = p_track_id
      and e.listener_key = v_listener_key
      and e.created_at > now() - interval '30 minutes'
  ) into v_recent_exists;

  insert into public.track_stats (track_id, plays_total, unique_listeners, updated_at)
  values (p_track_id, 0, 0, now())
  on conflict (track_id) do nothing;

  if v_recent_exists then
    return query
    select false, s.track_id, s.plays_total, s.unique_listeners
    from public.track_stats s
    where s.track_id = p_track_id;
    return;
  end if;

  insert into public.track_play_events (track_id, listener_key, user_id, played_seconds)
  values (p_track_id, v_listener_key, v_user_id, greatest(coalesce(p_played_seconds, 0), 0));

  update public.track_stats as s
  set
    plays_total = s.plays_total + 1,
    updated_at = now()
  where s.track_id = p_track_id;

  v_unique_inserted := null;

  insert into public.track_unique_listeners (track_id, listener_key, first_played_at, last_played_at)
  values (p_track_id, v_listener_key, now(), now())
  on conflict (track_id, listener_key)
  do nothing
  returning 1 into v_unique_inserted;

  if v_unique_inserted = 1 then
    update public.track_stats as s
    set
      unique_listeners = s.unique_listeners + 1,
      updated_at = now()
    where s.track_id = p_track_id;
  else
    update public.track_unique_listeners as ul
    set last_played_at = now()
    where ul.track_id = p_track_id
      and ul.listener_key = v_listener_key;
  end if;

  return query
  select true, s.track_id, s.plays_total, s.unique_listeners
  from public.track_stats s
  where s.track_id = p_track_id;
end;
$$;

revoke all on function public.register_track_play(text, text, integer) from public;
grant execute on function public.register_track_play(text, text, integer) to anon, authenticated;
