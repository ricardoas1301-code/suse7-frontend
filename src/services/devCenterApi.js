// ======================================================
// Dev Center — chamadas à API interna
// ======================================================

import { buildApiUrl, apiFetch } from "../config/api";

/**
 * @returns {Promise<{ ok: boolean; data?: any; error?: string; status: number }>}
 */
export async function devCenterBootstrap() {
  const url = buildApiUrl("/api/dev-center/bootstrap");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

/**
 * @returns {Promise<{ ok: boolean; data?: any; error?: string; status: number }>}
 */
export async function devCenterListMissions() {
  const url = buildApiUrl("/api/dev-center/missions");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

/**
 * @param {string} id
 */
export async function devCenterGetMission(id) {
  const url = buildApiUrl(`/api/dev-center/missions/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

/**
 * @param {object} payload
 */
export async function devCenterCreateMission(payload) {
  const url = buildApiUrl("/api/dev-center/missions");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body: payload });
}

/**
 * @param {string} id
 * @param {object} payload
 */
export async function devCenterPatchMission(id, payload) {
  const url = buildApiUrl(`/api/dev-center/missions/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "PATCH", body: payload });
}

/**
 * @param {string} missionId
 * @param {object} payload
 */
export async function devCenterPatchContext(missionId, payload) {
  const url = buildApiUrl(`/api/dev-center/missions/${encodeURIComponent(missionId)}/context`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "PATCH", body: payload });
}

/**
 * @param {string} missionId
 * @param {object} payload
 */
export async function devCenterPostDecision(missionId, payload) {
  const url = buildApiUrl(`/api/dev-center/missions/${encodeURIComponent(missionId)}/decisions`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body: payload });
}

/**
 * @param {string} decisionId
 * @param {object} payload
 */
export async function devCenterPatchDecision(decisionId, payload) {
  const url = buildApiUrl(`/api/dev-center/decisions/${encodeURIComponent(decisionId)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "PATCH", body: payload });
}

/**
 * @param {string} decisionId
 */
export async function devCenterDeleteDecision(decisionId) {
  const url = buildApiUrl(`/api/dev-center/decisions/${encodeURIComponent(decisionId)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "DELETE" });
}

/**
 * Salva missão + handoff + checklist em uma operação (histórico `save_all`).
 * @param {string} missionId
 * @param {object} body — { mission, context, next_steps }
 */
export async function devCenterSaveAll(missionId, body) {
  const url = buildApiUrl(`/api/dev-center/missions/${encodeURIComponent(missionId)}/save-all`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body });
}

/**
 * @param {string} missionId
 * @param {{ text: string }} payload
 */
export async function devCenterPostNextStep(missionId, payload) {
  const url = buildApiUrl(`/api/dev-center/missions/${encodeURIComponent(missionId)}/next-steps`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body: payload });
}

/**
 * @param {string} stepId
 * @param {object} payload
 */
export async function devCenterPatchNextStep(stepId, payload) {
  const url = buildApiUrl(`/api/dev-center/next-steps/${encodeURIComponent(stepId)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "PATCH", body: payload });
}

/**
 * @param {string} stepId
 */
export async function devCenterDeleteNextStep(stepId) {
  const url = buildApiUrl(`/api/dev-center/next-steps/${encodeURIComponent(stepId)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "DELETE" });
}

export async function devCenterGetDashboard() {
  const url = buildApiUrl("/api/dev-center/dashboard");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

export async function devCenterGetSellers() {
  const url = buildApiUrl("/api/dev-center/sellers");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

export async function devCenterGetSellerDetail(id) {
  const url = buildApiUrl(`/api/dev-center/sellers/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

/**
 * @param {string} sellerId
 * @param {{ actionId: string; reason: string; metadata?: Record<string, unknown> | null }} body
 */
export async function devCenterExecutarOperacaoAssinaturaSeller(sellerId, body) {
  const safeId = String(sellerId ?? "").trim();
  if (!safeId) return { ok: false, status: 400, error: "Seller inválido" };
  const url = buildApiUrl(
    `/api/dev-center/sellers/${encodeURIComponent(safeId)}/subscription/operations`,
  );
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body });
}

/**
 * @param {string} sellerId
 * @param {{ actionId: string; reason: string; metadata?: Record<string, unknown> | null }} body
 */
export async function devCenterExecutarOperacaoFeatureFlagSeller(sellerId, body) {
  const safeId = String(sellerId ?? "").trim();
  if (!safeId) return { ok: false, status: 400, error: "Seller inválido" };
  const url = buildApiUrl(
    `/api/dev-center/sellers/${encodeURIComponent(safeId)}/feature-flags/operations`,
  );
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body });
}

/**
 * @param {string} sellerId
 * @param {{ actionId: string; reason: string; metadata?: Record<string, unknown> | null }} body
 */
export async function devCenterExecutarOperacaoIntegracaoSeller(sellerId, body) {
  const safeId = String(sellerId ?? "").trim();
  if (!safeId) return { ok: false, status: 400, error: "Seller inválido" };
  const url = buildApiUrl(
    `/api/dev-center/sellers/${encodeURIComponent(safeId)}/integrations/operations`,
  );
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "POST", body });
}

export async function devCenterGetSubscriptions() {
  const url = buildApiUrl("/api/dev-center/subscriptions");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

export async function devCenterGetSubscriptionDetail(id) {
  const url = buildApiUrl(`/api/dev-center/subscriptions/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

export async function devCenterGetFinance() {
  const url = buildApiUrl("/api/dev-center/finance");
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

export async function devCenterGetFinanceDetail(id) {
  const url = buildApiUrl(`/api/dev-center/finance/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}

// Guardrail: domínio admin global — ver constants/customersDomainBoundary.js
export async function devCenterGetCustomersGlobal({ q = "" } = {}) {
  const base = buildApiUrl("/api/dev-center/customers-global");
  if (!base) return { ok: false, status: 0, error: "API não configurada" };
  const qs = new URLSearchParams();
  const qNorm = String(q ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 120)
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
  if (qNorm) qs.set("q", qNorm);
  return apiFetch(`${base}?${qs.toString()}`, { method: "GET" });
}

export async function devCenterGetCustomerGlobalDetail(id) {
  const safeId = String(id ?? "").trim();
  if (!safeId || safeId.length > 36) {
    return { ok: false, status: 400, error: "Identificador inválido" };
  }
  const url = buildApiUrl(`/api/dev-center/customers-global/${encodeURIComponent(safeId)}`);
  if (!url) return { ok: false, status: 0, error: "API não configurada" };
  return apiFetch(url, { method: "GET" });
}
