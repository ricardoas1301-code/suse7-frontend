// ======================================================
// Gráfico comparativo — só exibe strings/normalização visual da API.
// Altura das barras: parse numérico apenas para escala (não recalcula negócio).
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
import S7Tooltip from "./ui/S7Tooltip.jsx";

/** Parse decimal API string → número finito, só para proporção visual das barras. */
function parseScaleOnly(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** @param {string | null | undefined} s */
function formatBrlLabelFromApiString(s) {
  if (s == null || String(s).trim() === "") return "—";
  const n = Number(String(s).replace(",", "."));
  if (!Number.isFinite(n)) return "—";
  return formatCatalogBRL(n);
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
 *
 * @param {{
 *   scenarios: unknown[];
 *   selectedScenarioTabId?: string | null;
 *   preserveScenarioDisplayOrder?: boolean;
 *   enablePagePositiveCompact?: boolean;
 * }} props
 */
function MercadoLivrePricingScenarioCompareChartInner({
  scenarios,
  selectedScenarioTabId = null,
  preserveScenarioDisplayOrder = false,
  enablePagePositiveCompact = false,
}) {
  const rows = useMemo(
    () => buildOrderedScenarioRows(scenarios, { preserveInputOrder: preserveScenarioDisplayOrder }),
    [scenarios, preserveScenarioDisplayOrder],
  );

  /** Uma linha de barras: altura pelo lucro (R$); rótulos com R$ + margem % (API, sem recalcular). */
  const chartSeries = useMemo(() => {
    return rows.map(({ scenario, group }) => {
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
      const profitN = parseScaleOnly(rawProfit);
      const st = r.starts_at != null ? String(r.starts_at) : "";
      const ed = r.ends_at != null ? String(r.ends_at) : "";
      const marginTone = getOfferStatusFromMargin(rawMargin || null);
      const marginHealthClass =
        marginTone != null ? offerSemanticSuffixToCssClass(marginTone.color) : "";
      const heading = cardHeadingLabel(scenario);
      const shortLabel = group === "baseline" ? "Preço de venda" : heading;
      const tickLabel = getFirstWordLabel(shortLabel);
      const tabId = resolveMlScenarioTabId(scenario) || "baseline";
      const sid = String(r.scenario_id ?? r.promotion_id ?? r.promotion_stable_key ?? "").trim();
      return {
        key: `${tabId}::${sid}::${st}::${ed}`,
        tabId,
        shortLabel,
        tickLabel,
        group,
        value: profitN,
        labelText: formatBrlLabelFromApiString(rawProfit || null),
        marginLabelText: formatMarginLabelFromApiString(rawMargin || null),
        marginHealthClass,
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

  const chartRootClass = ["s7-ml-scenario-chart", plotCompactPositive ? "s7-ml-scenario-chart--plot-compact-positive" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={chartRootClass} role="img" aria-label="Lucro em reais e margem percentual por cenário">
      <div className="s7-ml-scenario-chart__block">
        <BarRow series={chartSeries} scale={profitScale} valueKey="profit" selectedTabId={selectedScenarioTabId} />
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

/** @param {{ scenarios: unknown[]; selectedScenarioTabId?: string | null; preserveScenarioDisplayOrder?: boolean; enablePagePositiveCompact?: boolean }} prev @param {typeof prev} next */
function chartPropsEqual(prev, next) {
  return (
    prev.scenarios === next.scenarios &&
    prev.selectedScenarioTabId === next.selectedScenarioTabId &&
    prev.preserveScenarioDisplayOrder === next.preserveScenarioDisplayOrder &&
    prev.enablePagePositiveCompact === next.enablePagePositiveCompact
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
 * }} props
 */
function BarRow({ series, scale, valueKey, selectedTabId = null }) {
  const { min, span } = scale;
  const spanSafe = span > 0 ? span : 1;
  /** Linha de lucro zero (mesma % em todas as colunas — escala comum). */
  const zeroFromBottomPct = ((0 - min) / spanSafe) * 100;

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
        const v = s.value;
        const toneClass = s.marginHealthClass || "";
        const barClass = `s7-ml-scenario-chart__bar-fill-inner ${toneClass || "s7-ml-scenario-chart__bar-fill-inner--neutral"}`;
        const floatClass = `s7-ml-scenario-chart__bar-value-float ${toneClass || "s7-ml-scenario-chart__bar-value-float--neutral"}`;

        let magnetBottomPct = 0;
        let magnetHeightPct = 0;
        let growDir = "s7-ml-scenario-chart__bar-fill-inner--grow-up";
        let vPct = zeroFromBottomPct;
        let low = zeroFromBottomPct;
        let high = zeroFromBottomPct;

        if (v != null && Number.isFinite(v)) {
          vPct = ((v - min) / spanSafe) * 100;
          low = Math.min(zeroFromBottomPct, vPct);
          high = Math.max(zeroFromBottomPct, vPct);
          magnetBottomPct = low;
          magnetHeightPct = Math.max(high - low, 1.2);
          growDir = v < 0 ? "s7-ml-scenario-chart__bar-fill-inner--grow-down" : "s7-ml-scenario-chart__bar-fill-inner--grow-up";
        } else {
          magnetHeightPct = 3;
          magnetBottomPct = Math.max(0, zeroFromBottomPct - 1.5);
        }

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
