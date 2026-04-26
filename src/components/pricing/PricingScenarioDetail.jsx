// ======================================================
// Detalhe único do cenário selecionado — página Precificação Inteligente.
// ======================================================

import { MercadoLivrePricingScenarioCompareCard } from "../MercadoLivrePricingScenarioCompareGrid.jsx";
import { getScenarioHealthStatus, parseScenarioProfitBrlNumber } from "./pricingScenarioDecisionUi.js";

/**
 * @param {{
 *   scenario: unknown;
 *   group: string;
 *   baselineHeadingOverride?: string | null;
 *   hideBreakEvenInResult?: boolean;
 *   resultProfitLineLabel?: string | null;
 *   listingHintForAudit?: string;
 *   baselineListingSaleDisplayOverride?: string | null;
 * }} props
 */
export function PricingScenarioDetail({
  scenario,
  group,
  baselineHeadingOverride = null,
  hideBreakEvenInResult = false,
  resultProfitLineLabel = null,
  listingHintForAudit = "",
  baselineListingSaleDisplayOverride = null,
}) {
  const health = getScenarioHealthStatus(scenario);
  const profitN = parseScenarioProfitBrlNumber(scenario);
  const isLossProfit = profitN != null && profitN < 0;
  const wrapClass = [
    "pricing-scenario-detail",
    isLossProfit ? "pricing-scenario-detail--loss" : "",
    !isLossProfit && health === "low_margin" ? "pricing-scenario-detail--low-margin" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClass}>
      {isLossProfit ? (
        <div className="pricing-scenario-detail__alert" role="status">
          <span className="pricing-scenario-detail__alert-icon" aria-hidden>
            ❌
          </span>
          <span>Prejuízo neste cenário (lucro líquido negativo).</span>
        </div>
      ) : null}
      <MercadoLivrePricingScenarioCompareCard
        scenario={scenario}
        group={group}
        baselineHeadingOverride={baselineHeadingOverride}
        hideBreakEvenInResult={hideBreakEvenInResult}
        showBaselineListingStatusBadge={false}
        resultProfitLineLabel={resultProfitLineLabel}
        listingHintForAudit={listingHintForAudit}
        scheduledPromoBadgeAsAvailable
        baselineListingSaleDisplayOverride={baselineListingSaleDisplayOverride}
      />
    </div>
  );
}
