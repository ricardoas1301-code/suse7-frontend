// ======================================================================
// Aplicação de filtros/ordenação — listagem Produtos (Central de Saúde SSOT).
// ======================================================================

import { getProductCatalogMetrics } from "../../../utils/productCatalogRow.js";
import {
  isOrdenacaoFiltroRapidoProdutos,
  normalizarIdFiltroRapidoProdutos,
  produtoAtendeFiltroRapidoLista,
} from "./productHealthListClassifiers.js";

function stableProductId(product) {
  const id = product?.id ?? product?.product_id;
  return id != null ? String(id) : "";
}

function sortByProductIdStable(a, b) {
  return stableProductId(a).localeCompare(stableProductId(b), undefined, { numeric: true });
}

/**
 * @param {object[]} products
 * @param {string} filterId
 */
export function applyProductsCatalogFilters(products, filterId) {
  if (!Array.isArray(products) || products.length === 0) return [];

  const id = normalizarIdFiltroRapidoProdutos(filterId);
  const filtered = isOrdenacaoFiltroRapidoProdutos(id)
    ? [...products]
    : products.filter((product) => produtoAtendeFiltroRapidoLista(product, id));

  if (id === "top_profit") {
    return [...filtered].sort((a, b) => {
      const aProfit = getProductCatalogMetrics(a).grossProfit ?? -Infinity;
      const bProfit = getProductCatalogMetrics(b).grossProfit ?? -Infinity;
      if (bProfit !== aProfit) return bProfit - aProfit;
      return sortByProductIdStable(a, b);
    });
  }

  return [...filtered].sort((a, b) => {
    const aSales = getProductCatalogMetrics(a).salesCount;
    const bSales = getProductCatalogMetrics(b).salesCount;
    if (bSales !== aSales) return bSales - aSales;
    return sortByProductIdStable(a, b);
  });
}
