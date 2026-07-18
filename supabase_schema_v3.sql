-- NOVA OS v3 Free Campaign Studio
-- Run this once in Supabase SQL Editor.

alter table public.contents add column if not exists image_prompt text;
alter table public.contents add column if not exists video_prompt text;
alter table public.contents add column if not exists storyboard text;
alter table public.contents add column if not exists campaign_name text;
alter table public.contents add column if not exists target_audience text;
alter table public.contents add column if not exists tone text;

create index if not exists contents_campaign_name_idx on public.contents(campaign_name);
