import { buildVendasSharePayload } from "./share/buildVendasSharePayload.js";

/**
 * @param {string | null | undefined} iso
 */
function toBrDateTimeLabel(iso) {
  if (!iso || String(iso).trim() === "") return "—";
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {string | null | undefined} value
 */
function parseBrMoneyToDecimalString(value) {
  if (!value || String(value).trim() === "") return "0.00";
  const raw = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

/**
 * @param {string | null | undefined} value
 */
function parseBrPercentToDecimalString(value) {
  if (!value || String(value).trim() === "") return null;
  const raw = String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

/**
 * @param {unknown} value
 */
function toInt(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

/**
 * @param {Record<string, unknown>} inboxItem
 */
export function buildDailySalesSummaryNotificationModalData(inboxItem) {
  const payload =
    inboxItem?.event_payload && typeof inboxItem.event_payload === "object"
      ? inboxItem.event_payload
      : {};
  const periodStart = payload.period_start != null ? String(payload.period_start) : "";
  const periodEnd = payload.period_end != null ? String(payload.period_end) : "";
  const periodo =
    payload.periodo != null && String(payload.periodo).trim() !== ""
      ? String(payload.periodo).trim()
      : `${toBrDateTimeLabel(periodStart)} até ${toBrDateTimeLabel(periodEnd)}`;

  const accountLabel =
    payload.conta != null && String(payload.conta).trim() !== ""
      ? String(payload.conta).trim()
      : "Todas as contas";

  const quantidadeVendas = toInt(payload.vendas, 0);
  const faturamentoBruto = parseBrMoneyToDecimalString(payload.faturamento);
  const lucroLiquido = parseBrMoneyToDecimalString(payload.lucro);
  const margemPercentual = parseBrPercentToDecimalString(payload.margem);

  const vendasSaudaveis =
    payload.saudaveis != null ? toInt(payload.saudaveis, 0) : null;
  const vendasMargemCritica = toInt(payload.margem_critica, 0);
  const vendasPrejuizo = toInt(payload.prejuizo, 0);

  const reportContext = {
    version: 1,
    period: {
      preset: "custom",
      startDate: periodStart,
      endDate: periodEnd,
      label: "Período analisado",
      rangeDisplay: `${toBrDateTimeLabel(periodStart)} até ${toBrDateTimeLabel(periodEnd)}`,
    },
    account: {
      marketplaceAccountId: null,
      label: accountLabel,
    },
    operationalFilter: { id: "all", label: "Todos" },
    search: { query: "", hasQuery: false },
    sales: {
      totalCount: quantidadeVendas,
      listRowsTotal: quantidadeVendas,
      truncatedScan: false,
      pageItemIds: [],
      selectedIds: [],
    },
    reportScope: "filters",
    selectedSales: [],
    selectedSalesIds: [],
    selectedSalesMetrics: null,
    listSalesRows: [],
    capabilities: ["previewModal", "executiveStub", "notificationDailySalesSummary"],
  };

  const aggregatedReport = {
    versao: 1,
    escopo: "filters",
    geradoEm:
      inboxItem?.created_at != null ? String(inboxItem.created_at) : new Date().toISOString(),
    periodo: {
      dataInicial: periodStart || null,
      dataFinal: periodEnd || null,
      preset: "custom",
      label: periodo,
    },
    filtros: {
      marketplace: null,
      contas: [{ id: null, label: accountLabel }],
      busca: null,
      filtroOperacionalId: "all",
      filtrosOperacionais: [],
      vendasSelecionadas: [],
    },
    resumoExecutivo: {
      quantidadeVendas,
      faturamentoBruto,
      lucroLiquido,
      margemPercentual,
      vendasSaudaveis,
      vendasMargemCritica,
      vendasPrejuizo,
    },
    distribuicaoPorConta: [],
    agrupamentos: {
      porConta: [],
      porProduto: [],
      porStatus: [],
      porTipoEntrega: [],
    },
    vendas: [],
    _meta: {
      analiseLimitada: false,
      listRowsTotal: quantidadeVendas,
      fonteResumo: "template_payload",
    },
  };

  const executivePreview = {
    revenueValue: String(payload.faturamento ?? "—"),
    netProfitValue: String(payload.lucro ?? "—"),
    marginValue: String(payload.margem ?? "—"),
    marginUnavailable: payload.margem == null,
    healthyCount: vendasSaudaveis ?? 0,
    healthyUnavailable: vendasSaudaveis == null,
    healthyValue: vendasSaudaveis == null ? "—" : undefined,
    lowMarginCount: vendasMargemCritica,
    negativeCount: vendasPrejuizo,
    loading: false,
    empty: false,
    error: null,
    schema: null,
  };

  const sharePayload = buildVendasSharePayload(aggregatedReport, reportContext);
  if (sharePayload?.resumoExecutivoSchema) {
    executivePreview.schema = sharePayload.resumoExecutivoSchema;
  }

  return {
    modalTitle: "Resumo de vendas",
    modalSubtitle: "Período analisado",
    reportContext,
    aggregatedReport,
    executivePreview,
    eventId: inboxItem?.event_id != null ? String(inboxItem.event_id) : null,
  };
}
