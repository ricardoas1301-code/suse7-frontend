// ======================================================================
// SUSE7 — Aplicação de filtros / ordenação na listagem do catálogo
// Fase 1 implementada; demais ids ignorados com fallback seguro até ativação no registry.
// ======================================================================

import {
  getContributionMarginPercent,
  getProductCatalogMetrics,
  getProductStockDisplay,
} from "./productCatalogRow.js";

/** Margem máxima (exclusiva) para o chip "Margem baixa" — configurável. */
export const CATALOG_FILTER_LOW_MARGIN_MAX_PCT = 10;

function stableProductId(p) {
  const id = p?.id ?? p?.product_id;
  return id != null ? String(id) : "";
}

function sortByProductIdStable(a, b) {
  return stableProductId(a.product).localeCompare(stableProductId(b.product), undefined, { numeric: true });
}

/**
 * @param {Record<string, unknown>} product
 */
export function buildCatalogRowContext(product) {
  const metrics = getProductCatalogMetrics(product);
  const marginPct = getContributionMarginPercent(product, metrics);
  const stockDisplay = getProductStockDisplay(product);
  return { product, metrics, marginPct, stockDisplay };
}

/**
 * @param {object[]} products
 * @param {string} filterId
 * @returns {object[]}
 */
export function applyCatalogFilter(products, filterId) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const id = filterId === "all" || filterId == null || filterId === "" ? "all" : filterId;
  if (id === "all") return [...products];

  const contexts = products.map((p) => buildCatalogRowContext(p));

  switch (id) {
    case "loss":
      return contexts.filter((c) => c.marginPct != null && c.marginPct < 0).map((c) => c.product);
    case "low_margin":
      return contexts
        .filter(
          (c) =>
            c.marginPct != null &&
            c.marginPct >= 0 &&
            c.marginPct < CATALOG_FILTER_LOW_MARGIN_MAX_PCT
        )
        .map((c) => c.product);
    case "no_sales":
      return contexts.filter((c) => c.metrics.salesCount === 0).map((c) => c.product);
    case "top_sales":
      return [...contexts]
        .sort((a, b) => b.metrics.salesCount - a.metrics.salesCount || sortByProductIdStable(a, b))
        .map((c) => c.product);
    case "top_profit":
      return [...contexts]
        .sort((a, b) => b.metrics.grossProfit - a.metrics.grossProfit || sortByProductIdStable(a, b))
        .map((c) => c.product);
    case "needs_attention":
    case "opportunity":
    case "declining":
    case "new_no_history":
      // Fase 3: predicados a configurar; por enquanto não filtra (lista inteira).
      return [...products];
    default:
      // Fase 2 e demais ids: até regras no registry.
      return [...products];
  }
}
