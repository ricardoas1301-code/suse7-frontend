// ======================================================================
// Billing API — checkout, planos e status (backend-first)
// ======================================================================

import { apiFetch, buildApiUrl } from "../../config/api";

function billingUrl(path) {
  const base = buildApiUrl(path);
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", status: 0 };
  }
  return { url: base };
}

export async function fetchBillingPlans() {
  const built = billingUrl("/api/billing/plans");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "GET" });
}

export async function fetchSubscriptionStatus() {
  const built = billingUrl("/api/billing/subscription/status");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "GET" });
}

export async function fetchPaymentMethods() {
  const built = billingUrl("/api/billing/payment-methods");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "GET" });
}

export async function fetchPaymentHistory() {
  const built = billingUrl("/api/billing/payments");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "GET" });
}

/** @param {{ limit?: number; subscription_id?: string }} [params] */
export async function fetchBillingTimeline(params = {}) {
  const built = billingUrl("/api/billing/timeline");
  if (!built.url) return built;
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.subscription_id) qs.set("subscription_id", params.subscription_id);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`${built.url}${suffix}`, { method: "GET" });
}

export async function fetchRevenueHealth() {
  const built = billingUrl("/api/billing/revenue-health");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "GET" });
}

export async function fetchBillingNotifications() {
  const built = billingUrl("/api/billing/notifications");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "GET" });
}

export async function requestSubscriptionCancellation() {
  const built = billingUrl("/api/billing/subscription/cancel");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: {} });
}

export async function reactivateSubscription() {
  const built = billingUrl("/api/billing/subscription/reactivate");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: {} });
}

/**
 * @param {{ target_plan_slug: string; payment_method?: string }} payload
 */
export async function changeSubscriptionPlan(payload) {
  const built = billingUrl("/api/billing/subscription/change-plan");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

/**
 * @param {{ plan_slug?: string; plan_key?: string; plan_id?: string; payment_method?: string }} payload
 */
export async function startBillingCheckout(payload) {
  const built = billingUrl("/api/billing/checkout/start");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

/**
 * @param {{ plan_key?: string; plan_id?: string; payment_method?: string }} payload
 */
export async function createBillingCheckout(payload) {
  const built = billingUrl("/api/billing/checkout");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

/**
 * @param {{ provider_payment_id: string }} payload
 */
export async function refreshBillingPaymentStatus(payload) {
  const built = billingUrl("/api/billing/payments/refresh");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

/**
 * @param {{ provider_payment_id: string }} payload
 */
export async function fetchBillingPixQr(payload) {
  const built = billingUrl("/api/billing/payments/pix-qr");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

/**
 * @param {{ provider_payment_id: string }} payload
 */
export async function fetchBillingBoletoDetails(payload) {
  const built = billingUrl("/api/billing/payments/boleto-details");
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

/**
 * @param {{
 *   holder_name: string;
 *   card_number: string;
 *   expiry_month: string;
 *   expiry_year: string;
 *   cvv: string;
 *   cpf_cnpj?: string;
 *   postal_code?: string;
 *   address_number?: string;
 *   phone?: string;
 *   card_type?: "credit" | "debit";
 *   set_default?: boolean;
 *   explicit_user_action?: boolean;
 * }} payload
 */
export async function createCardPaymentMethod(payload) {
  const built = billingUrl("/api/billing/payment-methods/card");
  if (!built.url) return built;
  return apiFetch(built.url, {
    method: "POST",
    body: { explicit_user_action: true, ...payload },
  });
}

/**
 * @param {string} paymentMethodId
 */
export async function deletePaymentMethod(paymentMethodId) {
  const built = billingUrl(`/api/billing/payment-methods/${encodeURIComponent(paymentMethodId)}`);
  if (!built.url) return built;
  return apiFetch(built.url, { method: "DELETE" });
}

/**
 * @param {string} paymentMethodId
 */
export async function setDefaultPaymentMethod(paymentMethodId) {
  const built = billingUrl(`/api/billing/payment-methods/${encodeURIComponent(paymentMethodId)}/default`);
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: {} });
}

/**
 * @param {Record<string, unknown>} payload
 */
export async function startCardBillingCheckout(payload) {
  const built = billingUrl("/api/billing/checkout/card");
  if (!built.url) return built;
  return apiFetch(built.url, {
    method: "POST",
    body: { explicit_user_action: true, ...payload },
  });
}

/**
 * @param {string} renewalCycleId
 * @param {Record<string, unknown>} payload
 */
/**
 * @param {string} renewalCycleId
 * @param {{ event: string; level?: string | null }} payload
 */
export async function recordRenewalNoticeSeen(renewalCycleId, payload) {
  const built = billingUrl(`/api/billing/renewals/${encodeURIComponent(renewalCycleId)}/notice-seen`);
  if (!built.url) return built;
  return apiFetch(built.url, { method: "POST", body: payload });
}

export async function payRenewalCycle(renewalCycleId, payload) {
  const built = billingUrl(`/api/billing/renewals/${encodeURIComponent(renewalCycleId)}/pay`);
  if (!built.url) return built;
  return apiFetch(built.url, {
    method: "POST",
    body: { explicit_user_action: true, ...payload },
  });
}
