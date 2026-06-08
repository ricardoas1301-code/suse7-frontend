// ======================================================================
// Agrega métricas das vendas selecionadas — somente campos já na lista.
// ======================================================================

import { getVendasTableFinancialHealthToneClass } from "../../../utils/saleHealthUi";

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function parseApiMoney(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {readonly Record<string, unknown>[]} selectedRows
 * @returns {{
 *   selectedSales: readonly Record<string, unknown>[];
 *   selectedSalesIds: string[];
 *   ordersCount: number;
 *   grossSalesBrl: string;
 *   netProfitBrl: string;
 *   marginPercent: string | null;
 *   marginUnavailable: boolean;
 *   lowMarginCount: number;
 *   negativeCount: number;
 *   healthyCount: number;
 * }}
 */
export function aggregateVendasSelectedSalesMetrics(selectedRows) {
  const selectedSales = Array.isArray(selectedRows) ? selectedRows : [];
  const selectedSalesIds = [];

  let grossTotal = 0;
  let profitTotal = 0;
  let hasGross = false;
  let hasProfit = false;
  let lowMarginCount = 0;
  let negativeCount = 0;
  let healthyCount = 0;

  for (const row of selectedSales) {
    const id = row.item_id ?? row.sale_item_id;
    const sid = id != null ? String(id).trim() : "";
    if (sid) selectedSalesIds.push(sid);

    const f = row.financials != null && typeof row.financials === "object" ? row.financials : {};
    const saleN = parseApiMoney(f.sale_price);
    const profitN = parseApiMoney(f.profit_brl);

    if (saleN != null) {
      grossTotal += saleN;
      hasGross = true;
    }
    if (profitN != null) {
      profitTotal += profitN;
      hasProfit = true;
    }

    if (f.health === "healthy") healthyCount += 1;
    else if (f.health === "critical") negativeCount += 1;
    else if (f.health === "attention") {
      const tone = getVendasTableFinancialHealthToneClass(f.margin_percent);
      if (tone === "vendas-page__fin--health-warn") lowMarginCount += 1;
    }
  }

  const marginUnavailable = !hasGross || grossTotal <= 0 || !hasProfit;
  const marginPercent = marginUnavailable
    ? null
    : ((profitTotal / grossTotal) * 100).toFixed(2);

  return {
    selectedSales,
    selectedSalesIds,
    ordersCount: selectedSales.length,
    grossSalesBrl: hasGross ? grossTotal.toFixed(2) : "0.00",
    netProfitBrl: hasProfit ? profitTotal.toFixed(2) : "0.00",
    marginPercent,
    marginUnavailable,
    lowMarginCount,
    negativeCount,
    healthyCount,
  };
}

/**
 * @param {number} count
 */
export function formatVendasSelectionCountLabel(count) {
  const n = Math.max(0, Number(count) || 0);
  if (n === 1) return "1 venda selecionada";
  return `${n.toLocaleString("pt-BR")} vendas selecionadas`;
}
