// ======================================================
// S4.3.7.1 — Helpers puros do gráfico divergente da Precificação.
// Decimal somente para sinal, módulo e proporção; sem fórmulas financeiras.
// ======================================================

import Decimal from "decimal.js";

/** @param {unknown} raw */
export function parseLucroOuMargemDecimal(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const value = new Decimal(String(raw).trim().replace(",", ".").replace("%", ""));
    return value.isFinite() ? value : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null} profit */
export function resolverLadoLucroListingType(profit) {
  if (profit == null || !profit.isFinite()) return "pending";
  if (profit.isZero()) return "zero";
  return profit.isNeg() ? "negative" : "positive";
}

/** @param {(Decimal | null)[]} profits */
export function calcularMaxAbsLucroListingType(profits) {
  return profits.reduce((max, profit) => {
    if (profit == null || !profit.isFinite()) return max;
    const absolute = profit.abs();
    return absolute.greaterThan(max) ? absolute : max;
  }, new Decimal(0));
}

/**
 * @param {Decimal | null} profit
 * @param {Decimal} maxAbsProfit
 */
export function calcularLarguraLucroListingTypePct(profit, maxAbsProfit) {
  if (profit == null || !profit.isFinite() || profit.isZero() || maxAbsProfit.lte(0)) return 0;
  return Number(profit.abs().div(maxAbsProfit).times(100).toFixed(4));
}
