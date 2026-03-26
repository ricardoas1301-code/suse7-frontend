-- marketplace slug para múltiplos marketplaces no futuro (default: Mercado Livre)
ALTER TABLE public.ml_tokens
  ADD COLUMN IF NOT EXISTS marketplace text NOT NULL DEFAULT 'mercado_livre';

COMMENT ON COLUMN public.ml_tokens.marketplace IS 'Slug do marketplace, ex.: mercado_livre';
