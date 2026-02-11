-- ======================================================================
-- Migration: Suporte a draft_key em product_image_links
-- Objetivo: permitir upload de imagens antes de salvar o produto
-- ======================================================================

-- 1) Adicionar colunas draft_key e user_id
ALTER TABLE product_image_links
  ADD COLUMN IF NOT EXISTS draft_key TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2) product_id passa a ser nullable (quando draft_key preenchido)
ALTER TABLE product_image_links
  ALTER COLUMN product_id DROP NOT NULL;

-- 3) CHECK: exatamente um de product_id OU draft_key
ALTER TABLE product_image_links
  DROP CONSTRAINT IF EXISTS chk_product_image_links_product_or_draft;

ALTER TABLE product_image_links
  ADD CONSTRAINT chk_product_image_links_product_or_draft
  CHECK (
    (product_id IS NOT NULL AND draft_key IS NULL)
    OR (product_id IS NULL AND draft_key IS NOT NULL)
  );

-- 4) Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_image_links_product_variant_sort
  ON product_image_links(product_id, variant_key, sort_order)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_image_links_draft_variant_sort
  ON product_image_links(draft_key, variant_key, sort_order)
  WHERE draft_key IS NOT NULL;

-- 5) UNIQUE parciais: apenas uma principal por escopo (DB-level)

-- Principal global (product)
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_image_links_primary_global_product
  ON product_image_links(product_id)
  WHERE product_id IS NOT NULL AND variant_key IS NULL AND is_primary = true;

-- Principal global (draft)
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_image_links_primary_global_draft
  ON product_image_links(draft_key)
  WHERE draft_key IS NOT NULL AND variant_key IS NULL AND is_primary = true;

-- Principal por variação (product)
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_image_links_primary_variant_product
  ON product_image_links(product_id, variant_key)
  WHERE product_id IS NOT NULL AND variant_key IS NOT NULL AND is_primary = true;

-- Principal por variação (draft)
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_image_links_primary_variant_draft
  ON product_image_links(draft_key, variant_key)
  WHERE draft_key IS NOT NULL AND variant_key IS NOT NULL AND is_primary = true;

-- 6) Backfill user_id para linhas existentes (ajuste conforme sua tabela products)
-- Se products tem user_id: UPDATE product_image_links pil SET user_id = p.user_id
--   FROM products p WHERE p.id = pil.product_id AND pil.user_id IS NULL;
-- Se não tiver, defina manualmente ou deixe NULL (RLS bloqueará até preencher)

-- 7) RLS: habilitar e políticas
ALTER TABLE product_image_links ENABLE ROW LEVEL SECURITY;

-- Política: SELECT — usuário vê apenas seus registros
DROP POLICY IF EXISTS product_image_links_select_own ON product_image_links;
CREATE POLICY product_image_links_select_own ON product_image_links
  FOR SELECT
  USING (user_id = auth.uid());

-- Política: INSERT — usuário cria apenas para si
DROP POLICY IF EXISTS product_image_links_insert_own ON product_image_links;
CREATE POLICY product_image_links_insert_own ON product_image_links
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Política: UPDATE — usuário atualiza apenas seus registros
DROP POLICY IF EXISTS product_image_links_update_own ON product_image_links;
CREATE POLICY product_image_links_update_own ON product_image_links
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política: DELETE — usuário remove apenas seus registros
DROP POLICY IF EXISTS product_image_links_delete_own ON product_image_links;
CREATE POLICY product_image_links_delete_own ON product_image_links
  FOR DELETE
  USING (user_id = auth.uid());
