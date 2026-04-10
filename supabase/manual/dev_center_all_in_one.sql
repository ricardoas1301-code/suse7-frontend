-- =====================================================================
-- SUSE7 — Dev Center: script único para colar no SQL Editor do Supabase
-- (equivalente a rodar as duas migrations em ordem)
--
-- Uso:
--   Dashboard Supabase → SQL → New query → colar este arquivo → Run
--
-- Ou via CLI (recomendado): na pasta do frontend, `supabase db push`
--   migrations: 20260402120000_dev_center.sql
--              20260403120000_dev_center_v2_status_exec_history.sql
-- =====================================================================

-- ========== PARTE 1 / 2 — base Dev Center ===================================

CREATE TABLE IF NOT EXISTS public.dev_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'blocked', 'done', 'archived')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  module text,
  summary text,
  next_steps text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.dev_conversation_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.dev_missions (id) ON DELETE CASCADE,
  rico_text text,
  neo_text text,
  pedro_text text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dev_conversation_contexts_mission_unique UNIQUE (mission_id)
);

CREATE TABLE IF NOT EXISTS public.dev_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.dev_missions (id) ON DELETE CASCADE,
  decision_text text NOT NULL DEFAULT '',
  reason text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_decisions_mission_id ON public.dev_decisions (mission_id);
CREATE INDEX IF NOT EXISTS idx_dev_missions_updated_at ON public.dev_missions (updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_dev_missions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dev_missions_updated_at ON public.dev_missions;
CREATE TRIGGER trg_dev_missions_updated_at
  BEFORE UPDATE ON public.dev_missions
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_dev_missions_updated_at();

CREATE OR REPLACE FUNCTION public.touch_dev_mission_from_context()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.dev_missions SET updated_at = now() WHERE id = NEW.mission_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dev_context_touch_mission ON public.dev_conversation_contexts;
CREATE TRIGGER trg_dev_context_touch_mission
  AFTER INSERT OR UPDATE ON public.dev_conversation_contexts
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_dev_mission_from_context();

CREATE OR REPLACE FUNCTION public.touch_dev_mission_from_decision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  mid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    mid := OLD.mission_id;
  ELSE
    mid := NEW.mission_id;
  END IF;
  UPDATE public.dev_missions SET updated_at = now() WHERE id = mid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_dev_decision_touch_mission ON public.dev_decisions;
CREATE TRIGGER trg_dev_decision_touch_mission
  AFTER INSERT OR UPDATE OR DELETE ON public.dev_decisions
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_dev_mission_from_decision();

ALTER TABLE public.dev_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_decisions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.dev_missions IS 'Missões do Dev Center (Suse7 interno).';
COMMENT ON TABLE public.dev_conversation_contexts IS 'Handoff estruturado Rico / Neo / Pedro por missão.';
COMMENT ON TABLE public.dev_decisions IS 'Decisões registradas por missão (evolução futura: IA / histórico).';

-- ========== PARTE 2 / 2 — status v2, resumo executivo, checklist, histórico =====

ALTER TABLE public.dev_missions
  ADD COLUMN IF NOT EXISTS owner_email text,
  ADD COLUMN IF NOT EXISTS exec_objective text,
  ADD COLUMN IF NOT EXISTS exec_context text,
  ADD COLUMN IF NOT EXISTS exec_problem text,
  ADD COLUMN IF NOT EXISTS exec_where_stopped text;

UPDATE public.dev_missions
SET owner_email = COALESCE(owner_email, 'ricardo@suse7.com.br')
WHERE owner_email IS NULL OR trim(owner_email) = '';

ALTER TABLE public.dev_missions DROP CONSTRAINT IF EXISTS dev_missions_status_check;
ALTER TABLE public.dev_missions DROP CONSTRAINT IF EXISTS dev_missions_status_check_v2;

UPDATE public.dev_missions
SET status = CASE status
  WHEN 'draft' THEN 'nao_iniciada'
  WHEN 'active' THEN 'em_execucao'
  WHEN 'blocked' THEN 'em_analise'
  WHEN 'done' THEN 'concluida'
  WHEN 'archived' THEN 'arquivada'
  ELSE status
END;

UPDATE public.dev_missions
SET status = 'nao_iniciada'
WHERE status NOT IN (
  'nao_iniciada',
  'iniciada',
  'em_analise',
  'em_execucao',
  'em_validacao',
  'concluida',
  'arquivada'
);

ALTER TABLE public.dev_missions
  ADD CONSTRAINT dev_missions_status_check_v2
  CHECK (
    status IN (
      'nao_iniciada',
      'iniciada',
      'em_analise',
      'em_execucao',
      'em_validacao',
      'concluida',
      'arquivada'
    )
  );

CREATE TABLE IF NOT EXISTS public.dev_next_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.dev_missions (id) ON DELETE CASCADE,
  text text NOT NULL DEFAULT '',
  is_done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dev_next_steps_mission ON public.dev_next_steps (mission_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dev_missions' AND column_name = 'next_steps'
  ) THEN
    INSERT INTO public.dev_next_steps (mission_id, text, is_done, sort_order)
    SELECT
      m.id,
      trim(line.line),
      false,
      line.ord
    FROM public.dev_missions m
    CROSS JOIN LATERAL unnest(string_to_array(coalesce(m.next_steps, ''), E'\n')) WITH ORDINALITY AS line(line, ord)
    WHERE trim(coalesce(line.line, '')) <> '';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dev_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.dev_missions (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dev_history_mission_created ON public.dev_history (mission_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_dev_mission_from_next_step()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  mid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    mid := OLD.mission_id;
  ELSE
    mid := NEW.mission_id;
  END IF;
  UPDATE public.dev_missions SET updated_at = now() WHERE id = mid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_dev_next_step_touch_mission ON public.dev_next_steps;
CREATE TRIGGER trg_dev_next_step_touch_mission
  AFTER INSERT OR UPDATE OR DELETE ON public.dev_next_steps
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_dev_mission_from_next_step();

ALTER TABLE public.dev_next_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_history ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.dev_missions.owner_email IS 'Responsável / owner (MVP: ricardo@suse7.com.br).';
COMMENT ON TABLE public.dev_next_steps IS 'Checklist de próximos passos por missão.';
COMMENT ON TABLE public.dev_history IS 'Histórico de eventos (status, saves, decisões).';
