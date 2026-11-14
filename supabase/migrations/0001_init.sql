-- Registrari: initial schema.
--
-- Model: anyone with the link can READ (anon select), but every write goes
-- through a SECURITY DEFINER RPC that checks the shared 4-digit PIN.
-- Wrong PINs are logged and lock writes for 15 minutes after 8 failures.
-- RPCs return jsonb {ok, error?} instead of raising, so the attempt log
-- survives (a raise would roll it back).
--
-- Files (prescriptions, lab results) live in the private "documents" bucket.
-- Uploads/deletes are allowed only for paths with a live ticket, issued by a
-- PIN-checked RPC; storage policies check the ticket.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ── Tables ───────────────────────────────────────────────────────────────

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('water','meal','symptom','bowel','gas','medication','document')),
  occurred_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index entries_occurred_at_idx on public.entries (occurred_at desc);
create index entries_type_idx on public.entries (type, occurred_at desc);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table private.pin (
  id int primary key default 1 check (id = 1),
  hash text not null,
  updated_at timestamptz not null default now()
);

create table private.pin_attempts (
  at timestamptz not null default now(),
  ok boolean not null
);
create index pin_attempts_at_idx on private.pin_attempts (at desc);

create table private.file_tickets (
  path text not null,
  action text not null check (action in ('upload','delete')),
  expires_at timestamptz not null,
  primary key (path, action)
);

-- ── RLS + explicit grants ────────────────────────────────────────────────

alter table public.entries enable row level security;
alter table public.app_settings enable row level security;

create policy entries_read on public.entries for select to anon, authenticated using (true);
create policy settings_read on public.app_settings for select to anon, authenticated using (true);

revoke all on public.entries, public.app_settings from anon, authenticated;
grant select on public.entries, public.app_settings to anon, authenticated;

-- ── PIN helpers (private) ────────────────────────────────────────────────

-- Returns null when the PIN is fine, otherwise an error code.
create or replace function private.pin_error(p_pin text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_fails int;
begin
  select count(*) into v_fails
    from private.pin_attempts
   where not ok and at > now() - interval '15 minutes';
  if v_fails >= 8 then
    return 'locked';
  end if;

  select hash into v_hash from private.pin where id = 1;
  if v_hash is null then
    return 'no_pin';
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4}$'
     or extensions.crypt(p_pin, v_hash) <> v_hash then
    insert into private.pin_attempts (ok) values (false);
    return 'bad_pin';
  end if;

  -- Keep the log small: drop anything older than a day.
  delete from private.pin_attempts where at < now() - interval '1 day';
  return null;
end;
$$;

-- ── Public RPCs ──────────────────────────────────────────────────────────

create or replace function public.pin_status()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'has_pin', exists (select 1 from private.pin where id = 1),
    'locked', (select count(*) >= 8 from private.pin_attempts
                where not ok and at > now() - interval '15 minutes')
  );
$$;

