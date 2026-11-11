-- Shared product catalog for manager entry and customer ordering.
-- Run after the business-auth schema has created public.employees.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'Water Refill',
  price_cents bigint not null check (price_cents >= 0),
  active boolean not null default true,
  image_url text,
  channels text[] not null default array['walk_in','online'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products alter column id set default gen_random_uuid();
alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;

create or replace function public.can_manage_products()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.employees e
    where e.auth_user_id = (select auth.uid())
      and e.primary_role = 'owner'
      and e.active is true
  );
$$;

revoke all on function public.can_manage_products() from public, anon;
grant execute on function public.can_manage_products() to authenticated;

drop policy if exists "products_read_online_catalog" on public.products;
create policy "products_read_online_catalog"
  on public.products for select to anon, authenticated
  using (active is true and 'online' = any(channels));

drop policy if exists "products_owner_read_all" on public.products;
create policy "products_owner_read_all"
  on public.products for select to authenticated
  using ((select public.can_manage_products()));

drop policy if exists "products_owner_insert" on public.products;
create policy "products_owner_insert"
  on public.products for insert to authenticated
  with check ((select public.can_manage_products()));

drop policy if exists "products_owner_update" on public.products;
create policy "products_owner_update"
  on public.products for update to authenticated
  using ((select public.can_manage_products()))
  with check ((select public.can_manage_products()));

-- Public product images; only active owners can upload or replace them.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product_images_owner_insert" on storage.objects;
create policy "product_images_owner_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.can_manage_products()));

drop policy if exists "product_images_owner_update" on storage.objects;
create policy "product_images_owner_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.can_manage_products()))
  with check (bucket_id = 'product-images' and (select public.can_manage_products()));
