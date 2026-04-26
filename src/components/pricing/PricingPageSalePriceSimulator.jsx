// ======================================================
// Bloco "Preço de venda" na página — mesmo layout que promoções:
// [mini cards Clássico | Premium] [card de cálculo] [gráfico placeholder].
// Seleção só altera rótulos/destaque visual até a API separar cenários.
// ======================================================

import { useState } from "react";
import { PricingScenarioDetail } from "./PricingScenarioDetail.jsx";
import { PricingSalePriceListingTypeChartPlaceholder } from "./PricingSalePriceListingTypeChartPlaceholder.jsx";
import { PricingSalePriceTypeRail } from "./PricingSalePriceTypeRail.jsx";

/**
 * @param {{
 *   baselineRow: { scenario: unknown; group: string } | null;
 *   listingHintForAudit?: string;
 *   baselineListingSaleDisplayOverride?: string | null;
 * }} props
 */
export function PricingPageSalePriceSimulator({
  baselineRow,
  listingHintForAudit = "",
  baselineListingSaleDisplayOverride = null,
}) {
  const [salePriceListingType, setSalePriceListingType] = useState(/** @type {"classic" | "premium"} */ ("classic"));

  if (baselineRow == null) return null;

  const baselineCardTitle =
    salePriceListingType === "classic" ? "Preço de venda Clássico" : "Preço de venda Premium";

  return (
    <section
      className="pricing-intelligence-page__sale-price-simulator"
      aria-label="Simulador Preço de venda"
      data-pricing-sale-price-listing-type={salePriceListingType}
    >
      <header className="pricing-intelligence-page__sale-price-simulator__head">
        <span className="pricing-intelligence-page__sale-price-simulator__kicker">Simulador</span>
        <p className="pricing-intelligence-page__sale-price-simulator__lede">
          Preço de venda — teste de margem e repasse. As promoções abaixo seguem o estado atual do Mercado Livre e não
          dependem de Clássico/Premium aqui.
        </p>
      </header>

      <div className="pricing-intelligence-page__scenario-workspace">
        <PricingSalePriceTypeRail selected={salePriceListingType} onSelect={setSalePriceListingType} />
        <div className="pricing-intelligence-page__scenario-main">
          <div className="pricing-intelligence-page__scenario-detail-col">
            <PricingScenarioDetail
              scenario={baselineRow.scenario}
              group={baselineRow.group}
              baselineHeadingOverride={baselineCardTitle}
              hideBreakEvenInResult
              listingHintForAudit={listingHintForAudit}
              baselineListingSaleDisplayOverride={baselineListingSaleDisplayOverride}
            />
          </div>
          <div className="pricing-intelligence-page__scenario-right-stack">
            <div className="pricing-intelligence-page__chart-slot anuncios-pricing-modal__ml-chart-slot pricing-intelligence-page__chart-slot--page-vertical-compact">
              <PricingSalePriceListingTypeChartPlaceholder selectedListingType={salePriceListingType} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
