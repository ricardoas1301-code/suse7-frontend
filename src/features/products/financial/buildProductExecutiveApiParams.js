// ======================================================================
// Params de executive-summary filtrados por produto (histórico consolidado).
// Fonte única: GET /api/sales/executive-summary?product_id=
// ======================================================================

/**
 * @param {string | null | undefined} productId
 * @returns {import("../../../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams | null}
 */
export function buildProductExecutiveApiParams(productId) {
  const pid = productId != null ? String(productId).trim() : "";
  if (!pid) return null;

  return {
    product_id: pid,
    ranking_limit: 10,
  };
}
