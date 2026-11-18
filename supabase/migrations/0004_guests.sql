-- Registrari: guests. A person invited by e-mail can get in WITHOUT creating an
-- account: the app opens an anonymous Supabase session and the guest types the
-- e-mail the owner invited. Needs "Allow anonymous sign-ins" enabled in
-- Supabase (Authentication → Sign In / Providers).
--
-- Trade-off (by design): the invited e-mail is the only credential for a guest,
-- so the owner should invite addresses they trust. Shares already linked to a
-- real (Google) account can never be taken over this way; and the owner can
-- remove a guest at any time.
--
-- Safe to run again.

-- Attach an invitation to the current anonymous session.
create or replace function public.guest_join(p_email text)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_n integer;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    return 0;
  end if;
  update public.shares s set helper_id = auth.uid()
   where lower(s.helper_email) = lower(trim(coalesce(p_email, '')))
     and (s.helper_id is null
          or exists (select 1 from auth.users u where u.id = s.helper_id and u.is_anonymous));
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke all on function public.guest_join(text) from public, anon;
grant execute on function public.guest_join(text) to authenticated;

-- A helper (guest or not) can unlink themselves; the owner can still remove anyone.
drop policy if exists shares_delete on public.shares;
create policy shares_delete on public.shares for delete to authenticated
  using (owner_id = auth.uid() or helper_id = auth.uid());
