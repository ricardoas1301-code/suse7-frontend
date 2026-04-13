// ======================================================
// Painel Raio-x: gráfico à esquerda + grade de cards à direita.
// (Precificação inteligente monta gráfico e grid em colunas separadas do modal.)
// ======================================================

import { MercadoLivrePricingScenarioCompareChart } from "./MercadoLivrePricingScenarioCompareChart.jsx";
import { MercadoLivrePricingScenarioCompareGrid } from "./MercadoLivrePricingScenarioCompareGrid.jsx";

/**
 * @param {{
 *   scenarios: unknown[];
 *   className?: string;
 *   layout?: "raiox" | "chart-right";
 *   showInlineChart?: boolean;
 * }} props
 * `raiox`: gráfico à esquerda, cards à direita. `chart-right`: cards à esquerda, gráfico à direita (fallback).
 * `showInlineChart={false}` + `layout="raiox"`: só cards (ex.: Raio-x com gráfico em mini modal).
 */
export function MercadoLivrePricingScenarioComparePanel({
  scenarios,
  className,
  layout = "raiox",
  showInlineChart = true,
}) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return null;

  const cards = (
    <div className="s7-ml-scenario-compare-shell__cards">
      <MercadoLivrePricingScenarioCompareGrid scenarios={scenarios} />
    </div>
  );

  if (!showInlineChart && layout === "raiox") {
    return (
      <div
        className={["s7-ml-scenario-compare-shell", "s7-ml-scenario-compare-shell--raiox-cards-only", className]
          .filter(Boolean)
          .join(" ")}
      >
        {cards}
      </div>
    );
  }

  const shellClass = [
    "s7-ml-scenario-compare-shell",
    layout === "raiox" ? "s7-ml-scenario-compare-shell--raiox" : "s7-ml-scenario-compare-shell--chart-right",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const chart = (
    <div className="s7-ml-scenario-compare-shell__chart">
      <MercadoLivrePricingScenarioCompareChart scenarios={scenarios} />
    </div>
  );

  return (
    <div className={shellClass}>
      {layout === "raiox" ? (
        <>
          {chart}
          {cards}
        </>
      ) : (
        <>
          {cards}
          {chart}
        </>
      )}
    </div>
  );
}
