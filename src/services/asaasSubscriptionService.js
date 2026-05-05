// ======================================================================
// SUSE7 — Asaas Subscription Service (frontend adapter)
// IMPORTANTE:
// - Não expor API key do Asaas no frontend.
// - Toda integração real com Asaas deve ocorrer no backend Suse7.
// - Este adapter consome apenas endpoints internos autenticados.
//
// Backend futuro (referência de persistência):
// - user_subscriptions:
//   id, user_id, plan_key, status, provider, provider_customer_id, provider_subscription_id,
//   trial_started_at, trial_ends_at, current_period_started_at, current_period_ends_at,
//   monthly_sales_limit, created_at, updated_at
// - user_subscription_usage:
//   id, user_id, subscription_id, period_month, total_sales_count,
//   marketplace_breakdown_json, created_at, updated_at
// ======================================================================

import { buildApiUrl, apiFetch } from "../config/api";

function post(path, body) {
  const url = buildApiUrl(path);
  if (!url) return Promise.resolve({ ok: false, error: "URL da API inválida" });
  return apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function createAsaasCustomer(payload) {
  return post("/api/subscriptions/asaas/customer", payload);
}

export async function createAsaasSubscription(payload) {
  return post("/api/subscriptions/asaas/create", payload);
}

export async function getAsaasSubscription(subscriptionId) {
  const url = buildApiUrl(`/api/subscriptions/asaas/${encodeURIComponent(String(subscriptionId ?? ""))}`);
  if (!url) return { ok: false, error: "URL da API inválida" };
  return apiFetch(url, { method: "GET" });
}

export async function cancelAsaasSubscription(subscriptionId) {
  return post("/api/subscriptions/asaas/cancel", {
    subscription_id: subscriptionId,
  });
}

