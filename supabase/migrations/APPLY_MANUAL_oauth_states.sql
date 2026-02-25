-- ======================================================================
-- APLICAR MANUALMENTE no Supabase Dashboard > SQL Editor
-- Copie e cole este conteúdo completo, depois execute.
-- Migration: oauth_states (idempotente)
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  marketplace TEXT NOT NULL DEFAULT 'ml',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id
  ON public.oauth_states(user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at
  ON public.oauth_states(expires_at);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
