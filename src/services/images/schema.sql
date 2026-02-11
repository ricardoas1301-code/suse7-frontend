-- ======================================================================
-- Schema para image_assets e product_image_links (Supabase)
-- Execute no SQL Editor do Supabase para criar as tabelas e o bucket
-- ======================================================================

-- 1) Tabela image_assets
CREATE TABLE IF NOT EXISTS image_assets (
  id BIGSERIAL PRIMARY KEY,
  storage_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'image/jpeg',
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Tabela product_image_links (suporta product_id ou draft_key)
-- Ajuste REFERENCES products(id) conforme sua tabela products
CREATE TABLE IF NOT EXISTS product_image_links (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT,
  draft_key TEXT,
  user_id UUID REFERENCES auth.users(id),
  variant_key TEXT,
  asset_id BIGINT NOT NULL REFERENCES image_assets(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_product_image_links_product_or_draft
    CHECK (
      (product_id IS NOT NULL AND draft_key IS NULL)
      OR (product_id IS NULL AND draft_key IS NOT NULL)
    )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_image_links_product_variant_sort
  ON product_image_links(product_id, variant_key, sort_order) WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_image_links_draft_variant_sort
  ON product_image_links(draft_key, variant_key, sort_order) WHERE draft_key IS NOT NULL;

-- 3) Bucket no Storage (criar via Dashboard ou API)
-- Nome: product-images
-- Política: RLS conforme sua regra de negócio (ex: usuário só acessa seus arquivos)
