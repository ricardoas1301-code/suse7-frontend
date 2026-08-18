// ======================================================================
// Classificadores de lista — paridade Central de Saúde dos Produtos.
// SSOT: buckets pré-calculados em GET /api/products/catalog-health-buckets.
// ======================================================================

import { PRODUCTS_QUICK_FILTER_LEGACY_ALIASES, PRODUCTS_QUICK_FILTER_NEUTRAL_ID } from "./productHealthConstants.js";

/** @param {Record<string, unknown>} product */
function lerBucketsProduto(product) {
  const raw = product?.catalog_health_buckets;
  return raw != null && typeof raw === "object"
    ? /** @type {Record<string, unknown>} */ (raw)
    : null;
}

/** @param {string} filterId */
export function normalizarIdFiltroRapidoProdutos(filterId) {
  const id = String(filterId ?? "").trim();
  if (!id || id === "all") return PRODUCTS_QUICK_FILTER_NEUTRAL_ID;
  return PRODUCTS_QUICK_FILTER_LEGACY_ALIASES[id] ?? id;
}

/** @param {string} filterId */
export function isOrdenacaoFiltroRapidoProdutos(filterId) {
  const id = normalizarIdFiltroRapidoProdutos(filterId);
  return id === "top_sales" || id === "top_profit";
}

/**
 * @param {Record<string, unknown>} product
 * @param {string} filterId
 */
export function produtoAtendeFiltroRapidoLista(product, filterId) {
  const id = normalizarIdFiltroRapidoProdutos(filterId);
  if (isOrdenacaoFiltroRapidoProdutos(id)) return true;

  const buckets = lerBucketsProduto(product);
  if (!buckets) return false;

  const abc = String(buckets.abc_curve ?? "");
  const stock = String(buckets.stock_coverage ?? "");
  const profit = String(buckets.profitability ?? "");

  switch (id) {
    case "abc_a":
      return abc === "curve_a";
    case "abc_b":
      return abc === "curve_b";
    case "abc_c":
      return abc === "curve_c";
    case "no_sales":
      return abc === "no_sales";
    case "stock_out":
      return stock === "rupture";
    case "stock_critical":
      return stock === "critical";
    case "stock_low":
      return stock === "low";
    case "stock_healthy":
      return stock === "healthy";
    case "profit_high":
      return profit === "high_profit";
    case "profit_ok":
      return profit === "profit";
    case "profit_low":
      return profit === "low_profit";
    case "loss":
      return profit === "loss";
    case "dead_stock":
      return buckets.is_dead_stock === true;
    case "replenishment_priority":
      return buckets.stockout_risk === true;
    case "low_markup":
      return buckets.low_markup === true;
    case "turnover_15d":
      return buckets.has_turnover_15d === true;
    default:
      return true;
  }
}
