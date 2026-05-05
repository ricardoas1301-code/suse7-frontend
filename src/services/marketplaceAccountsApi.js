// ======================================================================
// GET /api/marketplace/accounts — contas integradas (ML, etc.)
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";

/**
 * @returns {Promise<{ ok: boolean; data?: { ok?: boolean; accounts?: unknown[] }; error?: string; status: number }>}
 */
export async function fetchMercadoLivreMarketplaceAccounts() {
  const base = buildApiUrl("/api/marketplace/accounts");
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", status: 0 };
  }
  const url = `${base}?${new URLSearchParams({ marketplace: "mercado_livre" }).toString()}`;
  return apiFetch(url, { method: "GET" });
}
