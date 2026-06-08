// ======================================================================
// Contrato agregado oficial do relatório de Vendas (P_2.8.12B).
//
// Fonte ÚNICA de dados do relatório agregado, independente do canal de saída
// (Modal, WhatsApp, E-mail, Copiar, Imprimir/PDF, Excel/CSV). Os botões futuros
// apenas consomem este contrato e renderizam no formato necessário.
//
// PRINCÍPIOS
// - Frontend NÃO faz cálculo sensível: consome apenas valores já tratados pela
//   fonte oficial da Página Vendas (executive-summary do backend) ou pelas
//   métricas de seleção já agregadas.
// - Valores monetários/percentuais permanecem como strings decimais ("123.45").
// - Nasce preparado para múltiplas contas, múltiplos CNPJs e múltiplos
//   marketplaces (campos em formato de lista, mesmo quando hoje há 1 item).
// ======================================================================

export const VENDAS_AGGREGATED_REPORT_VERSION = 1;

/**
 * @typedef {{
 *   dataInicial: string | null;
 *   dataFinal: string | null;
 *   preset: string | null;
 *   label: string;
 * }} VendasAggregatedReportPeriodo
 */

/**
 * @typedef {{
 *   id: string | null;
 *   label: string;
 * }} VendasAggregatedReportConta
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 * }} VendasAggregatedReportFiltroOperacional
 */

/**
 * @typedef {{
 *   marketplace: string | null;
 *   contas: VendasAggregatedReportConta[];
 *   busca: string | null;
 *   filtrosOperacionais: VendasAggregatedReportFiltroOperacional[];
 *   vendasSelecionadas: string[];
 * }} VendasAggregatedReportFiltros
 */

/**
 * @typedef {{
 *   quantidadeVendas: number;
 *   faturamentoBruto: string;
 *   lucroLiquido: string;
 *   margemPercentual: string | null;
 *   vendasSaudaveis: number | null;
 *   vendasMargemCritica: number;
 *   vendasPrejuizo: number;
 * }} VendasAggregatedReportResumoExecutivo
 */

/**
 * @typedef {{
 *   posicao: number;
 *   produtoId: string | null;
 *   sku: string | null;
 *   titulo: string;
 *   quantidade: number;
 *   faturamentoBruto: string;
 *   liquidoRecebido: string;
 *   lucroLiquido: string;
 *   margemPercentual: string | null;
 * }} VendasAggregatedReportProduto
 */

/**
 * @typedef {{
 *   contaId: string | null;
 *   conta: string;
 *   quantidadeVendas: number;
 * }} VendasAggregatedReportDistribuicaoConta
 */

/**
 * @typedef {{
 *   porConta: Record<string, unknown>[];
 *   porProduto: VendasAggregatedReportProduto[];
 *   porStatus: Record<string, unknown>[];
 *   porTipoEntrega: Record<string, unknown>[];
 * }} VendasAggregatedReportAgrupamentos
 */

/**
 * @typedef {{
 *   versao: number;
 *   escopo: "filters" | "selected";
 *   geradoEm: string;
 *   periodo: VendasAggregatedReportPeriodo;
 *   filtros: VendasAggregatedReportFiltros;
 *   resumoExecutivo: VendasAggregatedReportResumoExecutivo;
 *   distribuicaoPorConta: VendasAggregatedReportDistribuicaoConta[];
 *   agrupamentos: VendasAggregatedReportAgrupamentos;
 *   vendas: readonly Record<string, unknown>[];
 *   _meta: {
 *     analiseLimitada: boolean;
 *     fonteResumo: "executive-summary" | "selecao-manual" | "vazio";
 *   };
 * }} VendasAggregatedReport
 */

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toStringOrNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

/**
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function toMoneyString(value, fallback = "0.00") {
  const s = toStringOrNull(value);
  return s ?? fallback;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function toInt(value, fallback = 0) {
  if (value == null) return fallback;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

/**
 * @param {Record<string, unknown>} product
 * @param {number} index
 * @returns {VendasAggregatedReportProduto}
 */
function mapProdutoEntry(product, index) {
  const p = product ?? {};
  return {
    posicao: toInt(p.rank, index + 1),
    produtoId: toStringOrNull(p.product_id),
    sku: toStringOrNull(p.sku ?? p.normalized_sku),
    titulo: toStringOrNull(p.title) ?? "Produto",
    quantidade: toInt(p.quantity_sold, 0),
    faturamentoBruto: toMoneyString(p.gross_sales_brl),
    liquidoRecebido: toMoneyString(p.net_received_brl),
    lucroLiquido: toMoneyString(p.contribution_profit_brl ?? p.profit_brl),
    margemPercentual: toStringOrNull(p.contribution_margin_percent ?? p.margin_percent),
  };
}

