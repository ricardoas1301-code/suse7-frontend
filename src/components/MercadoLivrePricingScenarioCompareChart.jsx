// ======================================================
// Gráfico comparativo — só exibe strings/normalização visual da API.
// Altura das barras: parse numérico apenas para escala (não recalcula negócio).
// ======================================================

import { useMemo } from "react";
import { formatCatalogBRL } from "../utils/productCatalogRow";
import { buildOrderedScenarioRows, cardHeadingLabel } from "./mercadoLivrePricingScenarioCompareShared.js";

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
 * @param {{ scenarios: unknown[] }} props
 */
export function MercadoLivrePricingScenarioCompareChart({ scenarios }) {
  const rows = useMemo(() => buildOrderedScenarioRows(scenarios), [scenarios]);

  const profitSeries = useMemo(() => {
    return rows.map(({ scenario, group }) => {
      const r = /** @type {Record<string, unknown>} */ (scenario);
      const res =
        r.result != null && typeof r.result === "object"
          ? /** @type {Record<string, unknown>} */ (r.result)
          : null;
      const raw = res?.profit_brl != null ? String(res.profit_brl) : "";
      const n = parseScaleOnly(raw);
      return {
        key: String(r.scenario_id ?? r.promotion_id ?? cardHeadingLabel(scenario)),
        shortLabel: cardHeadingLabel(scenario),
        group,
        value: n,
        labelText: formatBrlLabelFromApiString(raw || null),
      };
    });
  }, [rows]);

  const marginSeries = useMemo(() => {
    return rows.map(({ scenario, group }) => {
      const r = /** @type {Record<string, unknown>} */ (scenario);
      const res =
        r.result != null && typeof r.result === "object"
          ? /** @type {Record<string, unknown>} */ (r.result)
          : null;
      const raw = res?.margin_pct != null ? String(res.margin_pct) : "";
      const n = parseScaleOnly(raw);
      return {
        key: String(r.scenario_id ?? r.promotion_id ?? cardHeadingLabel(scenario)),
        shortLabel: cardHeadingLabel(scenario),
        group,
        value: n,
        labelText: formatMarginLabelFromApiString(raw || null),
      };
    });
  }, [rows]);

  const profitScale = useMemo(() => scaleSymmetric(profitSeries.map((s) => s.value)), [profitSeries]);
  const marginScale = useMemo(() => scaleMinZero(marginSeries.map((s) => s.value)), [marginSeries]);

  if (rows.length === 0) return null;

  return (
    <div className="s7-ml-scenario-chart" role="img" aria-label="Comparativo de lucro e margem por cenário">
      <h4 className="s7-ml-scenario-chart__title">Comparativo rápido</h4>
      <p className="s7-ml-scenario-chart__subtitle">Valores por cenário (mesma fonte dos cards)</p>

      <div className="s7-ml-scenario-chart__block">
        <div className="s7-ml-scenario-chart__block-head">Lucro líquido (R$)</div>
        <BarRow series={profitSeries} scale={profitScale} valueKey="profit" />
      </div>

      <div className="s7-ml-scenario-chart__block">
        <div className="s7-ml-scenario-chart__block-head">Margem (%)</div>
        <BarRow series={marginSeries} scale={marginScale} valueKey="margin" />
      </div>

      <ul className="s7-ml-scenario-chart__legend" aria-hidden>
        <li>
          <span className="s7-ml-scenario-chart__swatch s7-ml-scenario-chart__swatch--baseline" /> Preço normal
        </li>
        <li>
          <span className="s7-ml-scenario-chart__swatch s7-ml-scenario-chart__swatch--participating" /> Participando
        </li>
        <li>
          <span className="s7-ml-scenario-chart__swatch s7-ml-scenario-chart__swatch--available" /> Disponível
        </li>
      </ul>
    </div>
  );
}

/** @param {(number | null)[]} values */
function scaleSymmetric(values) {
  const nums = values.filter((v) => v != null);
  if (nums.length === 0) return { min: 0, max: 1 };
  const minV = Math.min(0, .../** @type {number[]} */ (nums));
  const maxV = Math.max(0, .../** @type {number[]} */ (nums));
  const span = maxV - minV;
  return { min: minV, max: maxV, span: span > 0 ? span : 1 };
}

/** @param {(number | null)[]} values */
function scaleMinZero(values) {
  const nums = values.filter((v) => v != null);
  if (nums.length === 0) return { min: 0, max: 1, span: 1 };
  const maxV = Math.max(0, .../** @type {number[]} */ (nums));
  return { min: 0, max: maxV, span: maxV > 0 ? maxV : 1 };
}

/**
 * @param {{
 *   series: { key: string; shortLabel: string; group: string; value: number | null; labelText: string }[];
 *   scale: { min: number; max: number; span: number };
 *   valueKey: string;
 * }} props
 */
function BarRow({ series, scale, valueKey }) {
  const { min, span } = scale;
  return (
    <div className="s7-ml-scenario-chart__bars" role="presentation">
      {series.map((s) => {
        const hPct =
          s.value == null ? 0 : Math.max(0, Math.min(100, ((s.value - min) / span) * 100));
        const displayH = s.value == null ? 6 : Math.max(10, hPct);
        const barClass = [
          "s7-ml-scenario-chart__bar-fill",
          s.group === "baseline" ? "s7-ml-scenario-chart__bar-fill--baseline" : "",
          s.group === "participating" ? "s7-ml-scenario-chart__bar-fill--participating" : "",
          s.group === "available" ? "s7-ml-scenario-chart__bar-fill--available" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={`${valueKey}-${s.key}`} className="s7-ml-scenario-chart__cell">
            <div className="s7-ml-scenario-chart__bar-track">
              <div
                className={barClass}
                style={{ height: `${displayH}%` }}
                title={`${s.shortLabel}: ${s.labelText}`}
              />
            </div>
            <div className="s7-ml-scenario-chart__value" title={s.labelText}>
              {s.labelText}
            </div>
            <div className="s7-ml-scenario-chart__tick" title={s.shortLabel}>
              {truncateLabel(s.shortLabel, 14)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** @param {string} s @param {number} max */
function truncateLabel(s, max) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
