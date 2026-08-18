// ======================================================
// Gráfico comparativo — só exibe strings/normalização visual da API.
// Altura/largura das barras: parse numérico apenas para escala (não recalcula negócio).
// ======================================================

import { memo, useMemo } from "react";
import { formatCatalogBRL } from "../utils/productCatalogRow";
import {
  buildOrderedScenarioRows,
  cardHeadingLabel,
  getOfferStatusFromMargin,
  offerSemanticSuffixToCssClass,
} from "./mercadoLivrePricingScenarioCompareShared.js";
import { resolveMlScenarioTabId } from "./MercadoLivrePricingScenarioRaiox.jsx";
import OfferComparisonDivergingChart from "./rayx/OfferComparisonDivergingChart.jsx";
import {
  OFFER_COMPARE_BASELINE_LABEL,
  formatMarginCompactFromApiString,
  montarTextoResumoBarraHorizontal,
  parseLucroDecimalComparativo,
  pickSalePriceRawForCompareChart,
} from "./rayx/offerComparisonDivergingChartUi.js";
import { isOfferComparisonScenarioPending } from "./rayx/offerComparisonPromotionTruth.js";
import S7Tooltip from "./ui/S7Tooltip.jsx";

/** @param {string | null | undefined} s */
function formatBrlLabelFromApiString(s) {
  if (s == null || String(s).trim() === "") return "—";
  const dec = parseLucroDecimalComparativo(s);
  if (dec == null) return "—";
  return formatCatalogBRL(Number(dec.toFixed(2)));
}

/** @param {string | null | undefined} s */
function formatMarginLabelFromApiString(s) {
  if (s == null || String(s).trim() === "") return "—";
  return `${String(s).replace(".", ",")} %`;
}

/**
 * Lucro em R$ exibido no topo da barra: mesma fonte que o card (API), com fallback legado fora de `result`.
 * @param {Record<string, unknown>} r — cenário
 * @param {Record<string, unknown> | null} res — `scenario.result`
 */
function pickRawProfitBrlForDisplay(r, res) {
  if (res?.profit_brl != null && String(res.profit_brl).trim() !== "") return String(res.profit_brl);
  if (r.profit_brl != null && String(r.profit_brl).trim() !== "") return String(r.profit_brl);
  return "";
}

/** Rótulo azul sob a barra: só a primeira palavra (baseline incluído, ex.: “Preço de venda” → “Preço”). Tooltip mantém o nome completo via `shortLabel`. */
function getFirstWordLabel(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts[0] ?? "";
}

/**
 * `enablePagePositiveCompact`: na página, quando todos os lucros são ≥ 0, reduz só a altura visual do plot.
 * `laneMetaLayout="stacked-left"`: bloco textual vertical à esquerda da lane (legado 6.20).
 * `laneMetaLayout="diverging-ranked"`: barras divergentes + título acoplado (Comparativo 6.24).
 *
 * @param {{
 *   scenarios: unknown[];
 *   selectedScenarioTabId?: string | null;
 *   preserveScenarioDisplayOrder?: boolean;
 *   enablePagePositiveCompact?: boolean;
 *   laneMetaLayout?: "default" | "stacked-left" | "diverging-ranked" | "horizontal-ranked";
 * }} props
 */
