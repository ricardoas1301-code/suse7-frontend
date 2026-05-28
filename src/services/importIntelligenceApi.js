// ======================================================================
// GET /api/marketplace/import-intelligence — resumo multi-conta ML (JWT).
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";

/**
 * @param {string} [marketplace]
 * @param {{ marketplaceAccountId?: string | null }} [opts] — quando definido, backend retorna só essa conta (isolamento multi-conta).
 * @returns {Promise<{ ok: boolean; data?: any; error?: string; status: number }>}
 */
export async function fetchImportIntelligenceSummary(marketplace = "mercado_livre", opts = {}) {
  const base = buildApiUrl("/api/marketplace/import-intelligence");
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL.", status: 0 };
  }
  const params = new URLSearchParams({ marketplace });
  const mid =
    opts.marketplaceAccountId != null && String(opts.marketplaceAccountId).trim() !== ""
      ? String(opts.marketplaceAccountId).trim()
      : "";
  if (mid) params.set("marketplace_account_id", mid);
  const url = `${base}?${params.toString()}`;
  return apiFetch(url, { method: "GET" });
}
