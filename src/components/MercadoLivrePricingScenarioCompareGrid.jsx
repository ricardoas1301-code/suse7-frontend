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
  resolveRaioxListingBadge,
  resolveSaleXrayArticleKey,
  shouldSaleXrayDebugTrace,
} from "./mercadoLivrePricingScenarioCompareShared.js";

/**
 * @param {{ scenarios: unknown[] }} props
 */
export function MercadoLivrePricingScenarioCompareGrid({ scenarios }) {
  const rows = useMemo(() => {
    const built = buildOrderedScenarioRows(scenarios);
    if (shouldSaleXrayDebugTrace(scenarios)) {
      console.info("[SALE_XRAY_DEBUG][RENDER_INPUT]", {
        total_cards: built.length,
        cards: built.map(({ scenario: card }) => {
          const c = card && typeof card === "object" ? /** @type {Record<string, unknown>} */ (card) : {};
          const sx = c.sale_xray_pricing != null && typeof c.sale_xray_pricing === "object" ? /** @type {Record<string, unknown>} */ (c.sale_xray_pricing) : null;
          const pr = c.pricing != null && typeof c.pricing === "object" ? /** @type {Record<string, unknown>} */ (c.pricing) : null;
          return {
            scenario_key: c.scenario_key ?? c.scenario_id ?? null,
            scenario_type: c.scenario_type ?? null,
            ux_group: c._sale_xray_ux_group != null ? String(c._sale_xray_ux_group) : null,
            promotion_name: c.promotion_name ?? null,
            subsidy_text: sx?.subsidy_text ?? pr?.subsidy_text ?? c._sale_xray_subsidy_text ?? null,
          };
        }),
      });
    }
    return built;
  }, [scenarios]);

  return (
    <div
      className="s7-ml-scenario-compare"
      data-s7-chart-hook="ml-scenario-compare"
      role="region"
      aria-label="Comparativo de cenários Mercado Livre"
    >
      <div className="s7-ml-scenario-compare__grid s7-ml-scenario-compare__grid--comfortable">
        {rows.map(({ scenario, group }, rowIndex) => {
          const badgeInfo = resolveRaioxListingBadge(scenario);
          const reactKey = resolveSaleXrayArticleKey(scenario, rowIndex);
          const res =
            /** @type {Record<string, unknown>} */ (scenario).result != null &&
            typeof /** @type {Record<string, unknown>} */ (scenario).result === "object"
              ? /** @type {Record<string, unknown>} */ (
                  /** @type {Record<string, unknown>} */ (scenario).result
                )
              : null;
          const profitRaw = res?.profit_brl != null ? String(res.profit_brl).trim() : "";
          const sc = /** @type {Record<string, unknown>} */ (scenario);
          const vigenciaContract =
            sc._sale_xray_vigencia_text != null && String(sc._sale_xray_vigencia_text).trim() !== ""
              ? String(sc._sale_xray_vigencia_text).trim()
              : null;
          const vigenciaLine = vigenciaContract ?? formatScenarioVigenciaLine(scenario);

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
              key={reactKey}
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
                      {badgeInfo.label != null && String(badgeInfo.label).trim() !== ""
                        ? badgeInfo.label
                        : "Disponível"}
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