create or replace function public.check_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_err text := private.pin_error(p_pin);
begin
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- First call (no PIN yet) sets it; later calls need the current PIN.
create or replace function public.set_pin(p_old text, p_new text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_err text;
begin
  if p_new is null or p_new !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;
  if exists (select 1 from private.pin where id = 1) then
    v_err := private.pin_error(p_old);
    if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  end if;
  insert into private.pin (id, hash, updated_at)
  values (1, extensions.crypt(p_new, extensions.gen_salt('bf')), now())
  on conflict (id) do update set hash = excluded.hash, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.save_entry(
  p_pin text, p_id uuid, p_type text, p_occurred_at timestamptz, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_err text := private.pin_error(p_pin);
  v_id uuid;
begin
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  insert into public.entries (id, type, occurred_at, data)
  values (coalesce(p_id, gen_random_uuid()), p_type, coalesce(p_occurred_at, now()), coalesce(p_data, '{}'::jsonb))
  on conflict (id) do update
    set type = excluded.type, occurred_at = excluded.occurred_at,
        data = excluded.data, updated_at = now()
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- Deletes the entry and returns delete tickets for its files, so the client
-- can remove them from storage.
create or replace function public.delete_entry(p_pin text, p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_err text := private.pin_error(p_pin);
  v_data jsonb;
  v_paths text[];
begin
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  delete from public.entries where id = p_id returning data into v_data;
  select coalesce(array_agg(f->>'path'), '{}') into v_paths
    from jsonb_array_elements(coalesce(v_data->'files', '[]'::jsonb)) f
   where f->>'path' is not null;
  insert into private.file_tickets (path, action, expires_at)
  select p, 'delete', now() + interval '10 minutes' from unnest(v_paths) p
  on conflict (path, action) do update set expires_at = excluded.expires_at;
  return jsonb_build_object('ok', true, 'paths', to_jsonb(v_paths));
end;
$$;

create or replace function public.save_setting(p_pin text, p_key text, p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_err text := private.pin_error(p_pin);
begin
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  insert into public.app_settings (key, value, updated_at) values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- Hands out one upload path (docs/<uuid>.<ext>) valid for 10 minutes.
create or replace function public.issue_upload(p_pin text, p_ext text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_err text := private.pin_error(p_pin);
  v_path text;
begin
  if v_err is not null then return jsonb_build_object('ok', false, 'error', v_err); end if;
  if p_ext !~ '^[a-z0-9]{1,5}$' then
    return jsonb_build_object('ok', false, 'error', 'bad_ext');
  end if;
  v_path := 'docs/' || gen_random_uuid() || '.' || p_ext;
  insert into private.file_tickets (path, action, expires_at)
  values (v_path, 'upload', now() + interval '10 minutes');
  delete from private.file_tickets where expires_at < now() - interval '1 day';
  return jsonb_build_object('ok', true, 'path', v_path);
end;
$$;

-- Used by the storage policies below.
create or replace function public.file_ticket_ok(p_path text, p_action text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.file_tickets
     where path = p_path and action = p_action and expires_at > now());
$$;

revoke all on function private.pin_error(text) from public, anon, authenticated;
revoke all on function public.pin_status() from public;
revoke all on function public.check_pin(text) from public;
revoke all on function public.set_pin(text, text) from public;
revoke all on function public.save_entry(text, uuid, text, timestamptz, jsonb) from public;
revoke all on function public.delete_entry(text, uuid) from public;
revoke all on function public.save_setting(text, text, jsonb) from public;
revoke all on function public.issue_upload(text, text) from public;
revoke all on function public.file_ticket_ok(text, text) from public;

grant execute on function public.pin_status() to anon, authenticated;
grant execute on function public.check_pin(text) to anon, authenticated;
grant execute on function public.set_pin(text, text) to anon, authenticated;
grant execute on function public.save_entry(text, uuid, text, timestamptz, jsonb) to anon, authenticated;
grant execute on function public.delete_entry(text, uuid) to anon, authenticated;
grant execute on function public.save_setting(text, text, jsonb) to anon, authenticated;
grant execute on function public.issue_upload(text, text) to anon, authenticated;
grant execute on function public.file_ticket_ok(text, text) to anon, authenticated;

-- ── Storage ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 20971520,
        array['image/jpeg','image/png','image/heic','image/heif','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy documents_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'documents');
create policy documents_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'documents' and public.file_ticket_ok(name, 'upload'));
create policy documents_delete on storage.objects for delete to anon, authenticated
  using (bucket_id = 'documents' and public.file_ticket_ok(name, 'delete'));

-- ── Defaults ─────────────────────────────────────────────────────────────

insert into public.app_settings (key, value) values ('config', jsonb_build_object(
  'patientName', '',
  'glassMl', 250,
  'waterGoalMl', 2000,
  'symptomCategories', jsonb_build_array(
    'abdominal_pain', 'bloating', 'nausea', 'reflux', 'cramps', 'fatigue', 'other'),
  'medications', '[]'::jsonb
)) on conflict (key) do nothing;
