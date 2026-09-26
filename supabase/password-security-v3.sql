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


-- Atomic optimistic-concurrency sync. expected_version=0 creates the first vault.
create or replace function public.sync_password_vault(
  p_expected_version bigint,
  p_encrypted_record jsonb
)
returns table(version bigint, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'authentication_required';
  end if;

  if p_expected_version = 0 then
    insert into public.password_vaults(user_id, version, encrypted_record, updated_at)
    values (v_user, 1, p_encrypted_record, now())
    on conflict (user_id) do nothing;

    if found then
      return query
      select pv.version, pv.updated_at
      from public.password_vaults pv
      where pv.user_id = v_user;
      return;
    end if;
    raise exception 'vault_version_conflict';
  end if;

  update public.password_vaults
  set version = version + 1,
      encrypted_record = p_encrypted_record,
      updated_at = now()
  where user_id = v_user
    and version = p_expected_version;

  if not found then
    raise exception 'vault_version_conflict';
  end if;

  return query
  select pv.version, pv.updated_at
  from public.password_vaults pv
  where pv.user_id = v_user;
end;
$$;

revoke all on function public.sync_password_vault(bigint, jsonb) from public, anon;
grant execute on function public.sync_password_vault(bigint, jsonb) to authenticated;
