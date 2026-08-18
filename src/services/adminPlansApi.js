// ======================================================
// API — Gestão Administrativa de Planos (Dev Center) — S1_3.7
// ------------------------------------------------------
// Service do FRONTEND para falar com o backend administrativo.
// O frontend NÃO acessa o Supabase diretamente: tudo passa pelas
// rotas admin /api/dev-center/admin/plans*.
//
// Auth (Bearer) é injetado automaticamente por apiFetch.
// Valores financeiros trafegam como string (sem float).
// ======================================================

import { buildApiUrl, apiFetch } from "../config/api";

const BASE = "/api/dev-center/admin/plans";

/**
 * Lista o catálogo de planos para administração.
 * @returns {Promise<{ ok: boolean; plans?: object[]; error?: string; status: number }>}
 */
export async function fetchAdminPlans() {
  const url = buildApiUrl(BASE);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return {
    ok: true,
    plans: Array.isArray(res.data?.plans) ? res.data.plans : [],
    status: res.status,
  };
}

/**
 * Atualiza um plano (nome, valor, limite, descrição, status, ordem).
 * @param {string} planId
 * @param {{ name?: string; price_monthly?: string; sales_limit_monthly?: number|null; description?: string; status?: string; sort_order?: number }} payload
 */
export async function saveAdminPlan(planId, payload) {
  const url = buildApiUrl(`${BASE}/${planId}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };

  const res = await apiFetch(url, { method: "PATCH", body: payload });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, plan: res.data?.plan ?? null, status: res.status };
}
