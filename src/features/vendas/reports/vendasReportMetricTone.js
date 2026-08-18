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

/** @typedef {'green' | 'orange' | 'red' | 'neutral'} VendasReportMetricAccent */

/**
 * Acento visual (borda + ícone + status) de cada card do resumo executivo.
 * Somente exibição — não altera cálculos nem contratos. Regras de saúde S7:
 *   - monetário: > 0 saudável (verde) · = 0 crítico (laranja) · < 0 prejuízo (vermelho)
 *   - margem: > 5% saudável (verde) · 0%–5% crítico (laranja) · < 0% prejuízo (vermelho)
 *   - cards de categoria têm identidade fixa: Saudáveis (verde), Margem crítica (laranja), Prejuízo (vermelho)
 *
 * @param {string} metricId
 * @param {{ displayValue?: string; numericCount?: number | string | null; unavailable?: boolean }} input
 * @returns {{ accent: VendasReportMetricAccent, status: ('Saudável' | 'Crítico' | 'Prejuízo' | null) }}
 */
export function resolveVendasReportMetricAccent(metricId, input = {}) {
  const { displayValue, unavailable = false } = input;

  const monetary = () => {
    const n = parsePtBrDisplayNumber(displayValue);
    if (n == null) return { accent: "neutral", status: null };
    if (n > 0) return { accent: "green", status: "Saudável" };
    if (n < 0) return { accent: "red", status: "Prejuízo" };
    return { accent: "orange", status: "Crítico" };
  };

  switch (metricId) {
    case "revenue":
    case "netProfit":
      return monetary();
    case "margin": {
      if (unavailable) return { accent: "neutral", status: null };
      const n = parsePtBrDisplayNumber(displayValue);
      if (n == null) return { accent: "neutral", status: null };
      if (n > 5) return { accent: "green", status: "Saudável" };
      if (n < 0) return { accent: "red", status: "Prejuízo" };
      return { accent: "orange", status: "Crítico" };
    }
    case "healthy":
      // Identidade fixa verde (P_2.8.12F), mesmo padrão de Margem crítica/Prejuízo.
      return { accent: "green", status: null };
    case "lowMargin":
      return { accent: "orange", status: null };
    case "loss":
      return { accent: "red", status: null };
    default:
      return { accent: "neutral", status: null };
  }
}
