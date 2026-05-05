// ======================================================================
// SUSE7 — GET /api/products/catalog-rankings
// Rankings agregados no backend (RPC). Sem API configurada: listas vazias.
// ======================================================================

import { buildApiUrl, apiFetch } from "../../config/api";

const EMPTY_SUMMARY = {
  top10_sales_quantity_total: 0,
  top10_revenue_brl_total: "0.00",
  top10_profit_brl_total: "0.00",
};

const EMPTY_RANKINGS = {
  top_sales_quantity: [],
  top_revenue: [],
  top_profit: [],
  catalog_summary: { ...EMPTY_SUMMARY },
  meta: {},
};

/**
 * @returns {Promise<{
 *   top_sales_quantity: Array<{ rank: number; product_id: string; product_name: string; sku?: string; value: number }>;
 *   top_revenue: Array<...>;
 *   top_profit: Array<...>;
 *   meta: Record<string, unknown>;
 * }>}
 */
export async function fetchCatalogRankings() {
  const url = buildApiUrl("/api/products/catalog-rankings");
  if (!url) {
    return { ...EMPTY_RANKINGS, meta: { source: "no_api_url" } };
  }

  try {
    const res = await apiFetch(url, {
      method: "GET",
      unauthorizedFallback: { ...EMPTY_RANKINGS },
    });

    if (!res.ok) {
      return {
        ...EMPTY_RANKINGS,
        meta: {
          source: "error",
          error: res.error,
          httpStatus: res.status,
        },
      };
    }

    const d = res.data && typeof res.data === "object" ? res.data : {};
    const cs = d.catalog_summary && typeof d.catalog_summary === "object" ? d.catalog_summary : {};
    return {
      top_sales_quantity: Array.isArray(d.top_sales_quantity) ? d.top_sales_quantity : [],
      top_revenue: Array.isArray(d.top_revenue) ? d.top_revenue : [],
      top_profit: Array.isArray(d.top_profit) ? d.top_profit : [],
      catalog_summary: {
        top10_sales_quantity_total:
          typeof cs.top10_sales_quantity_total === "number" ? cs.top10_sales_quantity_total : 0,
        top10_revenue_brl_total:
          cs.top10_revenue_brl_total != null ? String(cs.top10_revenue_brl_total) : EMPTY_SUMMARY.top10_revenue_brl_total,
        top10_profit_brl_total:
          cs.top10_profit_brl_total != null ? String(cs.top10_profit_brl_total) : EMPTY_SUMMARY.top10_profit_brl_total,
      },
      meta: d.meta && typeof d.meta === "object" ? d.meta : {},
    };
  } catch (e) {
    return {
      ...EMPTY_RANKINGS,
      meta: {
        source: "network_or_parse",
        error: e?.message ?? String(e),
      },
    };
  }
}
