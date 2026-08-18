// ======================================================================
// Contrato agregado oficial do Relatório de Produto.
// Fonte única consumida pelo modal e pelos canais de compartilhamento.
// ======================================================================

import {
  getCatalogHealthPresentation,
  getCatalogProfitSemanticBand,
  getProductCatalogMetrics,
} from "../../../utils/productCatalogRow.js";

/**
 * @param {number} count
 */
function produtosCountLabel(count) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "produto" : "produtos"}`;
}

/**
 * @param {number} count
 */
function anunciosCountLabel(count) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "anúncio" : "anúncios"}`;
}

/**
 * @param {readonly Record<string, unknown>[]} products
 */
function buildResumoExecutivo(products) {
  let cadastroCompleto = 0;
  let cadastroIncompleto = 0;
  let comAnuncios = 0;
  let comVendas = 0;
  let semVendas = 0;
  let saudavel = 0;
  let cadastroPendente = 0;
  let prejuizo = 0;
  let totalAnuncios = 0;

  for (const product of products) {
    const metrics = getProductCatalogMetrics(product);
    const health = getCatalogHealthPresentation(product, metrics);
    const profitBand = getCatalogProfitSemanticBand(product, metrics);
    const ready = product?.is_product_ready === true;

    if (ready) cadastroCompleto += 1;
    else {
      cadastroIncompleto += 1;
      cadastroPendente += 1;
    }

    if (metrics.adsCount > 0) {
      comAnuncios += 1;
      totalAnuncios += metrics.adsCount;
    }

    if (metrics.salesCount > 0) comVendas += 1;
    else semVendas += 1;

    if (health.band === "healthy") saudavel += 1;
    if (profitBand === "loss") prejuizo += 1;
  }

  return {
    cadastroCompleto: { label: produtosCountLabel(cadastroCompleto) },
    comAnunciosVinculados: { label: produtosCountLabel(comAnuncios) },
    comHistoricoVendas: { label: produtosCountLabel(comVendas) },
    saudavel: { label: produtosCountLabel(saudavel) },
    cadastroPendente: { label: produtosCountLabel(cadastroPendente) },
    lucroPrejuizo: { label: produtosCountLabel(prejuizo) },
    semVendas: { label: produtosCountLabel(semVendas) },
    totalAnunciosVinculados: { label: anunciosCountLabel(totalAnuncios) },
    cadastroIncompleto: { label: produtosCountLabel(cadastroIncompleto) },
  };
}

/**
 * @param {import("./buildProdutosReportContext.js").ProdutosReportContext} context
 * @param {{ products: readonly Record<string, unknown>[] }} input
 */
export function buildProdutosAggregatedReport(context, input) {
  const products = Array.isArray(input.products) ? input.products : [];
  const resumoExecutivo = buildResumoExecutivo(products);

  return {
    version: 1,
    escopo: "filters",
    titulo: "Relatório de Produto",
    quantidadeProdutos: products.length,
    resumoExecutivo,
    contexto: context,
  };
}