/**
 * @param {Map<string, string> | Record<string, string> | null | undefined} labelMap
 * @param {string} id
 * @returns {string | null}
 */
function resolveAccountLabel(labelMap, id) {
  if (!labelMap || !id) return null;
  if (labelMap instanceof Map) {
    const v = labelMap.get(id);
    return v != null && String(v).trim() !== "" ? String(v).trim() : null;
  }
  const v = /** @type {Record<string, string>} */ (labelMap)[id];
  return v != null && String(v).trim() !== "" ? String(v).trim() : null;
}

/**
 * Monta a distribuição por conta a partir de fontes já tratadas:
 * - escopo "filters": distribuição do executive-summary (backend) + mapa de rótulos.
 * - escopo "selected": distribuição já contada a partir das linhas selecionadas.
 *
 * @param {{
 *   escopo: "filters" | "selected";
 *   distributionByAccount?: readonly Record<string, unknown>[] | null;
 *   accountLabelById?: Map<string, string> | Record<string, string> | null;
 *   selectedDistribution?: readonly VendasAggregatedReportDistribuicaoConta[] | null;
 *   fallbackContaLabel?: string;
 * }} args
 * @returns {VendasAggregatedReportDistribuicaoConta[]}
 */
function buildDistribuicaoPorConta(args) {
  if (args.escopo === "selected") {
    const list = Array.isArray(args.selectedDistribution) ? args.selectedDistribution : [];
    return list.map((entry) => ({
      contaId: entry?.contaId ?? null,
      conta: toStringOrNull(entry?.conta) ?? "Conta não definida",
      quantidadeVendas: toInt(entry?.quantidadeVendas, 0),
    }));
  }

  const raw = Array.isArray(args.distributionByAccount) ? args.distributionByAccount : [];
  return raw.map((entry) => {
    const id = toStringOrNull(entry?.marketplace_account_id);
    const labelFromMap = id ? resolveAccountLabel(args.accountLabelById, id) : null;
    const conta =
      labelFromMap ??
      (id ? `Conta ${id}` : toStringOrNull(args.fallbackContaLabel) ?? "Conta não definida");
    const quantidade =
      entry?.items_quantity_sold != null
        ? toInt(entry.items_quantity_sold, 0)
        : toInt(entry?.orders_count, 0);
    return { contaId: id, conta, quantidadeVendas: quantidade };
  });
}

/**
 * Monta o contrato agregado a partir de dados JÁ tratados pela Página Vendas.
 *
 * @param {{
 *   context: import("./buildVendasReportContext.js").VendasReportContext | null | undefined;
 *   executiveSummary?: Record<string, unknown> | null;
 *   executiveHealth?: Record<string, unknown> | null;
 *   rankingProducts?: readonly Record<string, unknown>[] | null;
 *   selectedMetrics?: {
 *     grossSalesBrl?: string;
 *     netProfitBrl?: string;
 *     marginPercent?: string | null;
 *     lowMarginCount?: number;
 *     negativeCount?: number;
 *     healthyCount?: number;
 *   } | null;
 *   distributionByAccount?: readonly Record<string, unknown>[] | null;
 *   accountLabelById?: Map<string, string> | Record<string, string> | null;
 *   selectedDistribution?: readonly VendasAggregatedReportDistribuicaoConta[] | null;
 * }} input
 * @returns {VendasAggregatedReport | null}
 */
