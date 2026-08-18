// ======================================================================
// Formatação pt-BR de métricas acumuladas — strings da API (sem cálculo).
// ======================================================================

import { DASH, formatBrlApi, formatPercentApi } from "../../components/sales/saleRayxFormat.js";

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatAccumulatedQuantity(value) {
  if (value == null || String(value).trim() === "") return DASH;
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return DASH;
  return Math.trunc(n).toLocaleString("pt-BR");
}

/**
 * @param {unknown} brlRaw
 * @returns {string}
 */
export function formatAccumulatedBrl(brlRaw) {
  if (brlRaw == null || String(brlRaw).trim() === "") return DASH;
  return formatBrlApi(String(brlRaw).trim());
}

/**
 * @param {unknown} pctRaw
 * @returns {string}
 */
export function formatAccumulatedPercent(pctRaw) {
  if (pctRaw == null || String(pctRaw).trim() === "") return DASH;
  const formatted = formatPercentApi(String(pctRaw).trim());
  return formatted === DASH && String(pctRaw).trim() === "0.00" ? "0%" : formatted;
}

/**
 * @param {unknown} scope
 * @returns {{
 *   salesQuantity: string;
 *   salesAmount: string;
 *   profitAmount: string;
 *   profitPercent: string;
 * }}
 */
export function formatAccumulatedPerformanceScope(scope) {
  const s = scope != null && typeof scope === "object" ? /** @type {Record<string, unknown>} */ (scope) : null;
  return {
    salesQuantity: formatAccumulatedQuantity(s?.sales_quantity),
    salesAmount: formatAccumulatedBrl(s?.sales_amount_brl),
    profitAmount: formatAccumulatedBrl(s?.sales_profit_brl),
    profitPercent: formatAccumulatedPercent(s?.sales_profit_percent),
  };
}
