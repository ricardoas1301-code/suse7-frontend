// ======================================================================
// Contexto unificado de relatório — espelha os filtros da página Produtos.
// Princípio: o que está filtrado na tela = o que será exportado.
// ======================================================================

import { PRODUCTS_QUICK_FILTER_OPTIONS } from "../filters/productsQuickFiltersConfig.js";
import { normalizarIdFiltroRapidoProdutos } from "../domain/productHealthListClassifiers.js";

/**
 * @typedef {{
 *   label: string;
 * }} ProdutosReportContextScope
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 * }} ProdutosReportContextOperationalFilter
 */

/**
 * @typedef {{
 *   query: string;
 *   hasQuery: boolean;
 * }} ProdutosReportContextSearch
 */

/**
 * @typedef {{
 *   totalCount: number;
 *   pageItemIds: string[];
 * }} ProdutosReportContextProducts
 */

/**
 * @typedef {{
 *   version: number;
 *   scope: ProdutosReportContextScope;
 *   operationalFilter: ProdutosReportContextOperationalFilter;
 *   search: ProdutosReportContextSearch;
 *   products: ProdutosReportContextProducts;
 *   capabilities: readonly string[];
 * }} ProdutosReportContext
 */

/**
 * @param {string | number | null | undefined} productId
 */
export function pickProdutosReportProductId(productId) {
  const id = productId != null ? String(productId).trim() : "";
  return id || null;
}

/**
 * @param {{
 *   listFilterId: string;
 *   searchQuery: string;
 *   scopeProductsCount: number;
 *   pageProducts: readonly Record<string, unknown>[];
 * }} input
 * @returns {ProdutosReportContext}
 */
export function buildProdutosReportContext(input) {
  const filterId = normalizarIdFiltroRapidoProdutos(String(input.listFilterId ?? "top_sales"));
  const chip = PRODUCTS_QUICK_FILTER_OPTIONS.find((c) => c.id === filterId);
  const searchQuery = String(input.searchQuery ?? "").trim();

  const pageItemIds = [];
  for (const product of input.pageProducts ?? []) {
    const id = pickProdutosReportProductId(product?.id);
    if (id) pageItemIds.push(id);
  }

  return {
    version: 1,
    scope: { label: "Catálogo completo" },
    operationalFilter: {
      id: filterId,
      label: chip?.label ?? filterId,
    },
    search: { query: searchQuery, hasQuery: Boolean(searchQuery) },
    products: {
      totalCount: Math.max(0, Number(input.scopeProductsCount) || 0),
      pageItemIds,
    },
    capabilities: ["previewModal", "executiveSummary"],
  };
}

/**
 * @param {number} scopeCount
 */
export function canOfferProdutosReport(scopeCount) {
  return Math.max(0, Number(scopeCount) || 0) > 0;
}
