// ======================================================================
// POST /api/ml/sales/sync — sincroniza marketplace_sales via API Mercado Livre
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";

/**
 * @param {{
 *   marketplaceAccountId?: string | null;
 *   sellerCompanyId?: string | null;
 *   dateFrom?: string | null;
 *   dateTo?: string | null;
 * }} [opts]
 * @returns {Promise<{ ok: boolean; data?: any; error?: string; status: number }>}
 */
export async function postMlSalesSync(opts = {}) {
  const base = buildApiUrl("/api/ml/sales/sync");
  if (!base) {
    return { ok: false, error: "Configure VITE_API_BASE_URL para sincronizar vendas.", status: 0 };
  }

  const body = {
    marketplaceAccountId: opts.marketplaceAccountId ?? null,
    sellerCompanyId: opts.sellerCompanyId ?? null,
    dateFrom: opts.dateFrom ?? null,
    dateTo: opts.dateTo ?? null,
  };

  return apiFetch(base, {
    method: "POST",
    body,
  });
}
