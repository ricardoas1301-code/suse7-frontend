-- ======================================================================
-- Migration: Coluna ad_titles na tabela products
-- Lista de títulos do anúncio (até 10). Formato: [{id, value}]
-- ======================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'ad_titles'
    ) THEN
      ALTER TABLE public.products
        ADD COLUMN ad_titles jsonb NOT NULL DEFAULT '[]'::jsonb;

      COMMENT ON COLUMN public.products.ad_titles IS
        'Lista de títulos do anúncio (até 10). Ex: [{"id":"uuid","value":"Título do anúncio"}]';
    END IF;
  END IF;
END $$;
