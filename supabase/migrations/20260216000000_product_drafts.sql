-- ======================================================================
-- Migration: Tabela product_drafts — metadados de rascunhos (product_name, seo_keywords)
-- Usada para persistir dados de rascunhos antes de salvar o produto
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.product_drafts (
  draft_key TEXT NOT NULL,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  product_name TEXT NOT NULL DEFAULT '',
  seo_keywords TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (draft_key, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_drafts_user_id ON public.product_drafts(user_id);

ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_drafts_select_own ON public.product_drafts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY product_drafts_insert_own ON public.product_drafts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY product_drafts_update_own ON public.product_drafts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY product_drafts_delete_own ON public.product_drafts
  FOR DELETE USING (user_id = auth.uid());

-- Trigger updated_at
CREATE TRIGGER product_drafts_updated_at
  BEFORE UPDATE ON public.product_drafts
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();
