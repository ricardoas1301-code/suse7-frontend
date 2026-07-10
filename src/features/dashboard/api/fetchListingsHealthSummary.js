// ======================================================================
// GET /api/dashboard/listings-health-summary
// ======================================================================

import { apiFetch, buildApiUrl } from "../../../config/api";
import { ensureAuthSessionBootstrapped, getAuthBootstrapAccessToken } from "../../../auth/authBootstrapService";
import { normalizeListingsHealthSummaryCards } from "./normalizeListingsHealthSummary.js";

/**
 * @param {{
 *   marketplaceAccountId?: string | null;
 *   marketplace?: string | null;
 *   periodPreset?: string | null;
 *   dateFrom?: string | null;
 *   dateTo?: string | null;
 * }} [params]
 */
export async function fetchListingsHealthSummary(params = {}) {
  const base = buildApiUrl("/api/dashboard/listings-health-summary");
  if (!base) {
    return {
      ok: false,
      error: "Configure VITE_API_BASE_URL.",
      summary: null,
      cards: null,
      metadata: null,
    };
  }

  await ensureAuthSessionBootstrapped();
  const token = getAuthBootstrapAccessToken();
  if (!token) {
    return {
      ok: false,
      error: "Sessão indisponível.",
      summary: null,
      cards: null,
      metadata: null,
    };
  }

  const search = new URLSearchParams();
  if (params.marketplaceAccountId) search.set("marketplace_account_id", params.marketplaceAccountId);
  if (params.marketplace) search.set("marketplace", params.marketplace);
  if (params.periodPreset) search.set("period_preset", params.periodPreset);
  if (params.dateFrom) search.set("date_from", params.dateFrom);
  if (params.dateTo) search.set("date_to", params.dateTo);

  const url = search.toString() ? `${base}?${search.toString()}` : base;
  const res = await apiFetch(url, { method: "GET", timeoutMs: 120000 });

  if (!res.ok) {
    if (import.meta.env?.DEV) {
      console.error("[ListingsHealthCenter] fetch failed", {
        status: res.status,
        error: res.error,
      });
    }
    return {
      ok: false,
      error: res.error ?? "Não foi possível carregar a Central de Saúde dos Anúncios agora.",
      summary: null,
      cards: null,
      metadata: null,
      status: res.status,
    };
  }

  const data = res.data != null && typeof res.data === "object" ? res.data : null;
  if (!data) {
    return {
      ok: false,
      error: "Resposta inválida da Central de Saúde dos Anúncios.",
      summary: null,
      cards: null,
      metadata: null,
    };
  }

  return {
    ok: data.ok !== false,
    error: data.error ?? null,
    summary: data.summary ?? null,
    summary_cards: normalizeListingsHealthSummaryCards(data),
    cards: data.cards ?? null,
    metadata: data.metadata ?? null,
    source: data.source ?? null,
    status: res.status,
  };
}
