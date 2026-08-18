import { resolveSyncStepStatusBucket, resolveSyncStepStatusLabel } from "./marketplaceSyncExecutionSummary.js";

const ERROR_ACTION_GUIDANCE = " (reconecte o Mercado Livre ou fale com o suporte)";

/**
 * @param {unknown} status
 */
function executiveStatusLabel(status) {
  const bucket = resolveSyncStepStatusBucket(status);
  if (bucket === "completed") return "Concluído";
  if (bucket === "error") return "Com erro";
  if (bucket === "running") return "Em andamento";
  if (bucket === "pending") return "Na fila";
  return resolveSyncStepStatusLabel(status);
}

/**
 * @param {unknown} status
 * @param {boolean} [withErrorGuidance]
 */
function executiveStatusText(status, withErrorGuidance = false) {
  const label = executiveStatusLabel(status);
  if (withErrorGuidance && resolveSyncStepStatusBucket(status) === "error") {
    return `${label}${ERROR_ACTION_GUIDANCE}`;
  }
  return label;
}

/**
 * @param {Record<string, unknown> | null | undefined} summary
 */
function findChecklistStep(summary, key) {
  const checklist = Array.isArray(summary?.checklist) ? summary.checklist : [];
  return checklist.find((row) => String(row?.key || "") === key) ?? null;
}

/**
 * @param {Record<string, unknown> | null | undefined} connection
 * @param {Record<string, unknown> | null} monitoring
 */
function resolveMonitoringExecutiveLabel(connection, monitoring) {
  const headline =
    connection?.monitoring_headline != null ? String(connection.monitoring_headline).trim() : "";
  if (/monitoramento ativo/i.test(headline)) return "Ativo";
  if (headline && /ativo/i.test(headline) && !/inativo|desativado|pendente|fila/i.test(headline)) {
    return "Ativo";
  }
  if (
    connection?.health === "connected" &&
    connection?.show_reconnect !== true &&
    headline
  ) {
    return "Ativo";
  }
  if (resolveSyncStepStatusBucket(monitoring?.status) === "completed") return "Ativo";
  return executiveStatusLabel(monitoring?.status);
}

/**
 * @param {Record<string, unknown> | null} listings
 * @param {Record<string, unknown> | null} products
 */
function resolveListingsProductsExecutiveLabel(listings, products) {
  const buckets = [
    resolveSyncStepStatusBucket(listings?.status),
    resolveSyncStepStatusBucket(products?.status),
  ];
  if (buckets.some((bucket) => bucket === "error")) {
    return `Com erro${ERROR_ACTION_GUIDANCE}`;
  }
  if (buckets.some((bucket) => bucket === "running")) return "Em andamento";
  if (buckets.some((bucket) => bucket === "pending")) return "Com pendências";
  if (buckets.every((bucket) => bucket === "completed")) return "Concluído";
  return "Com pendências";
}

/**
 * @param {Record<string, unknown> | null | undefined} histRow
 */
function resolveHistoricalExecutiveLabel(histRow) {
  if (!histRow) return "—";
  return executiveStatusText(histRow.status, true);
}

/**
 * Resumo executivo (5 linhas) para o card Sincronização e diagnóstico.
 * @param {Record<string, unknown> | null | undefined} summary
 * @param {{ connection?: Record<string, unknown> | null }} [options]
 * @returns {string[]}
 */
export function buildMercadoLivreSyncExecutiveSummaryLines(summary, options = {}) {
  if (!summary) return [];

  const connection = options.connection ?? null;
  const presentation =
    summary.sync_presentation && typeof summary.sync_presentation === "object"
      ? summary.sync_presentation
      : null;

  const recent = findChecklistStep(summary, "sales_recent");
  const hist = findChecklistStep(summary, "historical_sales");
  const listings = findChecklistStep(summary, "listings");
  const products = findChecklistStep(summary, "products");
  const monitoring = findChecklistStep(summary, "monitoring");

  const integrationLabel =
    presentation?.sync_summary_label != null && String(presentation.sync_summary_label).trim() !== ""
      ? String(presentation.sync_summary_label).trim()
      : summary?.title != null && String(summary.title).trim() !== ""
        ? String(summary.title).trim()
        : "Integração Mercado Livre";

  return [
    `Dados recentes: ${recent ? executiveStatusText(recent.status, true) : "—"}`,
    `Histórico de vendas: ${resolveHistoricalExecutiveLabel(hist)}`,
    `Anúncios e produtos: ${resolveListingsProductsExecutiveLabel(listings, products)}`,
    `Monitoramento: ${resolveMonitoringExecutiveLabel(connection, monitoring)}`,
    `Integração Mercado Livre: ${integrationLabel}`,
  ];
}