export function buildVendasAggregatedReport(input) {
  const context = input?.context;
  if (!context || typeof context !== "object") return null;

  const escopo = context.reportScope === "selected" ? "selected" : "filters";
  const summary =
    input?.executiveSummary && typeof input.executiveSummary === "object"
      ? input.executiveSummary
      : null;
  const health =
    input?.executiveHealth && typeof input.executiveHealth === "object"
      ? input.executiveHealth
      : null;
  const selected =
    input?.selectedMetrics && typeof input.selectedMetrics === "object"
      ? input.selectedMetrics
      : null;

  const quantidadeVendas = toInt(context.sales?.totalCount, 0);

  /** @type {VendasAggregatedReportResumoExecutivo} */
  let resumoExecutivo;
  /** @type {VendasAggregatedReport["_meta"]["fonteResumo"]} */
  let fonteResumo;

  if (escopo === "selected" && selected) {
    fonteResumo = "selecao-manual";
    resumoExecutivo = {
      quantidadeVendas,
      faturamentoBruto: toMoneyString(selected.grossSalesBrl),
      lucroLiquido: toMoneyString(selected.netProfitBrl),
      margemPercentual: toStringOrNull(selected.marginPercent),
      vendasSaudaveis: toInt(selected.healthyCount, 0),
      vendasMargemCritica: toInt(selected.lowMarginCount, 0),
      vendasPrejuizo: toInt(selected.negativeCount, 0),
    };
  } else if (summary) {
    fonteResumo = "executive-summary";
    resumoExecutivo = {
      quantidadeVendas,
      faturamentoBruto: toMoneyString(summary.gross_sales_brl),
      lucroLiquido: toMoneyString(summary.contribution_profit_brl ?? summary.net_profit_brl),
      margemPercentual: toStringOrNull(summary.contribution_margin_percent),
      // Backend ainda não entrega contagem de vendas saudáveis no escopo de filtros.
      vendasSaudaveis:
        health?.healthy_count != null ? toInt(health.healthy_count, 0) : null,
      vendasMargemCritica: toInt(health?.low_margin_count, 0),
      vendasPrejuizo: toInt(health?.negative_sales_count, 0),
    };
  } else {
    fonteResumo = "vazio";
    resumoExecutivo = {
      quantidadeVendas,
      faturamentoBruto: "0.00",
      lucroLiquido: "0.00",
      margemPercentual: null,
      vendasSaudaveis: null,
      vendasMargemCritica: 0,
      vendasPrejuizo: 0,
    };
  }

  const account = context.account ?? { marketplaceAccountId: null, label: "—" };
  /** @type {VendasAggregatedReportConta[]} */
  const contas = [
    {
      id: account.marketplaceAccountId ?? null,
      label: toStringOrNull(account.label) ?? "Todas as contas",
    },
  ];

  const operationalFilter = context.operationalFilter ?? { id: "all", label: "Todos" };
  /** @type {VendasAggregatedReportFiltroOperacional[]} */
  const filtrosOperacionais =
    operationalFilter.id && operationalFilter.id !== "all"
      ? [{ id: String(operationalFilter.id), label: toStringOrNull(operationalFilter.label) ?? String(operationalFilter.id) }]
      : [];

  const rankingProducts = Array.isArray(input?.rankingProducts) ? input.rankingProducts : [];
  const porProduto =
    escopo === "filters" ? rankingProducts.map(mapProdutoEntry) : [];

  const distribuicaoPorConta = buildDistribuicaoPorConta({
    escopo,
    distributionByAccount: input?.distributionByAccount,
    accountLabelById: input?.accountLabelById,
    selectedDistribution: input?.selectedDistribution,
    fallbackContaLabel: contas[0]?.label,
  });

  const vendas =
    escopo === "selected" && Array.isArray(context.selectedSales) ? context.selectedSales : [];

  return {
    versao: VENDAS_AGGREGATED_REPORT_VERSION,
    escopo,
    geradoEm: new Date().toISOString(),
    periodo: {
      dataInicial: toStringOrNull(context.period?.startDate),
      dataFinal: toStringOrNull(context.period?.endDate),
      preset: toStringOrNull(context.period?.preset),
      label: toStringOrNull(context.period?.rangeDisplay) ?? toStringOrNull(context.period?.label) ?? "Período",
    },
    filtros: {
      // Preparado para multi-marketplace; hoje o recorte é resolvido por conta.
      marketplace: null,
      contas,
      busca: context.search?.hasQuery ? toStringOrNull(context.search?.query) : null,
      filtrosOperacionais,
      vendasSelecionadas: Array.isArray(context.selectedSalesIds) ? [...context.selectedSalesIds] : [],
    },
    resumoExecutivo,
    distribuicaoPorConta,
    agrupamentos: {
      // porConta espelha distribuicaoPorConta (mesma fonte, sem recálculo).
      // porStatus/porTipoEntrega preparados para fases futuras do backend.
      porConta: distribuicaoPorConta,
      porProduto,
      porStatus: [],
      porTipoEntrega: [],
    },
    vendas,
    _meta: {
      analiseLimitada: Boolean(context.sales?.truncatedScan),
      fonteResumo,
    },
  };
}
