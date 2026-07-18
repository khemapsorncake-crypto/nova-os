-- NOVA OS v3.1 REAL
-- Run in Supabase SQL Editor. Safe to run repeatedly.
alter table public.contents add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.contents add column if not exists script text;
alter table public.contents add column if not exists caption text;
alter table public.contents add column if not exists storyboard jsonb not null default '[]'::jsonb;
alter table public.contents add column if not exists image_prompt text;
alter table public.contents add column if not exists video_prompt text;
alter table public.contents add column if not exists views bigint not null default 0;
alter table public.contents add column if not exists clicks bigint not null default 0;
alter table public.contents add column if not exists revenue numeric(12,2) not null default 0;
create index if not exists contents_status_idx on public.contents(status);
create index if not exists contents_product_id_idx on public.contents(product_id);
