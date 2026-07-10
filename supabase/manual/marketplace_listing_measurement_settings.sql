-- S1.24 — Pesos/medidas locais por anúncio (aplicação manual DEV/PROD)

-- Cole no SQL Editor do Supabase se a migration automática ainda não rodou.



create table if not exists public.marketplace_listing_measurement_settings (

  listing_id uuid primary key references public.marketplace_listings(id) on delete cascade,

  user_id uuid not null references auth.users(id) on delete cascade,

  shipping_width_cm numeric null,

  shipping_height_cm numeric null,

  shipping_length_cm numeric null,

  shipping_weight_kg numeric null,

  product_width_cm numeric null,

  product_height_cm numeric null,

  product_length_cm numeric null,

  product_weight_kg numeric null,

  source text null,

  updated_at timestamptz null,

  updated_by uuid null references auth.users(id)

);



create index if not exists idx_marketplace_listing_measurement_settings_user

  on public.marketplace_listing_measurement_settings(user_id);



alter table public.marketplace_listing_measurement_settings enable row level security;



drop policy if exists "marketplace_listing_measurement_settings_select_own"

  on public.marketplace_listing_measurement_settings;

create policy "marketplace_listing_measurement_settings_select_own"

  on public.marketplace_listing_measurement_settings

  for select

  using (auth.uid() = user_id);



drop policy if exists "marketplace_listing_measurement_settings_insert_own"

  on public.marketplace_listing_measurement_settings;

create policy "marketplace_listing_measurement_settings_insert_own"

  on public.marketplace_listing_measurement_settings

  for insert

  with check (auth.uid() = user_id);



drop policy if exists "marketplace_listing_measurement_settings_update_own"

  on public.marketplace_listing_measurement_settings;

create policy "marketplace_listing_measurement_settings_update_own"

  on public.marketplace_listing_measurement_settings

  for update

  using (auth.uid() = user_id)

  with check (auth.uid() = user_id);

