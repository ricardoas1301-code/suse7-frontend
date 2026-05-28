// ============================================================
// API — destinatários e regras de roteamento de notificações (Fase 1)
// Autenticação via apiFetch (Bearer Supabase)
// ============================================================

import { buildApiUrl, apiFetch } from "../config/api";

export async function fetchNotificationContacts() {
  const url = buildApiUrl("/api/notifications/contacts");
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "GET", unauthorizedFallback: { contacts: [] } });
}

export async function createNotificationContact(body) {
  const url = buildApiUrl("/api/notifications/contacts");
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "POST", body });
}

export async function patchNotificationContact(id, body) {
  const url = buildApiUrl(`/api/notifications/contacts/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "PATCH", body });
}

export async function deactivateNotificationContact(id) {
  const url = buildApiUrl(`/api/notifications/contacts/${encodeURIComponent(id)}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "DELETE" });
}

export async function fetchNotificationRoutingRules(query = {}) {
  const qs = new URLSearchParams();
  if (query.notification_type) qs.set("notification_type", query.notification_type);
  if (query.notification_channel) qs.set("notification_channel", query.notification_channel);
  if (query.marketplace_account_id) qs.set("marketplace_account_id", query.marketplace_account_id);
  if (query.include_inactive) qs.set("include_inactive", "true");
  const suffix = qs.toString() ? `?${qs}` : "";
  const url = buildApiUrl(`/api/notifications/routing-rules${suffix}`);
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "GET", unauthorizedFallback: { rules: [] } });
}

export async function putNotificationRoutingRulesBatch(payload) {
  const url = buildApiUrl("/api/notifications/routing-rules");
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "PUT", body: payload });
}

export async function fetchMarketplaceAccountsForRouting() {
  const url = buildApiUrl("/api/marketplace/accounts");
  if (!url) return { ok: false, error: "API não configurada", status: 0 };
  return apiFetch(url, { method: "GET", unauthorizedFallback: { accounts: [] } });
}
