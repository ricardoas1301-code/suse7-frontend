// ======================================================================
// @deprecated Use useSalesExecutiveSummary + product_id (fonte única executive-summary).
// Mantido apenas para compatibilidade de import legado.
// ======================================================================

import { fetchSalesExecutiveSummary } from "./salesExecutiveSummaryApi";

/**
 * @param {string} productId
 */
export async function fetchProductPerformance(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) return { ok: false, error: "product_id inválido" };

  const res = await fetchSalesExecutiveSummary({ product_id: pid });
  if (!res.ok) {
    return {
      ok: false,
      error: res.error ?? "Erro ao carregar desempenho",
    };
  }

  const summary =
    res.data?.summary != null && typeof res.data.summary === "object" ? res.data.summary : {};
  return {
    ok: true,
    data: {
      summary,
      rankings: res.data?.rankings ?? null,
      period: res.data?.period ?? null,
    },
  };
}
