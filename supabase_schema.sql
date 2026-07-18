-- NOVA OS Database Schema
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text not null check (category in ('Beauty','Office','Tech','Lifestyle')),
  price numeric(12,2) not null default 0,
  commission numeric(12,2) not null default 0,
  affiliate_link text,
  status text not null default 'Testing' check (status in ('Testing','Active','Paused')),
  revenue numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  character text not null check (character in ('LUNA','MAYA','ETHAN','ARIA')),
  platform text not null,
  status text not null default 'Idea' check (status in ('Idea','Script','Production','Ready','Posted')),
  hook text,
  script text,
  caption text,
  views bigint not null default 0,
  clicks bigint not null default 0,
  revenue numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.contents enable row level security;

-- MVP policies: allow browser access using the publishable/anon key.
-- Suitable for a private prototype. Before public deployment, replace with Auth-based policies.
drop policy if exists "nova products select" on public.products;
drop policy if exists "nova products insert" on public.products;
drop policy if exists "nova products update" on public.products;
drop policy if exists "nova products delete" on public.products;
create policy "nova products select" on public.products for select to anon, authenticated using (true);
create policy "nova products insert" on public.products for insert to anon, authenticated with check (true);
create policy "nova products update" on public.products for update to anon, authenticated using (true) with check (true);
create policy "nova products delete" on public.products for delete to anon, authenticated using (true);

drop policy if exists "nova contents select" on public.contents;
drop policy if exists "nova contents insert" on public.contents;
drop policy if exists "nova contents update" on public.contents;
drop policy if exists "nova contents delete" on public.contents;
create policy "nova contents select" on public.contents for select to anon, authenticated using (true);
create policy "nova contents insert" on public.contents for insert to anon, authenticated with check (true);
create policy "nova contents update" on public.contents for update to anon, authenticated using (true) with check (true);
create policy "nova contents delete" on public.contents for delete to anon, authenticated using (true);

insert into public.products (name,brand,category,price,commission,status,revenue)
select 'กันแดดเนื้อเจล','NOVA Sample','Beauty',399,45,'Testing',0
where not exists (select 1 from public.products);

insert into public.contents (title,character,platform,status,hook)
select 'กันแดดตัวนี้ทำให้เมคอัพเยิ้มไหม?','LUNA','TikTok','Idea','หน้ามันระหว่างวันต้องดู'
where not exists (select 1 from public.contents);
