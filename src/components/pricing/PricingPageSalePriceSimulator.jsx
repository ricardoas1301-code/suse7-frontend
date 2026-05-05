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
 * `embedded`: dentro do card com abas — sem borda duplicada nem kicker “Simulador”.
 * `children`: bloco opcional acima do gráfico (ex.: Simulação de preço).
 *
 * @param {{
 *   baselineRow: { scenario: unknown; group: string } | null;
 *   listingHintForAudit?: string;
 *   baselineListingSaleDisplayOverride?: string | null;
 *   embedded?: boolean;
 *   children?: import("react").ReactNode;
 * }} props
 */
export function PricingPageSalePriceSimulator({
  baselineRow,
  listingHintForAudit = "",
  baselineListingSaleDisplayOverride = null,
  embedded = false,
  children = null,
}) {
  const [salePriceListingType, setSalePriceListingType] = useState(/** @type {"classic" | "premium"} */ ("classic"));

  if (baselineRow == null) return null;

  const baselineCardTitle = salePriceListingType === "classic" ? "Anúncio Clássico" : "Anúncio Premium";

  const rootClass = [
    "pricing-intelligence-page__sale-price-simulator",
    embedded ? "pricing-intelligence-page__sale-price-simulator--embedded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const Tag = embedded ? "div" : "section";

  return (
    <Tag
      className={rootClass}
      aria-label={embedded ? undefined : "Simulador Preço de venda"}
      data-pricing-sale-price-listing-type={salePriceListingType}
    >
      {!embedded ? (
        <header className="pricing-intelligence-page__sale-price-simulator__head">
          <span className="pricing-intelligence-page__sale-price-simulator__kicker">Simulador</span>
          <p className="pricing-intelligence-page__sale-price-simulator__lede">
            Preço de venda — teste de margem e repasse. As promoções abaixo seguem o estado atual do Mercado Livre e
            não dependem de Clássico/Premium aqui.
          </p>
        </header>
      ) : null}

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
            {children}
            <div className="pricing-intelligence-page__chart-slot anuncios-pricing-modal__ml-chart-slot pricing-intelligence-page__chart-slot--page-vertical-compact">
              <PricingSalePriceListingTypeChartPlaceholder selectedListingType={salePriceListingType} />
            </div>
          </div>
        </div>
      </div>
    </Tag>
  );
}
