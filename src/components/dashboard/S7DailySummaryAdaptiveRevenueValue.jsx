// ======================================================================
// Faturamento — Resumo Diário: fonte adaptável (alias do preset revenue).
// ======================================================================

import S7DailySummaryAdaptiveMetricValue from "./S7DailySummaryAdaptiveMetricValue.jsx";

/**
 * @param {{ value?: string | number | null }} props
 */
export default function S7DailySummaryAdaptiveRevenueValue({ value }) {
  return <S7DailySummaryAdaptiveMetricValue value={value} variant="revenue" />;
}
