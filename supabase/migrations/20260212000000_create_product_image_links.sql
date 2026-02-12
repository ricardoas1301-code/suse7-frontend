-- ======================================================================
-- Migration: Criar tabela public.product_image_links
-- Tabela única com metadata de imagens (sem image_assets separada)
-- Suporta Draft + Relink com RLS
-- ======================================================================

-- 1) Tabela product_image_links
CREATE TABLE public.product_image_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  product_id UUID NULL REFERENCES public.products(id) ON DELETE CASCADE,
  draft_key TEXT NULL,
  variant_key TEXT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NULL,
  mime_type TEXT NULL,
  size_bytes BIGINT NULL,
  width INT4 NULL,
  height INT4 NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INT4 NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_product_image_links_product_or_draft
    CHECK (
      (product_id IS NOT NULL AND draft_key IS NULL)
      OR (product_id IS NULL AND draft_key IS NOT NULL)
    )
);

-- 2) Índices
CREATE INDEX idx_product_image_links_product_variant_sort
  ON public.product_image_links(product_id, variant_key, sort_order)
  WHERE product_id IS NOT NULL;

CREATE INDEX idx_product_image_links_draft_variant_sort
  ON public.product_image_links(draft_key, variant_key, sort_order)
  WHERE draft_key IS NOT NULL;

CREATE INDEX idx_product_image_links_user_id
  ON public.product_image_links(user_id);

-- 3) UNIQUE parciais: 1 primary por escopo (COALESCE garante variant_key NULL)
CREATE UNIQUE INDEX uq_product_image_links_primary_product
  ON public.product_image_links(product_id, (COALESCE(variant_key, '__global__')))
  WHERE is_primary = true AND product_id IS NOT NULL;

CREATE UNIQUE INDEX uq_product_image_links_primary_draft
  ON public.product_image_links(draft_key, (COALESCE(variant_key, '__global__')))
  WHERE is_primary = true AND draft_key IS NOT NULL;

-- 4) Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_image_links_updated_at
  BEFORE UPDATE ON public.product_image_links
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- 5) RLS
ALTER TABLE public.product_image_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_image_links_select_own ON public.product_image_links
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY product_image_links_insert_own ON public.product_image_links
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY product_image_links_update_own ON public.product_image_links
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY product_image_links_delete_own ON public.product_image_links
  FOR DELETE USING (user_id = auth.uid());
