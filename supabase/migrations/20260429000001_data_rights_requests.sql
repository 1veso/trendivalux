-- GDPR data-rights queue. Public endpoint /api/data-rights/request inserts
-- rows here with status='pending'; the founder fulfils them manually within
-- 30 days per GDPR Art. 12(3).
--
-- Note: this migration must be applied to Supabase manually via the SQL
-- Editor (https://supabase.com/dashboard/project/zpcyughajhwvmqxgvcpy/sql/new)
-- because the project does not have automated migrations wired up yet.

create table public.data_rights_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  request_type text not null check (request_type in ('access', 'deletion')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'rejected')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  fulfilled_by text,
  notes text
);

create index idx_data_rights_email on public.data_rights_requests(email);
create index idx_data_rights_status on public.data_rights_requests(status);

alter table public.data_rights_requests enable row level security;

-- Only the service role can read or write. The endpoint uses the service-role
-- key to insert; the anon/auth roles have no access. Founders read via the
-- Supabase dashboard while logged in (Supabase studio bypasses RLS).
create policy "Service role full access" on public.data_rights_requests
  for all using (auth.role() = 'service_role');
