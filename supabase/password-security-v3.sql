-- StanNet Password Security 3.0
-- Multi-device encrypted vault schema.
-- Server stores ciphertext only; plaintext credentials and master password never belong here.

create table if not exists public.password_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 1 check (version > 0),
  encrypted_record jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.password_devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  platform text not null default 'unknown' check (char_length(platform) <= 80),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists password_devices_user_id_idx on public.password_devices(user_id);
create index if not exists password_devices_active_idx on public.password_devices(user_id, revoked_at);

alter table public.password_vaults enable row level security;
alter table public.password_devices enable row level security;

revoke all on table public.password_vaults from anon, authenticated;
revoke all on table public.password_devices from anon, authenticated;
grant select, insert, update on table public.password_vaults to authenticated;
grant select, insert, update, delete on table public.password_devices to authenticated;

drop policy if exists "vault select own" on public.password_vaults;
create policy "vault select own"
on public.password_vaults for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "vault insert own" on public.password_vaults;
create policy "vault insert own"
on public.password_vaults for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "vault update own" on public.password_vaults;
create policy "vault update own"
on public.password_vaults for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "devices select own" on public.password_devices;
create policy "devices select own"
on public.password_devices for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "devices insert own" on public.password_devices;
create policy "devices insert own"
on public.password_devices for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "devices update own" on public.password_devices;
create policy "devices update own"
on public.password_devices for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "devices delete own" on public.password_devices;
create policy "devices delete own"
on public.password_devices for delete
to authenticated
using ((select auth.uid()) = user_id);
