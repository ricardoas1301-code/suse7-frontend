-- ======================================================================
-- Migration: Corrigir UNIQUE parcial de is_primary para variant_key NULL
-- Em PostgreSQL, NULL = NULL é false, então (product_id, NULL) permitia
-- múltiplos primários. Usar COALESCE(variant_key, '__global__') resolve.
-- ======================================================================

-- 1) Dropar índices antigos
DROP INDEX IF EXISTS public.uq_product_image_links_primary_product;
DROP INDEX IF EXISTS public.uq_product_image_links_primary_draft;

-- 2) Recriar com COALESCE para cobrir escopo global (variant_key NULL)
CREATE UNIQUE INDEX uq_product_image_links_primary_product
  ON public.product_image_links(product_id, (COALESCE(variant_key, '__global__')))
  WHERE is_primary = true AND product_id IS NOT NULL;

CREATE UNIQUE INDEX uq_product_image_links_primary_draft
  ON public.product_image_links(draft_key, (COALESCE(variant_key, '__global__')))
  WHERE is_primary = true AND draft_key IS NOT NULL;
