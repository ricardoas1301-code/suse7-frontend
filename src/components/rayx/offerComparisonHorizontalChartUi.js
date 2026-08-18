// ======================================================
// S4.3.6.23 — Helpers UX do gráfico horizontal (legado / regressão).
// 6.24 evolui para divergente; mantém API de teste e utilitários.
// ======================================================

export {
  montarTextoResumoBarraHorizontal,
  pickSalePriceRawForCompareChart,
} from "./offerComparisonDivergingChartUi.js";

/** Largura mínima relativa (%) da barra para texto interno (legado 6.23). */
export const HORIZONTAL_BAR_TEXT_INSIDE_MIN_PCT = 38;

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parseScaleOnlyProfit(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Ordena séries por lucro R$ desc (nulls no fim) — legado number.
 * @template {{ value: number | null }} T
 * @param {T[]} series
 * @returns {T[]}
 */
export function ordenarSeriesComparativoPorLucroDesc(series) {
  return [...series].sort((a, b) => {
    const av = a.value;
    const bv = b.value;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (bv !== av) return bv - av;
    return 0;
  });
}

/**
 * @param {number | null} value
 * @param {number} maxAbs
 */
export function calcularLarguraBarraHorizontalPct(value, maxAbs) {
  if (value == null || !Number.isFinite(value)) return 0;
  if (!(maxAbs > 0)) return value === 0 ? 4 : 0;
  const pct = (Math.abs(value) / maxAbs) * 100;
  if (value === 0) return Math.max(4, Math.min(pct, 100));
  return Math.max(6, Math.min(pct, 100));
}

/**
 * @param {number} widthPct
 * @param {number} [minPct]
 */
export function deveExibirTextoDentroDaBarraHorizontal(
  widthPct,
  minPct = HORIZONTAL_BAR_TEXT_INSIDE_MIN_PCT,
) {
  return Number.isFinite(widthPct) && widthPct >= minPct;
}
