-- Comunidad Dinamarca: performance follow-up after foundation migration.
begin;

create index if not exists dk_reports_reporter
  on public.dk_reports(reporter_id, created_at desc);

drop policy if exists dk_profile_insert on public.dk_profiles;
create policy dk_profile_insert on public.dk_profiles
for insert to authenticated
with check (
  dk_private.dk_verified()
  and id = (select auth.uid())
);

drop policy if exists dk_profile_update on public.dk_profiles;
create policy dk_profile_update on public.dk_profiles
for update to authenticated
using (
  dk_private.dk_verified()
  and id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);

drop policy if exists dk_profile_delete on public.dk_profiles;
create policy dk_profile_delete on public.dk_profiles
for delete to authenticated
using (
  dk_private.dk_verified()
  and id = (select auth.uid())
);

drop policy if exists dk_posts_insert on public.dk_posts;
create policy dk_posts_insert on public.dk_posts
for insert to authenticated
with check (
  dk_private.dk_verified()
  and author_id = (select auth.uid())
  and exists (
    select 1
    from public.dk_profiles
    where id = (select auth.uid())
      and has_avatar
  )
);

drop policy if exists dk_posts_update on public.dk_posts;
create policy dk_posts_update on public.dk_posts
for update to authenticated
using (
  dk_private.dk_verified()
  and author_id = (select auth.uid())
)
with check (
  author_id = (select auth.uid())
);

drop policy if exists dk_posts_delete on public.dk_posts;
create policy dk_posts_delete on public.dk_posts
for delete to authenticated
using (
  dk_private.dk_verified()
  and (
    author_id = (select auth.uid())
    or dk_private.dk_admin()
  )
);

drop policy if exists dk_replies_insert on public.dk_replies;
create policy dk_replies_insert on public.dk_replies
for insert to authenticated
with check (
  dk_private.dk_verified()
  and author_id = (select auth.uid())
  and exists (
    select 1
    from public.dk_profiles
    where id = (select auth.uid())
      and has_avatar
  )
);

drop policy if exists dk_replies_delete on public.dk_replies;
create policy dk_replies_delete on public.dk_replies
for delete to authenticated
using (
  dk_private.dk_verified()
  and (
    author_id = (select auth.uid())
    or dk_private.dk_admin()
  )
);

drop policy if exists dk_reports_read on public.dk_reports;
create policy dk_reports_read on public.dk_reports
for select to authenticated
using (
  dk_private.dk_verified()
  and (
    reporter_id = (select auth.uid())
    or dk_private.dk_admin()
  )
);

drop policy if exists dk_reports_insert on public.dk_reports;
create policy dk_reports_insert on public.dk_reports
for insert to authenticated
with check (
  dk_private.dk_verified()
  and reporter_id = (select auth.uid())
);

commit;
