-- ======================================================================
-- APLICAR MANUALMENTE no Supabase Dashboard > SQL Editor
-- Copie e cole este conteúdo completo, depois execute.
-- Migration: products.ad_titles (idempotente)
-- ======================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ad_titles jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.ad_titles IS
  'Lista de títulos do anúncio (até 10). Ex: [{"id":"uuid","value":"Título do anúncio"}]';