function MercadoLivrePricingScenarioCompareChartInner({
  scenarios,
  selectedScenarioTabId = null,
  preserveScenarioDisplayOrder = false,
  enablePagePositiveCompact = false,
  laneMetaLayout = "default",
}) {
  const rows = useMemo(
    () => buildOrderedScenarioRows(scenarios, { preserveInputOrder: preserveScenarioDisplayOrder }),
    [scenarios, preserveScenarioDisplayOrder],
  );

  /** Séries: lucro Decimal para divergente; number legado só para barras verticais. */
  const chartSeries = useMemo(() => {
    return rows.map(({ scenario, group }, originIndex) => {
      const r = /** @type {Record<string, unknown>} */ (scenario);
      const res =
        r.result != null && typeof r.result === "object"
          ? /** @type {Record<string, unknown>} */ (r.result)
          : null;
      const rawProfit = pickRawProfitBrlForDisplay(r, res);
      const rawMargin =
        res?.margin_pct != null && String(res.margin_pct).trim() !== ""
          ? String(res.margin_pct)
          : r.margin_pct != null && String(r.margin_pct).trim() !== ""
            ? String(r.margin_pct)
            : "";
      const rawSale = pickSalePriceRawForCompareChart(r, res);
      const profitDec = parseLucroDecimalComparativo(rawProfit || null);
      const profitN = profitDec != null ? Number(profitDec.toFixed(4)) : null;
      const st = r.starts_at != null ? String(r.starts_at) : "";
      const ed = r.ends_at != null ? String(r.ends_at) : "";
      const marginTone = getOfferStatusFromMargin(rawMargin || null);
      const marginHealthClass =
        marginTone != null ? offerSemanticSuffixToCssClass(marginTone.color) : "";
      const statusLabel = marginTone?.label != null ? String(marginTone.label) : "";
      const heading = cardHeadingLabel(scenario);
      const isBaseline = group === "baseline";
      const shortLabel = isBaseline ? OFFER_COMPARE_BASELINE_LABEL : heading;
      const tickLabel = getFirstWordLabel(isBaseline ? "Preço de venda" : heading);
      const tabId = resolveMlScenarioTabId(scenario) || "baseline";
      const sid = String(r.scenario_id ?? r.promotion_id ?? r.promotion_stable_key ?? "").trim();
      const labelText = formatBrlLabelFromApiString(rawProfit || null);
      const saleLabelText = formatBrlLabelFromApiString(rawSale || null);
      const marginLabelText = formatMarginLabelFromApiString(rawMargin || null);
      const marginCompactText = formatMarginCompactFromApiString(rawMargin || null);
      const pending = isOfferComparisonScenarioPending(scenario);
      const finMeta =
        r._offer_comparison_financial != null && typeof r._offer_comparison_financial === "object"
          ? /** @type {Record<string, unknown>} */ (r._offer_comparison_financial)
          : null;
      const canonicalSource =
        finMeta?.canonical_source != null ? String(finMeta.canonical_source) : null;
      const scenarioStatus =
        finMeta?.scenario_status != null
          ? String(finMeta.scenario_status)
          : finMeta?.truth_status != null
            ? String(finMeta.truth_status)
            : null;
      let financialAvailability =
        /** @type {"RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED"} */ (
          "RESOLVED_NUMERIC"
        );
      if (pending) {
        financialAvailability = "PENDING";
      } else if (
        canonicalSource === "zero_canonico" ||
        scenarioStatus === "UNCONFIRMED_EMPTY"
      ) {
        financialAvailability = "NO_FINANCIAL_DATA";
      } else if (profitDec == null) {
        financialAvailability = "NO_FINANCIAL_DATA";
      }

      return {
        key: `${tabId}::${sid}::${st}::${ed}`,
        tabId,
        shortLabel,
        tickLabel,
        group,
        isBaseline,
        originIndex,
        value: profitN,
        profitDec,
        pending,
        error: false,
        financialAvailability,
        canonicalSource,
        scenarioStatus,
        labelText,
        saleLabelText,
        marginLabelText,
        marginCompactText,
        marginHealthClass,
        statusLabel,
        summaryText: montarTextoResumoBarraHorizontal({
          saleLabel: saleLabelText,
          profitLabel: labelText,
          marginLabel: marginCompactText,
        }),
      };
    });
  }, [rows]);

  const profitScale = useMemo(() => scaleSymmetric(chartSeries.map((s) => s.value)), [chartSeries]);

  const plotCompactPositive = useMemo(() => {
    if (!enablePagePositiveCompact) return false;
    const vals = chartSeries.map((s) => s.value).filter((v) => v != null && Number.isFinite(v));
    if (vals.length === 0) return false;
    return !vals.some((v) => v < 0);
  }, [enablePagePositiveCompact, chartSeries]);

  if (rows.length === 0) return null;

  const divergingRanked =
    laneMetaLayout === "diverging-ranked" || laneMetaLayout === "horizontal-ranked";
  const chartRootClass = [
    "s7-ml-scenario-chart",
    plotCompactPositive ? "s7-ml-scenario-chart--plot-compact-positive" : "",
    laneMetaLayout === "stacked-left" ? "s7-ml-scenario-chart--lane-stacked-left" : "",
    divergingRanked ? "s7-ml-scenario-chart--diverging-ranked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={chartRootClass}
      role="img"
      aria-label="Comparativo de ofertas: valor de venda, lucro em reais e margem percentual"
    >
      <div className="s7-ml-scenario-chart__block">
        {divergingRanked ? (
          <OfferComparisonDivergingChart series={chartSeries} selectedTabId={selectedScenarioTabId} />
        ) : (
          <BarRow
            series={chartSeries}
            scale={profitScale}
            valueKey="profit"
            selectedTabId={selectedScenarioTabId}
            laneMetaLayout={laneMetaLayout}
          />
        )}
      </div>

      <ul className="s7-ml-scenario-chart__legend" aria-hidden>
        <li>
          <span className="s7-ml-scenario-chart__swatch s7-ml-scenario-chart__swatch--health-critical" /> Crítico
          <span className="s7-ml-scenario-chart__legend-hint"> · margem abaixo de zero</span>
        </li>
        <li>
          <span className="s7-ml-scenario-chart__swatch s7-ml-scenario-chart__swatch--health-regular" /> Regular
          <span className="s7-ml-scenario-chart__legend-hint"> · margem de 0 a 5%</span>
        </li>
        <li>
          <span className="s7-ml-scenario-chart__swatch s7-ml-scenario-chart__swatch--health-good" /> Bom ou melhor
          <span className="s7-ml-scenario-chart__legend-hint"> · margem a partir de 5%</span>
        </li>
      </ul>
    </div>
  );
}

