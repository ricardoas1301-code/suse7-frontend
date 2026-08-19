// ======================================================================
// UX dos 7 cards executivos — mensagens e detecção de vazio (somente exibição).
// ======================================================================

/** Mensagem curta nos cards quando a API falha (sem stacktrace). */
export const EXECUTIVE_PANEL_ERROR_MESSAGE = "Não foi possível carregar os dados.";

/** Top 10 sem vendas no filtro/período. */
export const EXECUTIVE_PANEL_EMPTY_RANKING_MESSAGE = "Nenhuma venda encontrada";

/** Placeholder neutro nos KPIs quando não há vendas no período. */
export const EXECUTIVE_PANEL_EMPTY_KPI_VALUE = "0,00";

/**
 * Sinal negativo vindo da API (somente para classe visual; sem recálculo financeiro).
 * @param {unknown} raw
 */
export function isExecutiveApiDecimalNegative(raw) {
  const s = String(raw ?? "").trim();
  return s.startsWith("-") && s !== "-0" && s !== "-0.00" && s !== "-0.0";
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function parseExecutiveCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Resumo sem vendas para os filtros atuais (não confundir com erro de API).
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function isExecutiveSummaryEmptyForFilters(summary) {
  if (summary == null || typeof summary !== "object") return false;
  const orders = parseExecutiveCount(summary.orders_count);
  const qty = parseExecutiveCount(summary.items_quantity_sold ?? summary.orders_count);
  return orders === 0 && qty === 0;
}
