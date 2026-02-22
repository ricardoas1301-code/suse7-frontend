-- ======================================================================
-- APLICAR MANUALMENTE no Supabase Dashboard > SQL Editor
-- Migration: product status (idempotente)
-- ======================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status'
    ) THEN
      ALTER TABLE public.products
        ADD COLUMN status TEXT NOT NULL DEFAULT 'draft';

      ALTER TABLE public.products
        ADD CONSTRAINT chk_products_status
        CHECK (status IN ('draft', 'ready', 'published', 'blocked'));

      CREATE INDEX IF NOT EXISTS idx_products_user_status
        ON public.products(user_id, status);
    END IF;
  END IF;
END $$;