/** @param {{ scenarios: unknown[]; selectedScenarioTabId?: string | null; preserveScenarioDisplayOrder?: boolean; enablePagePositiveCompact?: boolean; laneMetaLayout?: "default" | "stacked-left" | "diverging-ranked" | "horizontal-ranked" }} prev @param {typeof prev} next */
function chartPropsEqual(prev, next) {
  return (
    prev.scenarios === next.scenarios &&
    prev.selectedScenarioTabId === next.selectedScenarioTabId &&
    prev.preserveScenarioDisplayOrder === next.preserveScenarioDisplayOrder &&
    prev.enablePagePositiveCompact === next.enablePagePositiveCompact &&
    prev.laneMetaLayout === next.laneMetaLayout
  );
}

export const MercadoLivrePricingScenarioCompareChart = memo(
  MercadoLivrePricingScenarioCompareChartInner,
  chartPropsEqual,
);
MercadoLivrePricingScenarioCompareChart.displayName = "MercadoLivrePricingScenarioCompareChart";

/** @param {(number | null)[]} values */
function scaleSymmetric(values) {
  const nums = values.filter((v) => v != null);
  if (nums.length === 0) return { min: 0, max: 1 };
  const minV = Math.min(0, .../** @type {number[]} */ (nums));
  const maxV = Math.max(0, .../** @type {number[]} */ (nums));
  const span = maxV - minV;
  return { min: minV, max: maxV, span: span > 0 ? span : 1 };
}

/**
 * @param {{
 *   series: {
 *     key: string;
 *     tabId: string;
 *     shortLabel: string;
 *     tickLabel: string;
 *     group: string;
 *     value: number | null;
 *     labelText: string;
 *     marginLabelText: string;
 *     marginHealthClass: string;
 *   }[];
 *   scale: { min: number; max: number; span: number };
 *   valueKey: string;
 *   selectedTabId?: string | null;
 *   laneMetaLayout?: "default" | "stacked-left" | "diverging-ranked" | "horizontal-ranked";
 * }} props
 */
