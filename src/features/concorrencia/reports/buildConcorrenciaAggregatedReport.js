// ======================================================================
// Contrato agregado oficial do Relatório de Concorrência.
// Fonte única consumida pelo modal e pelos canais de compartilhamento.
// ======================================================================

import {
  calcularComparativoPrecoConcorrente,
  displayCompetitorTitle,
  extrairContaAnuncioProprio,
  extrairIdAnuncioProprio,
  formatarIdAnuncioMlbParaCopia,
  formatCapturedAt,
  formatFriendlyListingType,
  formatNivelReputacaoMl,
  formatPowerSeller,
  formatPrice,
  formatVendasHistoricasVendedor,
  montarMetaOficialConcorrente,
  pickCompetitorPrice,
  pickCompetitorSellerName,
  produtoTemConcorrenteInativo,
  rotuloMarketplaceConcorrente,
  rotuloStatusAnuncioConcorrente,
} from "../../../components/concorrencia/concorrenciaCompetitorDisplay.js";
import { CONCORRENCIA_LIMITE_CONCORRENTES } from "../filters/concorrenciaFiltersConstants.js";

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
function concorrentesCountLabel(count) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? "concorrente" : "concorrentes"}`;
}

/**
 * @param {Record<string, unknown>} product
 * @param {readonly Record<string, unknown>[]} competitors
 * @param {Record<string, unknown> | null} ownListing
 */
function montarLinhaConcorrente(competitor, ownListing) {
  const meta = montarMetaOficialConcorrente(competitor);
  const { value: precoRaw, currency } = pickCompetitorPrice(competitor);
  const precoNosso = ownListing?.price ?? null;
  const moedaNossa = ownListing?.currency ?? currency ?? "BRL";
  const comparativo = calcularComparativoPrecoConcorrente(precoNosso, precoRaw, moedaNossa);

  let posicaoPreco = "—";
  if (comparativo.tipo === "acima") posicaoPreco = "Acima do nosso preço";
  else if (comparativo.tipo === "abaixo") posicaoPreco = "Abaixo do nosso preço";
  else if (comparativo.tipo === "equivalente") posicaoPreco = "Equivalente ao nosso preço";

  const atualizacao =
    meta.atualizacao ??
    (competitor?.last_captured_at ? formatCapturedAt(competitor.last_captured_at) : null) ??
    "—";

  return {
    nomeLoja:
      pickCompetitorSellerName(competitor) ||
      displayCompetitorTitle(competitor?.competitor_title || competitor?.competitor_store_name),
    preco: formatPrice(precoRaw, currency),
    precoNosso: formatPrice(precoNosso, moedaNossa),
    diferencaPreco: comparativo.rotulo ?? "—",
    posicaoPreco,
    tipoAnuncio: formatFriendlyListingType(competitor?.listing_type) ?? "—",
    mercadoLider: formatPowerSeller(competitor?.reputation) ?? "—",
    reputacao: formatNivelReputacaoMl(competitor?.reputation) ?? "—",
    vendasVendedor: formatVendasHistoricasVendedor(competitor?.reputation) ?? "—",
    statusAnuncio: rotuloStatusAnuncioConcorrente(competitor) ?? "—",
    ultimaAtualizacao: atualizacao,
  };
}

/**
 * @param {Record<string, unknown>} product
 * @param {readonly Record<string, unknown>[]} competitors
 * @param {Record<string, unknown> | null} ownListing
 */
function montarDetalheProduto(product, competitors, ownListing) {
  const nome = String(product?.product_name || "Sem nome").trim() || "Sem nome";
  const sku = String(product?.sku || "").trim() || "—";
  const conta = extrairContaAnuncioProprio(ownListing) ?? "—";
  const marketplace = rotuloMarketplaceConcorrente("mercado_livre") ?? "Mercado Livre";
  const list = Array.isArray(competitors) ? competitors : [];
  const idAnuncioRaw = extrairIdAnuncioProprio(ownListing);
  const idAnuncio = idAnuncioRaw ? formatarIdAnuncioMlbParaCopia(idAnuncioRaw) : "—";

  return {
    productId: product?.id != null ? String(product.id) : null,
    nome,
    idAnuncio,
    sku,
    conta,
    marketplace,
    quantidadeConcorrentes: list.length,
    quantidadeConcorrentesLabel: concorrentesCountLabel(list.length),
    concorrentes: list.map((c) => montarLinhaConcorrente(c, ownListing)),
  };
}

/**
 * @param {import("./buildConcorrenciaReportContext.js").ConcorrenciaReportContext} context
 * @param {{
 *   products: readonly Record<string, unknown>[];
 *   getCompetitors: (product: Record<string, unknown>) => readonly Record<string, unknown>[];
 *   getOwnListing: (product: Record<string, unknown>) => Record<string, unknown> | null;
 * }} input
 */
export function buildConcorrenciaAggregatedReport(context, input) {
  const products = Array.isArray(input?.products) ? input.products : [];
  const getCompetitors = input?.getCompetitors ?? (() => []);
  const getOwnListing = input?.getOwnListing ?? (() => null);

  let comConcorrentes = 0;
  let semConcorrentes = 0;
  let concorrenciaCompleta = 0;
  let concorrenciaIncompleta = 0;
  let comConcorrentesInativos = 0;
  let totalConcorrentes = 0;

  /** @type {ReturnType<typeof montarDetalheProduto>[]} */
  const detalhesProdutos = [];

  for (const product of products) {
    const competitors = getCompetitors(product);
    const ownListing = getOwnListing(product);
    const count = competitors.length;
    totalConcorrentes += count;

    if (count > 0) comConcorrentes += 1;
    else semConcorrentes += 1;

    if (count >= CONCORRENCIA_LIMITE_CONCORRENTES) concorrenciaCompleta += 1;
    else if (count > 0) concorrenciaIncompleta += 1;

    if (produtoTemConcorrenteInativo(competitors)) comConcorrentesInativos += 1;

    detalhesProdutos.push(montarDetalheProduto(product, competitors, ownListing));
  }

  const analisados = products.length;

  return {
    version: 1,
    escopo: context?.reportScope ?? "filters",
    titulo: "Relatório de Concorrência",
    subtitulo: "Inteligência Competitiva",
    quantidadeProdutos: analisados,
    quantidadeProdutosLabel: produtosCountLabel(analisados),
    resumoExecutivo: {
      produtosAnalisados: { valor: analisados, label: produtosCountLabel(analisados) },
      comConcorrentes: { valor: comConcorrentes, label: produtosCountLabel(comConcorrentes) },
      semConcorrentes: { valor: semConcorrentes, label: produtosCountLabel(semConcorrentes) },
      concorrenciaCompleta: { valor: concorrenciaCompleta, label: produtosCountLabel(concorrenciaCompleta) },
      concorrenciaIncompleta: { valor: concorrenciaIncompleta, label: produtosCountLabel(concorrenciaIncompleta) },
      comConcorrentesInativos: {
        valor: comConcorrentesInativos,
        label: produtosCountLabel(comConcorrentesInativos),
      },
      totalConcorrentesMonitorados: {
        valor: totalConcorrentes,
        label: concorrentesCountLabel(totalConcorrentes),
      },
    },
    detalhesProdutos,
    geradoEm: new Date().toISOString(),
  };
}
