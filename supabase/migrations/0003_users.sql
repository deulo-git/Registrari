-- Registrari v1.0: one account per person (Google sign-in) instead of the
-- shared link + PIN. Every record belongs to an owner; the owner can give
-- "helpers" access at three levels:
--   full     unlimited: everything the owner can do except managing helpers
--   edit     view, add, edit and delete records (no settings)
--   limited  view only, and only the record types the owner picks
--
-- Existing data (owner_id is null) stays hidden until the first person who
-- finishes sign-up claims it with public.claim_legacy().

-- ── Profiles ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text not null,
  last_name text not null default '',
  birth_date date,
  weight_kg numeric(5, 1),
  height_cm numeric(5, 1),
  /** { species, name, personalized, sliders: {energy, affection, mischief, chatty}, answers: {...} } */
  pet jsonb not null default '{}'::jsonb,
  /** Same shape as the old app_settings 'config' row. */
  config jsonb not null default '{}'::jsonb,
  /** True for the profile that claimed the data that existed before accounts. */
  legacy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_one_legacy on public.profiles (legacy) where legacy;

create table public.shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  helper_email text not null,
  helper_id uuid references auth.users (id) on delete cascade,
  level text not null check (level in ('full', 'edit', 'limited')),
  /** For 'limited': the entry types the helper may see (empty = none). */
  types text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (owner_id, helper_email)
);
create index shares_helper_idx on public.shares (helper_id);
create index shares_email_idx on public.shares (lower(helper_email));

alter table public.entries add column owner_id uuid references public.profiles (id) on delete cascade;
create index entries_owner_idx on public.entries (owner_id, occurred_at desc);

-- ── Access helpers ───────────────────────────────────────────────────────

create or replace function public.can_read(p_owner uuid, p_type text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_owner is not null and (
    p_owner = auth.uid()
    or exists (
      select 1 from public.shares s
       where s.owner_id = p_owner and s.helper_id = auth.uid()
         and (s.level in ('full', 'edit') or (s.level = 'limited' and p_type = any (s.types)))
    )
  );
$$;

create or replace function public.can_write(p_owner uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_owner is not null and (
    p_owner = auth.uid()
    or exists (
      select 1 from public.shares s
       where s.owner_id = p_owner and s.helper_id = auth.uid() and s.level in ('full', 'edit')
    )
  );
$$;

-- Settings and profile: the owner and "full" helpers.
create or replace function public.can_admin(p_owner uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_owner is not null and (
    p_owner = auth.uid()
    or exists (
      select 1 from public.shares s
       where s.owner_id = p_owner and s.helper_id = auth.uid() and s.level = 'full'
    )
  );
$$;

-- Files live under <owner id>/<uuid>.<ext>; old ones under docs/.
create or replace function public.path_owner(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case when (string_to_array(p_name, '/'))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then ((string_to_array(p_name, '/'))[1])::uuid end;
$$;

create or replace function public.can_read_file(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_name like 'docs/%' then exists (
      select 1 from public.profiles p where p.legacy and public.can_read(p.id, 'document'))
    else public.can_read(public.path_owner(p_name), 'document')
  end;
$$;

create or replace function public.can_write_file(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_name like 'docs/%' then exists (
      select 1 from public.profiles p where p.legacy and public.can_write(p.id))
    else public.can_write(public.path_owner(p_name))
  end;
$$;

-- When a helper signs in, attach the invitations sent to their e-mail.
create or replace function public.link_shares()
returns void language sql security definer set search_path = '' as $$
  update public.shares set helper_id = auth.uid()
   where helper_id is null and lower(helper_email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- The first profile to ask takes everything saved before accounts existed.
create or replace function public.claim_legacy()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cfg jsonb;
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where id = auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'no_profile');
  end if;
  if exists (select 1 from public.profiles where legacy) then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;
  select value into v_cfg from public.app_settings where key = 'config';
  update public.entries set owner_id = auth.uid() where owner_id is null;
  update public.profiles set legacy = true, config = coalesce(v_cfg, '{}'::jsonb), updated_at = now()
   where id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;

-- ── Row level security ───────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.shares enable row level security;

drop policy if exists entries_read on public.entries;
drop policy if exists settings_read on public.app_settings;
revoke all on public.entries, public.app_settings, public.profiles, public.shares from anon, authenticated;
grant select, insert, update, delete on public.entries, public.profiles, public.shares to authenticated;

create policy entries_select on public.entries for select to authenticated using (public.can_read(owner_id, type));
create policy entries_insert on public.entries for insert to authenticated with check (public.can_write(owner_id));
create policy entries_update on public.entries for update to authenticated
  using (public.can_write(owner_id)) with check (public.can_write(owner_id));
create policy entries_delete on public.entries for delete to authenticated using (public.can_write(owner_id));

create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (select 1 from public.shares s where s.owner_id = profiles.id and s.helper_id = auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (public.can_admin(id)) with check (public.can_admin(id));

create policy shares_select on public.shares for select to authenticated
  using (owner_id = auth.uid() or helper_id = auth.uid());
create policy shares_insert on public.shares for insert to authenticated with check (owner_id = auth.uid());
create policy shares_update on public.shares for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy shares_delete on public.shares for delete to authenticated using (owner_id = auth.uid());

-- ── Storage ──────────────────────────────────────────────────────────────

drop policy if exists documents_read on storage.objects;
drop policy if exists documents_upload on storage.objects;
drop policy if exists documents_delete on storage.objects;
create policy documents_read on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.can_read_file(name));
create policy documents_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_write_file(name));
create policy documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.can_write_file(name));

-- ── Retire the PIN ───────────────────────────────────────────────────────

drop function if exists public.pin_status();
drop function if exists public.check_pin(text);
drop function if exists public.set_pin(text, text);
drop function if exists public.save_entry(text, uuid, text, timestamptz, jsonb);
drop function if exists public.delete_entry(text, uuid);
drop function if exists public.save_setting(text, text, jsonb);
drop function if exists public.issue_upload(text, text);
drop function if exists public.file_ticket_ok(text, text);
drop function if exists private.pin_error(text);
drop table if exists private.pin, private.pin_attempts, private.file_tickets;

revoke all on function public.can_read(uuid, text), public.can_write(uuid), public.can_admin(uuid),
  public.can_read_file(text), public.can_write_file(text), public.link_shares(), public.claim_legacy()
  from public, anon;
grant execute on function public.can_read(uuid, text), public.can_write(uuid), public.can_admin(uuid),
  public.can_read_file(text), public.can_write_file(text), public.link_shares(), public.claim_legacy()
  to authenticated;