function BarRow({ series, scale, valueKey, selectedTabId = null, laneMetaLayout = "default" }) {
  const { min, span } = scale;
  const spanSafe = span > 0 ? span : 1;
  /** Linha de lucro zero (mesma % em todas as colunas — escala comum). */
  const zeroFromBottomPct = ((0 - min) / spanSafe) * 100;
  const stackedLeft = laneMetaLayout === "stacked-left";

  /** @param {typeof series[number]} s */
  function computeBarGeom(s) {
    const v = s.value;
    let magnetBottomPct = 0;
    let magnetHeightPct = 0;
    let growDir = "s7-ml-scenario-chart__bar-fill-inner--grow-up";
    let low = zeroFromBottomPct;
    let high = zeroFromBottomPct;
    if (v != null && Number.isFinite(v)) {
      const vPct = ((v - min) / spanSafe) * 100;
      low = Math.min(zeroFromBottomPct, vPct);
      high = Math.max(zeroFromBottomPct, vPct);
      magnetBottomPct = low;
      magnetHeightPct = Math.max(high - low, 1.2);
      growDir = v < 0 ? "s7-ml-scenario-chart__bar-fill-inner--grow-down" : "s7-ml-scenario-chart__bar-fill-inner--grow-up";
    } else {
      magnetHeightPct = 3;
      magnetBottomPct = Math.max(0, zeroFromBottomPct - 1.5);
    }
    return { v, magnetBottomPct, magnetHeightPct, growDir, low, high };
  }

  if (stackedLeft) {
    return (
      <div className="s7-ml-scenario-chart__bars-wrap s7-ml-scenario-chart__bars-wrap--lane-stacked" role="presentation">
        <div
          className="s7-ml-scenario-chart__lanes-grid"
          style={{ ["--s7-ml-lane-count"]: String(Math.max(series.length, 1)) }}
        >
          {series.map((s) => {
            const toneClass = s.marginHealthClass || "";
            const metaToneClass = toneClass || "s7-ml-scenario-chart__lane-meta--neutral";
            return (
              <S7Tooltip key={`meta-${valueKey}-${s.key}`} content={s.shortLabel} placement="bottom-start" offset={6} wrap>
                <div className={`s7-ml-scenario-chart__lane-meta ${metaToneClass}`}>
                  <span className="s7-ml-scenario-chart__lane-meta-profit">{s.labelText}</span>
                  <span className="s7-ml-scenario-chart__lane-meta-margin">{s.marginLabelText}</span>
                  <span className="s7-ml-scenario-chart__lane-meta-name">{s.shortLabel}</span>
                </div>
              </S7Tooltip>
            );
          })}
          <div
            className="s7-ml-scenario-chart__bars-plot-area s7-ml-scenario-chart__bars-plot-area--lane-stacked"
            style={{ ["--s7-ml-bar-zero-pct"]: `${zeroFromBottomPct}%` }}
          >
            <div className="s7-ml-scenario-chart__bar-zero-line-global" aria-hidden />
            <div className="s7-ml-scenario-chart__bars-columns s7-ml-scenario-chart__bars-columns--lane-stacked">
              {series.map((s) => {
                const { v, magnetBottomPct, magnetHeightPct, growDir } = computeBarGeom(s);
                const toneClass = s.marginHealthClass || "";
                const barClass = `s7-ml-scenario-chart__bar-fill-inner ${toneClass || "s7-ml-scenario-chart__bar-fill-inner--neutral"}`;
                const isSelected =
                  selectedTabId != null &&
                  String(selectedTabId).trim() !== "" &&
                  s.tabId != null &&
                  String(s.tabId) === String(selectedTabId).trim();
                const columnHitClass = [
                  "s7-ml-scenario-chart__column-hit",
                  "s7-ml-scenario-chart__column-hit--lane-stacked",
                  v != null && Number.isFinite(v) && v < 0 ? "s7-ml-scenario-chart__column-hit--neg-brl" : "",
                  isSelected ? "s7-ml-scenario-chart__column-hit--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <S7Tooltip key={`${valueKey}-${s.key}`} content={s.shortLabel} placement="bottom-start" offset={6} wrap>
                    <div className={columnHitClass}>
                      <div className="s7-ml-scenario-chart__bar-track">
                        <div
                          className="s7-ml-scenario-chart__bar-magnet"
                          style={{
                            bottom: `${magnetBottomPct}%`,
                            height: `${magnetHeightPct}%`,
                          }}
                        >
                          <div className={`${barClass} ${growDir}`} />
                        </div>
                      </div>
                    </div>
                  </S7Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="s7-ml-scenario-chart__bars-wrap" role="presentation">
      <div className="s7-ml-scenario-chart__chart-container">
        <div
          className="s7-ml-scenario-chart__bars-plot-area"
          style={{ ["--s7-ml-bar-zero-pct"]: `${zeroFromBottomPct}%` }}
        >
          <div className="s7-ml-scenario-chart__bar-zero-line-global" aria-hidden />
          <div className="s7-ml-scenario-chart__bars-columns">
            {series.map((s) => {
        const { v, magnetBottomPct, magnetHeightPct, growDir, high, low } = computeBarGeom(s);
        const toneClass = s.marginHealthClass || "";
        const barClass = `s7-ml-scenario-chart__bar-fill-inner ${toneClass || "s7-ml-scenario-chart__bar-fill-inner--neutral"}`;
        const floatClass = `s7-ml-scenario-chart__bar-value-float ${toneClass || "s7-ml-scenario-chart__bar-value-float--neutral"}`;

        const showMarginInBar =
          s.marginLabelText != null && String(s.marginLabelText).trim() !== "" && s.marginLabelText !== "—";

        const isNegativeBar = v != null && Number.isFinite(v) && v < 0;

        /** Positivos: R$ dentro da trilha (`high`). Nulos: ancoragem no zero. Negativos: R$ em `.bar-value-float--below-track`. */
        const floatStyle =
          v != null && Number.isFinite(v) && v >= 0
            ? { bottom: `${high}%` }
            : { bottom: `${zeroFromBottomPct}%` };

        const marginInClass = "s7-ml-scenario-chart__bar-margin-in";

        /** Pé da barra negativa em % a partir do topo da trilha (`low` é medido a partir do rodapé). */
        const negBarBottomFromTopPct = isNegativeBar ? 100 - low : null;
        const isSelected =
          selectedTabId != null &&
          String(selectedTabId).trim() !== "" &&
          s.tabId != null &&
          String(s.tabId) === String(selectedTabId).trim();
        const columnHitClass = [
          "s7-ml-scenario-chart__column-hit",
          isNegativeBar ? "s7-ml-scenario-chart__column-hit--neg-brl" : "",
          isSelected ? "s7-ml-scenario-chart__column-hit--selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const columnHitStyle =
          isNegativeBar && negBarBottomFromTopPct != null
            ? {
                /** Rótulo da promo logo abaixo do R$ desta coluna (não alinha com outras barras). */
                ["--s7-ml-tick-top"]: `calc(${negBarBottomFromTopPct}% + 16px)`,
              }
            : undefined;

        return (
          <S7Tooltip key={`${valueKey}-${s.key}`} content={s.shortLabel} placement="bottom-start" offset={6}>
            <div className={columnHitClass} style={columnHitStyle}>
              <div className="s7-ml-scenario-chart__bar-track">
                {!isNegativeBar ? (
                  <div className={floatClass} style={floatStyle}>
                    <span className="s7-ml-scenario-chart__bar-value-float__text">{s.labelText}</span>
                  </div>
                ) : null}
                <div
                  className="s7-ml-scenario-chart__bar-magnet"
                  style={{
                    bottom: `${magnetBottomPct}%`,
                    height: `${magnetHeightPct}%`,
                  }}
                >
                  <div className={`${barClass} ${growDir}`} />
                  {showMarginInBar ? <span className={marginInClass}>{s.marginLabelText}</span> : null}
                </div>
                {isNegativeBar && negBarBottomFromTopPct != null ? (
                  <div
                    className={`${floatClass} s7-ml-scenario-chart__bar-value-float--below-track`}
                    style={{ top: `calc(${negBarBottomFromTopPct}% + 3px)` }}
                  >
                    <span className="s7-ml-scenario-chart__bar-value-float__text">{s.labelText}</span>
                  </div>
                ) : null}
              </div>
              <span className="s7-ml-scenario-chart__tick">{s.tickLabel}</span>
            </div>
          </S7Tooltip>
        );
      })}
          </div>
        </div>
      </div>
    </div>
  );
}
