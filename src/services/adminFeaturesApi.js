// ======================================================
// API — Gestão Administrativa de Features Globais — S1_4
// ------------------------------------------------------
// Frontend não acessa Supabase: tudo via rotas admin do Dev Center.
// Auth (Bearer) injetado por apiFetch.
// ======================================================

import { buildApiUrl, apiFetch } from "../config/api";

const BASE = "/api/dev-center/admin/features";

/**
 * Carrega catálogo global de features + vínculos (scope=plan).
 * @returns {Promise<{ ok: boolean; features?: object[]; assignments?: object[]; degraded?: boolean; error?: string; status: number }>}
 */
export async function fetchAdminFeatures() {
  const url = buildApiUrl(BASE);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  const res = await apiFetch(url, { method: "GET" });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return {
    ok: true,
    features: Array.isArray(res.data?.features) ? res.data.features : [],
    assignments: Array.isArray(res.data?.assignments) ? res.data.assignments : [],
    degraded: Boolean(res.data?.degraded),
    status: res.status,
  };
}

/** Cria uma feature no catálogo. */
export async function createAdminFeature(payload) {
  const url = buildApiUrl(BASE);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  const res = await apiFetch(url, { method: "POST", body: payload });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, feature: res.data?.feature ?? null, status: res.status };
}

/** Atualiza uma feature (label/descrição/categoria/status/rollout/ordem). */
export async function saveAdminFeature(featureId, payload) {
  const url = buildApiUrl(`${BASE}/${featureId}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  const res = await apiFetch(url, { method: "PATCH", body: payload });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, feature: res.data?.feature ?? null, status: res.status };
}

/**
 * Define o vínculo feature × escopo (plano).
 * @param {string} featureId
 * @param {{ scope: string; scope_id: string | null; enabled: boolean }} payload
 */
export async function setAdminFeatureAssignment(featureId, payload) {
  const url = buildApiUrl(`${BASE}/${featureId}/assignments`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  const res = await apiFetch(url, { method: "PATCH", body: payload });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, assignment: res.data?.assignment ?? null, status: res.status };
}
