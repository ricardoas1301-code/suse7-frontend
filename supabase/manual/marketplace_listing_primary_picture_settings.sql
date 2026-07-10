-- S1.21 — Imagem principal/capa por anúncio (aplicação manual DEV/PROD)
-- Cole no SQL Editor do Supabase se a migration automática ainda não rodou.

create table if not exists public.marketplace_listing_primary_picture_settings (
  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_picture_id text null,
  primary_picture_url text null,
  ordered_picture_keys jsonb null,
  updated_at timestamptz null,
  updated_by uuid null references auth.users(id)
);

alter table public.marketplace_listing_primary_picture_settings
  add column if not exists ordered_picture_keys jsonb null;

create index if not exists idx_marketplace_listing_primary_picture_settings_user
  on public.marketplace_listing_primary_picture_settings(user_id);

alter table public.marketplace_listing_primary_picture_settings enable row level security;

drop policy if exists "marketplace_listing_primary_picture_settings_select_own"
  on public.marketplace_listing_primary_picture_settings;
create policy "marketplace_listing_primary_picture_settings_select_own"
  on public.marketplace_listing_primary_picture_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "marketplace_listing_primary_picture_settings_insert_own"
  on public.marketplace_listing_primary_picture_settings;
create policy "marketplace_listing_primary_picture_settings_insert_own"
  on public.marketplace_listing_primary_picture_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "marketplace_listing_primary_picture_settings_update_own"
  on public.marketplace_listing_primary_picture_settings;
create policy "marketplace_listing_primary_picture_settings_update_own"
  on public.marketplace_listing_primary_picture_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
