-- StanNet voice quota upgrade, 2026-10-20
-- Existing users retain 20 requests / 1800 characters daily.
-- Approved owner may be assigned an 80 request / 6000 character daily tier by an administrator.
-- Global hard safety caps: 120 requests, 12000 characters / UTC day, 10 requests / minute;
-- per-user rate: 3 requests / minute. Existing usage history is preserved.
alter table public.language_voice_access
  add column if not exists daily_request_limit integer not null default 20 check (daily_request_limit between 1 and 80);
alter table public.language_voice_access
  add column if not exists daily_char_limit integer not null default 1800 check (daily_char_limit between 100 and 6000);

create or replace function public.language_voice_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  approved boolean := false;
  day_cap integer := 20;
  char_cap integer := 1800;
  usr public.language_voice_usage%rowtype;
  glob public.language_voice_global_usage%rowtype;
begin
  if actor is null then return jsonb_build_object('enabled',false,'remaining',0,'globalRemaining',0); end if;
  select exists (
    select 1 from public.language_voice_access a
    join auth.users u on u.id=a.user_id
    where a.user_id=actor and a.enabled=true and u.email_confirmed_at is not null
  ) into approved;
  select a.daily_request_limit,a.daily_char_limit into day_cap,char_cap from public.language_voice_access a where a.user_id=actor and a.enabled=true;
  day_cap := coalesce(day_cap,20); char_cap := coalesce(char_cap,1800);
  select * into usr from public.language_voice_usage where user_id=actor and usage_day=(now() at time zone 'utc')::date;
  select * into glob from public.language_voice_global_usage where usage_day=(now() at time zone 'utc')::date;
  return jsonb_build_object(
    'enabled',approved,
    'remaining',case when approved then greatest(0,least(day_cap-coalesce(usr.requests,0),120-coalesce(glob.requests,0))) else 0 end,
    'dailyLimit',case when approved then day_cap else 0 end,
    'used',coalesce(usr.requests,0),
    'charsUsed',coalesce(usr.characters,0),
    'charsRemaining',case when approved then greatest(0,char_cap-coalesce(usr.characters,0)) else 0 end,
    'globalRemaining',greatest(0,120-coalesce(glob.requests,0)),
    'globalCharsRemaining',greatest(0,12000-coalesce(glob.characters,0)),
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
  day_cap integer := 20;
  char_cap integer := 1800;
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
  if p_chars is null or p_chars < 1 or p_chars > 500 then
    return jsonb_build_object('allowed',false,'reason','invalid_length');
  end if;
  select exists (
    select 1 from public.language_voice_access a
    join auth.users u on u.id=a.user_id
    where a.user_id=actor and a.enabled=true and u.email_confirmed_at is not null
  ) into approved;
  if not approved then return jsonb_build_object('allowed',false,'reason','not_authorized'); end if;
  select a.daily_request_limit,a.daily_char_limit into day_cap,char_cap from public.language_voice_access a where a.user_id=actor and a.enabled=true;
  day_cap := coalesce(day_cap,20); char_cap := coalesce(char_cap,1800);

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

  if my_calls >= day_cap or my_chars + p_chars > char_cap or global_calls >= 120 or global_chars + p_chars > 12000
     or minute_calls >= 3 or global_minute_calls >= 10 then
    return jsonb_build_object('allowed',false,'reason','quota_reached','remaining',greatest(0,least(day_cap-my_calls,120-global_calls)),'dailyLimit',day_cap);
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

  return jsonb_build_object('allowed',true,'remaining',greatest(0,least(day_cap-my_calls-1,119-global_calls)),'globalRemaining',119-global_calls,'dailyLimit',day_cap);
end $$;
revoke all on function public.language_voice_reserve(integer) from public, anon;
grant execute on function public.language_voice_reserve(integer) to authenticated;
