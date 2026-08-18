// ======================================================================
// GET /api/dashboard/pricing-health-summary
// ======================================================================

import { apiFetch, buildApiUrl } from "../../../config/api";
import { ensureAuthSessionBootstrapped, getAuthBootstrapAccessToken } from "../../../auth/authBootstrapService";
import { normalizePricingHealthSummaryPayload } from "./normalizePricingHealthSummary.js";

/**
 * @param {{
 *   periodPreset?: string | null;
 *   dateFrom?: string | null;
 *   dateTo?: string | null;
 * }} [params]
 */
export async function fetchPricingHealthSummary(params = {}) {
  const base = buildApiUrl("/api/dashboard/pricing-health-summary");
  if (!base) {
    return {
      ok: false,
      error: "Configure VITE_API_BASE_URL.",
      payload: null,
    };
  }

  await ensureAuthSessionBootstrapped();
  const token = getAuthBootstrapAccessToken();
  if (!token) {
    return {
      ok: false,
      error: "Sessão indisponível.",
      payload: null,
    };
  }

  const search = new URLSearchParams();
  if (params.periodPreset) search.set("period_preset", params.periodPreset);
  if (params.dateFrom) search.set("date_from", params.dateFrom);
  if (params.dateTo) search.set("date_to", params.dateTo);

  const url = search.toString() ? `${base}?${search.toString()}` : base;
  const res = await apiFetch(url, { method: "GET", timeoutMs: 120000 });

  if (!res.ok) {
    if (import.meta.env?.DEV) {
      console.error("[PricingHealthCenter] fetch failed", {
        status: res.status,
        error: res.error,
      });
    }
    return {
      ok: false,
      error: res.error ?? "Não foi possível carregar a Central de Saúde da Precificação agora.",
      payload: null,
      status: res.status,
    };
  }

  const data = res.data != null && typeof res.data === "object" ? res.data : null;
  if (!data) {
    return {
      ok: false,
      error: "Resposta inválida da Central de Saúde da Precificação.",
      payload: null,
      status: res.status,
    };
  }

  return {
    ok: true,
    payload: normalizePricingHealthSummaryPayload(data),
    status: res.status,
  };
}
