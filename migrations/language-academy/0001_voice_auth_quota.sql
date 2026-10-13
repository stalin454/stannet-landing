-- StanNet Language Academy: paid speech entitlement + atomic AWS Polly usage quotas.
-- Only verified and explicitly approved Supabase Auth accounts can synthesize.
-- Fail closed if this migration or the PostgREST RPC is missing.
create table if not exists public.language_voice_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.language_voice_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  requests integer not null default 0,
  characters integer not null default 0,
  primary key (user_id, usage_day)
);
create table if not exists public.language_voice_global_usage (
  usage_day date primary key,
  requests integer not null default 0,
  characters integer not null default 0
);
create table if not exists public.language_voice_minute_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  minute_start timestamptz not null,
  requests integer not null default 0,
  primary key (user_id, minute_start)
);
alter table public.language_voice_access enable row level security;
alter table public.language_voice_usage enable row level security;
alter table public.language_voice_global_usage enable row level security;
alter table public.language_voice_minute_usage enable row level security;
revoke all on public.language_voice_access, public.language_voice_usage, public.language_voice_global_usage, public.language_voice_minute_usage from anon, authenticated;

-- Initial verified owner account already existed before opening the school.
-- New signups are NOT granted premium access.
insert into public.language_voice_access(user_id,enabled,approved_at)
select id,true,now() from auth.users
where email_confirmed_at is not null
order by created_at asc
limit 1
on conflict (user_id) do nothing;

create or replace function public.language_voice_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  approved boolean := false;
  usr public.language_voice_usage%rowtype;
  glob public.language_voice_global_usage%rowtype;
begin
  if actor is null then return jsonb_build_object('enabled',false,'remaining',0,'globalRemaining',0); end if;
  select exists (
    select 1 from public.language_voice_access a
    join auth.users u on u.id=a.user_id
    where a.user_id=actor and a.enabled=true and u.email_confirmed_at is not null
  ) into approved;
  select * into usr from public.language_voice_usage where user_id=actor and usage_day=(now() at time zone 'utc')::date;
  select * into glob from public.language_voice_global_usage where usage_day=(now() at time zone 'utc')::date;
  return jsonb_build_object(
    'enabled',approved,
    'remaining',case when approved then greatest(0,least(20-coalesce(usr.requests,0),1800-coalesce(usr.characters,0))) else 0 end,
    'used',coalesce(usr.requests,0),
    'charsUsed',coalesce(usr.characters,0),
    'globalRemaining',greatest(0,least(60-coalesce(glob.requests,0),6000-coalesce(glob.characters,0))),
    'timezone','UTC'
  );
end $$;
revoke all on function public.language_voice_status() from public, anon;
grant execute on function public.language_voice_status() to authenticated;

create or replace function public.language_voice_reserve(p_chars integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  approved boolean := false;
  today date := (now() at time zone 'utc')::date;
  minute_bucket timestamptz := date_trunc('minute',now());
  my_calls integer := 0;
  my_chars integer := 0;
  global_calls integer := 0;
  global_chars integer := 0;
  minute_calls integer := 0;
  global_minute_calls integer := 0;
begin
  if actor is null then return jsonb_build_object('allowed',false,'reason','login_required'); end if;
  if p_chars is null or p_chars < 1 or p_chars > 220 then
    return jsonb_build_object('allowed',false,'reason','invalid_length');
  end if;
  select exists (
    select 1 from public.language_voice_access a
    join auth.users u on u.id=a.user_id
    where a.user_id=actor and a.enabled=true and u.email_confirmed_at is not null
  ) into approved;
  if not approved then return jsonb_build_object('allowed',false,'reason','not_authorized'); end if;

  -- Serialize the entire global reservation operation. Two concurrent Worker
  -- instances cannot pass the same global cap and then both synthesize.
  perform pg_catalog.pg_advisory_xact_lock(164020261014);
  select requests,characters into my_calls,my_chars from public.language_voice_usage where user_id=actor and usage_day=today;
  select requests,characters into global_calls,global_chars from public.language_voice_global_usage where usage_day=today;
  select requests into minute_calls from public.language_voice_minute_usage where user_id=actor and minute_start=minute_bucket;
  select coalesce(sum(requests),0)::integer into global_minute_calls from public.language_voice_minute_usage where minute_start=minute_bucket;
  my_calls := coalesce(my_calls,0); my_chars := coalesce(my_chars,0);
  global_calls := coalesce(global_calls,0); global_chars := coalesce(global_chars,0);
  minute_calls := coalesce(minute_calls,0);

  if my_calls >= 20 or my_chars + p_chars > 1800 or global_calls >= 60 or global_chars + p_chars > 6000
     or minute_calls >= 3 or global_minute_calls >= 10 then
    return jsonb_build_object('allowed',false,'reason','quota_reached','remaining',greatest(0,20-my_calls));
  end if;

  insert into public.language_voice_usage(user_id,usage_day,requests,characters)
    values(actor,today,1,p_chars)
    on conflict (user_id,usage_day) do update set requests=language_voice_usage.requests+1,characters=language_voice_usage.characters+excluded.characters;
  insert into public.language_voice_global_usage(usage_day,requests,characters)
    values(today,1,p_chars)
    on conflict (usage_day) do update set requests=language_voice_global_usage.requests+1,characters=language_voice_global_usage.characters+excluded.characters;
  insert into public.language_voice_minute_usage(user_id,minute_start,requests)
    values(actor,minute_bucket,1)
    on conflict (user_id,minute_start) do update set requests=language_voice_minute_usage.requests+1;

  return jsonb_build_object('allowed',true,'remaining',19-my_calls,'globalRemaining',59-global_calls);
end $$;
revoke all on function public.language_voice_reserve(integer) from public, anon;
grant execute on function public.language_voice_reserve(integer) to authenticated;
