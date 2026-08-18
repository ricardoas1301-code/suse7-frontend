// ======================================================================
// Campos canônicos do executive-summary — puro, sem formatação UI.
// Fonte única para Vendas ao Vivo e testes de contrato.
// ======================================================================

import Decimal from "decimal.js";

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
function parseDecimalOrNull(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const dec = new Decimal(String(raw).replace(",", "."));
    return dec.isFinite() ? dec : null;
  } catch {
    return null;
  }
}

/**
 * Repasse, lucro e margem — contrato API (sem recálculo local).
 * @param {Record<string, unknown> | null | undefined} summary
 */
export function resolveDailySummaryCanonicalResultFields(summary) {
  const marginFromApi = parseDecimalOrNull(summary?.contribution_margin_percent);
  return {
    netProfitRaw: summary?.contribution_profit_brl ?? summary?.net_profit_brl ?? null,
    marginRaw: summary?.contribution_margin_percent ?? null,
    marginDecFull:
      marginFromApi != null
        ? marginFromApi.toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
        : null,
    payoutRaw: summary?.you_receive_brl ?? summary?.net_received_brl ?? null,
  };
}

/**
 * Total de custos efetivo — contrato API (sem recálculo local).
 * @param {Record<string, unknown> | null | undefined} summary
 * @returns {string | null}
 */
export function resolveExecutiveSummaryEffectiveTotalCostsBrl(summary) {
  if (!summary) return null;
  const raw = summary.total_costs_brl;
  if (raw == null || String(raw).trim() === "") return null;
  const dec = parseDecimalOrNull(raw);
  return dec != null ? dec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2) : null;
}

/**
 * Créditos de liquidação ML — contrato API (sem recálculo local).
 * @param {Record<string, unknown> | null | undefined} summary
 * @returns {string | null}
 */
export function resolveExecutiveSummarySettlementCreditsBrl(summary) {
  if (!summary) return null;
  const raw = summary.marketplace_settlement_credits_brl;
  if (raw == null || String(raw).trim() === "") return null;
  const dec = parseDecimalOrNull(raw);
  return dec != null ? dec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2) : null;
}
