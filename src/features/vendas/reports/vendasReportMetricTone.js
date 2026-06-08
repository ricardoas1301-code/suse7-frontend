// ======================================================================
// Tons semânticos dos cards do resumo executivo do relatório (somente exibição).
// ======================================================================

import { EXECUTIVE_PANEL_EMPTY_KPI_VALUE } from "../../../components/sales/vendasExecutivePanelUx";

/** @typedef {'neutral' | 'orange' | 'positive' | 'positive-soft' | 'critical' | 'warning'} VendasReportMetricTone */

/**
 * @param {string | null | undefined} displayValue
 * @returns {number | null}
 */
export function parsePtBrDisplayNumber(displayValue) {
  const raw = String(displayValue ?? "").trim();
  if (!raw || raw === "—" || raw === EXECUTIVE_PANEL_EMPTY_KPI_VALUE) return null;
  const cleaned = raw
    .replace(/R\$\s?/gi, "")
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number | string | null | undefined} value
 */
function parseCount(value) {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * @param {string} metricId
 * @param {{
 *   displayValue?: string;
 *   numericCount?: number | string | null;
 *   unavailable?: boolean;
 * }} input
 * @returns {VendasReportMetricTone}
 */
export function resolveVendasReportMetricTone(metricId, input = {}) {
  const { displayValue, numericCount, unavailable = false } = input;

  switch (metricId) {
    case "quantity":
      return "orange";
    case "revenue": {
      const n = parsePtBrDisplayNumber(displayValue);
      if (n == null || n === 0) return "neutral";
      return n > 0 ? "positive" : "neutral";
    }
    case "netProfit": {
      const n = parsePtBrDisplayNumber(displayValue);
      if (n == null || n === 0) return "neutral";
      if (n < 0) return "critical";
      return "positive";
    }
    case "margin": {
      if (unavailable) return "neutral";
      const n = parsePtBrDisplayNumber(displayValue);
      if (n == null || n === 0) return "neutral";
      if (n < 0) return "critical";
      return "positive";
    }
    case "healthy": {
      if (unavailable) return "neutral";
      return parseCount(numericCount) > 0 ? "positive" : "neutral";
    }
    case "lowMargin": {
      return parseCount(numericCount) > 0 ? "warning" : "positive-soft";
    }
    case "loss": {
      return parseCount(numericCount) > 0 ? "critical" : "positive-soft";
    }
    default:
      return "neutral";
  }
}
