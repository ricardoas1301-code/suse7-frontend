-- ======================================================================
-- Migration: Notifications STOCK_LOW + min_stock_quantity
-- Tabela notifications com dedupe (1 ativa por escopo)
-- Colunas de estoque mínimo para monitoramento
-- ======================================================================

-- ----------------------------------------------------------------------
-- A) Tabela notifications
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID NULL,
  variant_key TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ NULL,
  resolved_at TIMESTAMPTZ NULL,
  CONSTRAINT fk_notifications_product
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Índice único parcial: 1 notificação ativa por (user_id, dedupe_key)
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_user_dedupe_active
  ON public.notifications(user_id, dedupe_key)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_resolved
  ON public.notifications(user_id, resolved_at)
  WHERE resolved_at IS NOT NULL;

-- ----------------------------------------------------------------------
-- B) Colunas min_stock_quantity (se não existirem)
-- ----------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'min_stock_quantity'
    ) THEN
      ALTER TABLE public.products ADD COLUMN min_stock_quantity INT4 NULL
        CHECK (min_stock_quantity IS NULL OR min_stock_quantity >= 0);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'min_stock_quantity'
    ) THEN
      ALTER TABLE public.product_variants ADD COLUMN min_stock_quantity INT4 NULL
        CHECK (min_stock_quantity IS NULL OR min_stock_quantity >= 0);
    END IF;
  END IF;
END $$;

-- ----------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;
CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
