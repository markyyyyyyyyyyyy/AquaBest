-- Staff sign-in profile table for Supabase Auth.
-- Supabase Auth stores password hashes in auth.users; this table stores only
-- the employee-to-auth-user link and the role assigned by an administrator.

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  primary_role text not null check (primary_role in ('owner', 'manager', 'staff', 'delivery')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Apply the auth link safely if the reference employees table already exists.
alter table public.employees
  add column if not exists auth_user_id uuid;

alter table public.employees
  alter column id set default gen_random_uuid();

create unique index if not exists employees_auth_user_id_uidx
  on public.employees (auth_user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'employees_auth_user_id_fkey'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table public.employees enable row level security;

revoke all on table public.employees from anon, authenticated;
grant select (id, auth_user_id, full_name, primary_role, active)
  on table public.employees to authenticated;

create or replace function public.is_active_business_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.employees e
    where e.auth_user_id = (select auth.uid())
      and e.primary_role = 'owner'
      and e.active is true
  );
$$;

revoke all on function public.is_active_business_owner() from public, anon;
grant execute on function public.is_active_business_owner() to authenticated;

drop policy if exists "employees_read_own_auth_profile" on public.employees;
drop policy if exists "employees_read_self_or_owner" on public.employees;
create policy "employees_read_self_or_owner"
  on public.employees
  for select
  to authenticated
  using (
    ((select auth.uid()) is not null and auth_user_id = (select auth.uid()))
    or (select public.is_active_business_owner())
  );

-- Provision employees out of band (Supabase Dashboard / trusted admin SQL).
-- Do not add public INSERT/UPDATE policies: employees cannot grant themselves
-- roles, reactivate their own accounts, or create Auth users from this client.
