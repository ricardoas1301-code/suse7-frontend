// ======================================================
// Modal Precificação / Raio-x — grade responsiva de cenários ML.
// Sem cálculo financeiro; ordenação via shared puro.
// ======================================================

import { useMemo } from "react";
import {
  MercadoLivrePricingScenarioInternalAndResultSection,
  MercadoLivrePricingScenarioRevenueSection,
  resolveMlScenarioTabId,
} from "./MercadoLivrePricingScenarioRaiox.jsx";
import {
  buildOrderedScenarioRows,
  cardHeadingLabel,
  formatScenarioVigenciaLine,
} from "./mercadoLivrePricingScenarioCompareShared.js";

/**
 * @param {{ scenarios: unknown[] }} props
 */
export function MercadoLivrePricingScenarioCompareGrid({ scenarios }) {
  const rows = useMemo(() => buildOrderedScenarioRows(scenarios), [scenarios]);

  return (
    <div
      className="s7-ml-scenario-compare"
      data-s7-chart-hook="ml-scenario-compare"
      role="region"
      aria-label="Comparativo de cenários Mercado Livre"
    >
      <div className="s7-ml-scenario-compare__grid s7-ml-scenario-compare__grid--comfortable">
        {rows.map(({ scenario, group }) => {
          const key =
            resolveMlScenarioTabId(scenario) ||
            `${group}-${cardHeadingLabel(scenario)}-${String(
              /** @type {Record<string, unknown>} */ (scenario).scenario_id ?? "",
            )}`;
          const res =
            /** @type {Record<string, unknown>} */ (scenario).result != null &&
            typeof /** @type {Record<string, unknown>} */ (scenario).result === "object"
              ? /** @type {Record<string, unknown>} */ (
                  /** @type {Record<string, unknown>} */ (scenario).result
                )
              : null;
          const profitRaw = res?.profit_brl != null ? String(res.profit_brl).trim() : "";
          const vigenciaLine = formatScenarioVigenciaLine(scenario);

          const cardClass = [
            "s7-ml-scenario-compare__card",
            group === "baseline" ? "s7-ml-scenario-compare__card--baseline" : "",
            group === "participating" ? "s7-ml-scenario-compare__card--participating" : "",
            group === "available" ? "s7-ml-scenario-compare__card--available" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <article
              key={key}
              className={cardClass}
              data-scenario-key={resolveMlScenarioTabId(scenario) || "baseline"}
              data-scenario-ux-group={group}
              data-profit-brl={profitRaw !== "" ? profitRaw : undefined}
            >
              <header className="s7-ml-scenario-compare__card-head">
                <div className="s7-ml-scenario-compare__card-head-line">
                  <div className="s7-ml-scenario-compare__card-title-stack">
                    <span className="s7-ml-scenario-compare__card-title">{cardHeadingLabel(scenario)}</span>
                    {vigenciaLine ? (
                      <span className="s7-ml-scenario-compare__card-vigencia">{vigenciaLine}</span>
                    ) : null}
                  </div>
                  {group === "participating" ? (
                    <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--participating">
                      Participando
                    </span>
                  ) : null}
                  {group === "available" ? (
                    <span className="s7-ml-scenario-compare__badge s7-ml-scenario-compare__badge--available">
                      Disponível
                    </span>
                  ) : null}
                </div>
              </header>
              <div className="s7-ml-scenario-compare__card-body">
                <MercadoLivrePricingScenarioRevenueSection
                  scenario={scenario}
                  showSubsidy={false}
                  showShippingSubsidyMlLine={false}
                />
                <MercadoLivrePricingScenarioInternalAndResultSection scenario={scenario} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
