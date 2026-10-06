-- Comunidad Dinamarca: isolated tables; never alters existing app tables/auth users.
begin;
create table if not exists public.dk_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 70),
 city text not null check(city in ('Copenhague','Aarhus','Odense','Aalborg','Vejle','Kolding','Fredericia','Horsens','Otra ciudad','Todavía fuera de Dinamarca')),
 bio text not null default '' check(char_length(bio)<=500),
 avatar text check(avatar is null or (char_length(avatar)<=240040 and avatar ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$')),
 has_avatar boolean not null default false,
 created_at timestamptz not null default now(),
 constraint dk_avatar_consistent check(has_avatar=(avatar is not null))
);
create table if not exists public.dk_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null constraint dk_posts_author_id_fkey references public.dk_profiles(id) on delete cascade,
 topic text not null check(topic in ('vivienda','trabajo','tramites','estudios','ciudades','comunidad')),
 city text not null check(city in ('Copenhague','Aarhus','Odense','Aalborg','Vejle','Kolding','Fredericia','Horsens','Otra ciudad','Todavía fuera de Dinamarca')),
 title text not null check(char_length(title) between 5 and 140),
 body text not null check(char_length(body) between 10 and 5000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.dk_replies (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.dk_posts(id) on delete cascade,
 author_id uuid not null constraint dk_replies_author_id_fkey references public.dk_profiles(id) on delete cascade,
 body text not null check(char_length(body) between 2 and 2000),created_at timestamptz not null default now()
);
create table if not exists public.dk_reports (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.dk_posts(id) on delete cascade,
 reporter_id uuid not null references public.dk_profiles(id) on delete cascade,
 reason text not null check(char_length(reason) between 5 and 500),created_at timestamptz not null default now(),
 unique(post_id,reporter_id)
);
create index if not exists dk_posts_feed on public.dk_posts(created_at desc,id desc);
create index if not exists dk_posts_topic_city on public.dk_posts(topic,city,created_at desc);
create index if not exists dk_posts_author on public.dk_posts(author_id,created_at);
create index if not exists dk_replies_thread on public.dk_replies(post_id,created_at,id);
create index if not exists dk_replies_author on public.dk_replies(author_id,created_at);

create or replace function public.dk_verified() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=(select auth.uid()) and email_confirmed_at is not null);
$$;
create or replace function public.dk_admin() returns boolean language sql stable set search_path='' as $$
 select public.dk_verified() and coalesce((auth.jwt()->'app_metadata'->>'community_admin')='true',false);
$$;
revoke all on function public.dk_verified(),public.dk_admin() from public,anon;
grant execute on function public.dk_verified(),public.dk_admin() to authenticated;

alter table public.dk_profiles enable row level security;
alter table public.dk_posts enable row level security;
alter table public.dk_replies enable row level security;
alter table public.dk_reports enable row level security;
revoke all on public.dk_profiles,public.dk_posts,public.dk_replies,public.dk_reports from anon,authenticated;
grant select on public.dk_profiles,public.dk_posts,public.dk_replies,public.dk_reports to authenticated;
grant insert(id,display_name,city,bio,avatar,has_avatar) on public.dk_profiles to authenticated;
grant update(display_name,city,bio,avatar,has_avatar) on public.dk_profiles to authenticated;
grant delete on public.dk_profiles to authenticated;
grant insert(author_id,topic,city,title,body) on public.dk_posts to authenticated;
grant update(topic,city,title,body) on public.dk_posts to authenticated;
grant delete on public.dk_posts to authenticated;
grant insert(post_id,author_id,body) on public.dk_replies to authenticated;
grant delete on public.dk_replies to authenticated;
grant insert(post_id,reporter_id,reason) on public.dk_reports to authenticated;

create policy dk_profile_read on public.dk_profiles for select to authenticated using(public.dk_verified());
create policy dk_profile_insert on public.dk_profiles for insert to authenticated with check(public.dk_verified() and id=auth.uid());
create policy dk_profile_update on public.dk_profiles for update to authenticated using(public.dk_verified() and id=auth.uid()) with check(id=auth.uid());
create policy dk_profile_delete on public.dk_profiles for delete to authenticated using(public.dk_verified() and id=auth.uid());
create policy dk_posts_read on public.dk_posts for select to authenticated using(public.dk_verified());
create policy dk_posts_insert on public.dk_posts for insert to authenticated with check(public.dk_verified() and author_id=auth.uid() and exists(select 1 from public.dk_profiles where id=auth.uid() and has_avatar));
create policy dk_posts_update on public.dk_posts for update to authenticated using(public.dk_verified() and author_id=auth.uid()) with check(author_id=auth.uid());
create policy dk_posts_delete on public.dk_posts for delete to authenticated using(public.dk_verified() and (author_id=auth.uid() or public.dk_admin()));
create policy dk_replies_read on public.dk_replies for select to authenticated using(public.dk_verified());
create policy dk_replies_insert on public.dk_replies for insert to authenticated with check(public.dk_verified() and author_id=auth.uid() and exists(select 1 from public.dk_profiles where id=auth.uid() and has_avatar));
create policy dk_replies_delete on public.dk_replies for delete to authenticated using(public.dk_verified() and (author_id=auth.uid() or public.dk_admin()));
create policy dk_reports_read on public.dk_reports for select to authenticated using(public.dk_verified() and (reporter_id=auth.uid() or public.dk_admin()));
create policy dk_reports_insert on public.dk_reports for insert to authenticated with check(public.dk_verified() and reporter_id=auth.uid());

create or replace function public.dk_content_guard() returns trigger language plpgsql security definer set search_path='' as $$
 declare last_time timestamptz; daily_count integer;
 begin
  if new.author_id is distinct from auth.uid() then raise exception 'row-level security: author mismatch' using errcode='42501';end if;
  perform pg_advisory_xact_lock(hashtextextended(new.author_id::text,0));
  if tg_table_name='dk_posts' then
   select max(created_at),count(*) into last_time,daily_count from public.dk_posts where author_id=new.author_id and created_at>now()-interval '1 day';
   if last_time>now()-interval '30 seconds' or daily_count>=20 then raise exception 'community_rate_limit' using errcode='P0001';end if;
  else
   select max(created_at),count(*) into last_time,daily_count from public.dk_replies where author_id=new.author_id and created_at>now()-interval '1 day';
   if last_time>now()-interval '10 seconds' or daily_count>=100 then raise exception 'community_rate_limit' using errcode='P0001';end if;
  end if;
  return new;
 end;
$$;
create trigger dk_post_guard before insert on public.dk_posts for each row execute function public.dk_content_guard();
create trigger dk_reply_guard before insert on public.dk_replies for each row execute function public.dk_content_guard();
create or replace function public.dk_touch_post() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end;$$;
create trigger dk_post_updated before update on public.dk_posts for each row execute function public.dk_touch_post();
revoke all on function public.dk_content_guard(),public.dk_touch_post() from public,anon,authenticated;
commit;
