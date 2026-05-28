// ============================================================
// API — histórico, detalhe, retry/cancel e resumo de roteamento (Fase 3)
// Somente leitura / comandos via backend — nenhum envio pelo frontend.
// ============================================================

import { buildApiUrl, apiFetch } from "../config/api";

/**
 * @param {{ ok: boolean; data?: any; error?: string; status: number }} res
 */
function unwrapApiPayload(res) {
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  const p = res.data;
  if (!p || typeof p !== "object") return { ok: false, error: "Resposta inválida", status: res.status };
  if (p.ok === false) return { ok: false, error: p.error ?? "Erro", status: res.status, ...p };
  return { ok: true, ...p, status: res.status };
}

/**
 * @param {Record<string, string | number | undefined | null>} params
 */
export async function fetchNotificationEvents(params = {}) {
  const qs = new URLSearchParams();
  const set = (k, v) => {
    if (v != null && String(v).trim() !== "") qs.set(k, String(v).trim());
  };
  set("page", params.page);
  set("page_size", params.page_size);
  set("notification_type", params.notification_type);
  set("marketplace_account_id", params.marketplace_account_id);
  set("severity", params.severity);
  set("delivery_status", params.delivery_status);
  set("entity_type", params.entity_type);
  set("entity_id", params.entity_id);
  set("created_from", params.created_from);
  set("created_to", params.created_to);
  set("notification_channel", params.notification_channel);
  const suffix = qs.toString() ? `?${qs}` : "";
  const url = buildApiUrl(`/api/notifications/events${suffix}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return unwrapApiPayload(await apiFetch(url, { method: "GET" }));
}

export async function fetchNotificationEventDetail(id) {
  const url = buildApiUrl(`/api/notifications/events/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return unwrapApiPayload(await apiFetch(url, { method: "GET" }));
}

export async function retryNotificationDelivery(id) {
  const url = buildApiUrl(`/api/notifications/deliveries/${encodeURIComponent(id)}/retry`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return unwrapApiPayload(await apiFetch(url, { method: "POST", body: {} }));
}

export async function cancelNotificationDelivery(id) {
  const url = buildApiUrl(`/api/notifications/deliveries/${encodeURIComponent(id)}/cancel`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return unwrapApiPayload(await apiFetch(url, { method: "POST", body: {} }));
}

/** Agregado por notification_type para badges em Preferências > Notificações */
export async function fetchNotificationRoutingSummary() {
  const url = buildApiUrl("/api/notifications/routing-summary");
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return unwrapApiPayload(await apiFetch(url, { method: "GET", unauthorizedFallback: { summary: {} } }));
}

/**
 * DEV / Dev Center apenas (backend valida).
 * @param {Record<string, unknown>} body
 */
export async function simulateNotificationDebug(body) {
  const url = buildApiUrl("/api/notifications/debug/simulate");
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return unwrapApiPayload(await apiFetch(url, { method: "POST", body }));
}
