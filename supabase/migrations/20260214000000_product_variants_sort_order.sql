-- ======================================================================
-- Migration: product_variants.sort_order (para drag vertical de variações)
-- Adiciona coluna sort_order se a tabela product_variants existir
-- ======================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'sort_order'
    ) THEN
      ALTER TABLE public.product_variants ADD COLUMN sort_order INT4 NOT NULL DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Índice para ordenação por produto (opcional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    CREATE INDEX IF NOT EXISTS idx_product_variants_product_sort
      ON public.product_variants(product_id, sort_order);
  END IF;
END $$;
