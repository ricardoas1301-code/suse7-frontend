// ======================================================

// Detalhe único do cenário selecionado — página Precificação Inteligente.

// ======================================================



import { memo } from "react";

import { MercadoLivrePricingScenarioCompareCard } from "../MercadoLivrePricingScenarioCompareGrid.jsx";

import { getScenarioHealthStatus, parseScenarioProfitBrlNumber } from "./pricingScenarioDecisionUi.js";



/**

 * @param {{

 *   scenario: unknown;

 *   group: string;

 *   baselineHeadingOverride?: string | null;

 *   baselineListingTypeBadge?: string | null;

 *   hideBreakEvenInResult?: boolean;

 *   resultProfitLineLabel?: string | null;

 *   listingHintForAudit?: string;

 *   baselineListingSaleDisplayOverride?: string | null;

 *   inlineEditSale?: {

 *     displayValue: string;

 *     onCommit: (raw: string) => void;

 *   } | null;

 *   inlineEditMargin?: {

 *     displayValue: string;

 *     onCommit: (raw: string) => void;

 *   } | null;

 *   contingencyLines?: { label: string; subtitlePct?: string | null; amountBrl: string }[];
 *   strategicReserveLines?: { label: string; subtitlePct?: string | null; amountBrl: string }[];

 *   listingUnitSaleDisplayOverride?: string | null;

 *   listingTypeSelectionBadge?: "Vendendo" | "Alternativa" | null;

 *   cardFooterNotice?: string | null;

 *   layoutPiFixo?: boolean;

 * }} props

 */

function PricingScenarioDetailInner({

  scenario,

  group,

  baselineHeadingOverride = null,

  baselineListingTypeBadge = null,

  hideBreakEvenInResult = false,

  resultProfitLineLabel = null,

  listingHintForAudit = "",

  baselineListingSaleDisplayOverride = null,

  inlineEditSale = null,

  inlineEditMargin = null,

  salePriceEditControl = null,

  contingencyLines = [],
  strategicReserveLines = [],
  listingUnitSaleDisplayOverride = null,
  listingTypeSelectionBadge = null,
  cardFooterNotice = null,
  layoutPiFixo = false,

}) {

  if (scenario == null || typeof scenario !== "object") {

    return (

      <div className="pricing-scenario-detail" role="status">

        <p className="anuncios-sell-popover__muted">Detalhe do cenário indisponível.</p>

      </div>

    );

  }

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

      <MercadoLivrePricingScenarioCompareCard

        scenario={scenario}

        group={group}

        baselineHeadingOverride={baselineHeadingOverride}

        baselineListingTypeBadge={baselineListingTypeBadge}

        hideBreakEvenInResult={hideBreakEvenInResult}

        showBaselineListingStatusBadge={false}

        resultProfitLineLabel={resultProfitLineLabel}

        listingHintForAudit={listingHintForAudit}

        scheduledPromoBadgeAsAvailable

        baselineListingSaleDisplayOverride={baselineListingSaleDisplayOverride}

        inlineEditSale={inlineEditSale}

        inlineEditMargin={inlineEditMargin}

        salePriceEditControl={salePriceEditControl}

        contingencyLines={contingencyLines}
        strategicReserveLines={strategicReserveLines}
        listingUnitSaleDisplayOverride={listingUnitSaleDisplayOverride}
        listingTypeSelectionBadge={listingTypeSelectionBadge}
        cardFooterNotice={cardFooterNotice}
        layoutPiFixo={layoutPiFixo}

      />

    </div>

  );

}



export const PricingScenarioDetail = memo(PricingScenarioDetailInner);

PricingScenarioDetail.displayName = "PricingScenarioDetail";

