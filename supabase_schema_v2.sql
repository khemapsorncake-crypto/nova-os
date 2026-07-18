alter table public.contents add column if not exists caption text;
alter table public.contents add column if not exists script text;
alter table public.contents add column if not exists views bigint not null default 0;
alter table public.contents add column if not exists clicks bigint not null default 0;
alter table public.contents add column if not exists revenue numeric(12,2) not null default 0;
alter table public.contents add column if not exists product_id uuid references public.products(id) on delete set null;
create index if not exists contents_status_idx on public.contents(status);
create index if not exists contents_product_id_idx on public.contents(product_id);
create index if not exists products_status_idx on public.products(status);
