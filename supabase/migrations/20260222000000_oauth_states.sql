-- ======================================================================
-- Migration: Tabela oauth_states — state OAuth seguro por marketplace
-- Usado por /api/ml/connect e callback para CSRF protection.
-- Backend usa service_role (bypass RLS) para inserir/consultar.
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

-- RLS: backend usa service_role, não precisa de policies para acesso.
-- Políticas restritivas para evitar acesso via anon/authenticated.
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy: apenas service_role pode acessar (bypass RLS).
-- Isso garante que apenas o backend persista e consulte states.
