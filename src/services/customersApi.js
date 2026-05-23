// =============================================================================
// Clientes 360 — API seller (read-only; contratos 4A.1–4A.3)
// =============================================================================

import { buildApiUrl, apiFetch } from "../config/api";

/**
 * @param {Record<string, string | number | undefined>} [params]
 */
export async function fetchCustomersList(params = {}) {
  const base = buildApiUrl("/api/customers");
  if (!base) return { ok: false, status: 0, error: "API não configurada" };

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    qs.set(key, String(value));
  }

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`${base}${suffix}`, { method: "GET" });
}

/**
 * @param {string} customerId
 * @param {Record<string, string | number | undefined>} [params]
 */
export async function fetchCustomerDetail(customerId, params = {}) {
  const base = buildApiUrl(`/api/customers/${encodeURIComponent(customerId)}`);
  if (!base) return { ok: false, status: 0, error: "API não configurada" };

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    qs.set(key, String(value));
  }

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`${base}${suffix}`, { method: "GET" });
}
