// ======================================================================
// Agrega métricas das vendas selecionadas — somente campos já na lista.
// ======================================================================

import { getVendasTableFinancialHealthToneClass } from "../../../utils/saleHealthUi";
import Decimal from "decimal.js";

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
function parseApiMoney(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    return new Decimal(String(raw).replace(",", "."));
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown>} financials
 * @param {string[]} paths
 * @returns {Decimal | null}
 */
function pickMoneyFromPaths(row, financials, paths) {
  for (const path of paths) {
    const [scope, key] = path.includes(":") ? path.split(":") : ["financials", path];
    const source = scope === "row" ? row : financials;
    const keyParts = String(key).split(".");
    let value = source;
    for (const part of keyParts) {
      if (value == null || typeof value !== "object") {
        value = null;
        break;
      }
      value = value[part];
    }
    const parsed = parseApiMoney(value);
    if (parsed != null) return parsed;
  }
  return null;
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
 *   avgTicketBrl: string | null;
 *   marketplacePayoutBrl: string | null;
 *   costs: {
 *     custoProduto: string;
 *     comissaoMarketplace: string;
 *     frete: string;
 *     impostos: string;
 *     operacaoEmbalagem: string;
 *     mlAds: string;
 *     custosOperacionais: string;
 *   };
 * }}
 */
export function aggregateVendasSelectedSalesMetrics(selectedRows) {
  const selectedSales = Array.isArray(selectedRows) ? selectedRows : [];
  const selectedSalesIds = [];

  let grossTotal = new Decimal(0);
  let profitTotal = new Decimal(0);
  let hasGross = false;
  let hasProfit = false;
  let lowMarginCount = 0;
  let negativeCount = 0;
  let healthyCount = 0;
  let payoutTotal = new Decimal(0);
  let hasPayout = false;
  let custoProdutoTotal = new Decimal(0);
  let comissaoTotal = new Decimal(0);
  let freteTotal = new Decimal(0);
  let impostosTotal = new Decimal(0);
  let operacaoEmbalagemTotal = new Decimal(0);
  let mlAdsTotal = new Decimal(0);
  let custosOperacionaisTotal = new Decimal(0);

  for (const row of selectedSales) {
    const id = row.item_id ?? row.sale_item_id;
    const sid = id != null ? String(id).trim() : "";
    if (sid) selectedSalesIds.push(sid);

    const f = row.financials != null && typeof row.financials === "object" ? row.financials : {};
    const saleN = parseApiMoney(f.sale_price);
    const profitN = parseApiMoney(f.profit_brl);

    if (saleN != null) {
      grossTotal = grossTotal.plus(saleN);
      hasGross = true;
    }
    if (profitN != null) {
      profitTotal = profitTotal.plus(profitN);
      hasProfit = true;
    }
    const payoutN = pickMoneyFromPaths(row, f, ["net_received", "net_received_amount_brl"]);
    if (payoutN != null) {
      payoutTotal = payoutTotal.plus(payoutN);
      hasPayout = true;
    }

    const custoProdutoN = pickMoneyFromPaths(row, f, [
      "row:product_cost_only_brl",
      "product_cost_only_brl",
      "product_cost_amount",
      "internal_costs.product_cost_brl",
    ]);
    if (custoProdutoN != null) custoProdutoTotal = custoProdutoTotal.plus(custoProdutoN);

    const comissaoN = pickMoneyFromPaths(row, f, [
      "marketplace_fee_amount",
      "marketplace_fee_amount_brl",
      "commission",
      "marketplace_fee.amount_brl",
    ]);
    if (comissaoN != null) comissaoTotal = comissaoTotal.plus(comissaoN);

    const freteN = pickMoneyFromPaths(row, f, ["shipping_cost", "shipping_cost_amount", "shipping_amount_brl"]);
    if (freteN != null) freteTotal = freteTotal.plus(freteN);

    const impostosN = pickMoneyFromPaths(row, f, [
      "internal_taxes",
      "internal_tax_amount",
      "internal_costs.internal_tax_brl",
      "row:tax_cost_brl",
    ]);
    if (impostosN != null) impostosTotal = impostosTotal.plus(impostosN);

    const operacaoEmbalagemN = pickMoneyFromPaths(row, f, [
      "operation_packaging_cost",
      "internal_costs.operation_packaging_cost_brl",
      "row:operation_packaging_cost_brl",
    ]);
    if (operacaoEmbalagemN != null) operacaoEmbalagemTotal = operacaoEmbalagemTotal.plus(operacaoEmbalagemN);

    const mlAdsN = pickMoneyFromPaths(row, f, ["ads_cost_brl", "row:ads_cost_brl"]);
    if (mlAdsN != null) mlAdsTotal = mlAdsTotal.plus(mlAdsN);

    const custosOperacionaisN = pickMoneyFromPaths(row, f, [
      "operational_costs_brl",
      "row:operational_costs_brl",
    ]);
    if (custosOperacionaisN != null) custosOperacionaisTotal = custosOperacionaisTotal.plus(custosOperacionaisN);

    if (f.health === "healthy") healthyCount += 1;
    else if (f.health === "critical") negativeCount += 1;
    else if (f.health === "attention") {
      const tone = getVendasTableFinancialHealthToneClass(f.margin_percent);
      if (tone === "vendas-page__fin--health-warn") lowMarginCount += 1;
    }
  }

  const marginUnavailable = !hasGross || grossTotal.lte(0) || !hasProfit;
  const marginPercent = marginUnavailable
    ? null
    : profitTotal.div(grossTotal).mul(100).toFixed(2);

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
    avgTicketBrl:
      hasGross && selectedSales.length > 0
        ? grossTotal.div(selectedSales.length).toFixed(2)
        : null,
    marketplacePayoutBrl: hasPayout ? payoutTotal.toFixed(2) : null,
    costs: {
      custoProduto: custoProdutoTotal.toFixed(2),
      comissaoMarketplace: comissaoTotal.toFixed(2),
      frete: freteTotal.toFixed(2),
      impostos: impostosTotal.toFixed(2),
      operacaoEmbalagem: operacaoEmbalagemTotal.toFixed(2),
      mlAds: mlAdsTotal.toFixed(2),
      custosOperacionais: custosOperacionaisTotal.toFixed(2),
    },
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
