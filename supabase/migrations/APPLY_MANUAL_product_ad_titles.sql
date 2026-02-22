-- ======================================================================
-- APLICAR MANUALMENTE no Supabase Dashboard > SQL Editor
-- Copie e cole este conteúdo completo, depois execute.
-- Migration: product_ad_titles (idempotente)
-- ======================================================================

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.product_ad_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_normalized TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_product_ad_titles_product
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  CONSTRAINT uq_product_ad_titles_user_product_normalized
    UNIQUE (user_id, product_id, title_normalized)
);

CREATE INDEX IF NOT EXISTS idx_product_ad_titles_product_id
  ON public.product_ad_titles(product_id);

CREATE INDEX IF NOT EXISTS idx_product_ad_titles_user_id
  ON public.product_ad_titles(user_id);

-- 2) Funções e triggers
CREATE OR REPLACE FUNCTION public.sync_product_ad_titles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_product_ad_titles_updated_at ON public.product_ad_titles;
CREATE TRIGGER tr_product_ad_titles_updated_at
  BEFORE UPDATE ON public.product_ad_titles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_product_ad_titles_updated_at();

CREATE OR REPLACE FUNCTION public.normalize_ad_title(val TEXT)
RETURNS TEXT AS $$
BEGIN
  IF val IS NULL OR TRIM(val) = '' THEN
    RETURN NULL;
  END IF;
  RETURN LOWER(TRIM(REGEXP_REPLACE(val, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.sync_product_ad_titles_title_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.title_normalized := public.normalize_ad_title(NEW.title);
  IF NEW.title_normalized IS NULL OR NEW.title_normalized = '' THEN
    RAISE EXCEPTION 'title não pode ser vazio';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_product_ad_titles_title_normalized ON public.product_ad_titles;
CREATE TRIGGER tr_product_ad_titles_title_normalized
  BEFORE INSERT OR UPDATE OF title ON public.product_ad_titles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_product_ad_titles_title_normalized();

-- 3) RLS
ALTER TABLE public.product_ad_titles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_ad_titles_select_own ON public.product_ad_titles;
CREATE POLICY product_ad_titles_select_own ON public.product_ad_titles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS product_ad_titles_insert_own ON public.product_ad_titles;
CREATE POLICY product_ad_titles_insert_own ON public.product_ad_titles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS product_ad_titles_update_own ON public.product_ad_titles;
CREATE POLICY product_ad_titles_update_own ON public.product_ad_titles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS product_ad_titles_delete_own ON public.product_ad_titles;
CREATE POLICY product_ad_titles_delete_own ON public.product_ad_titles
  FOR DELETE USING (user_id = auth.uid());
