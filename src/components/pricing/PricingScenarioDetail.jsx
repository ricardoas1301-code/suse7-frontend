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

 *   exibirRodapePrecoManualPromocao?: boolean;

 *   layoutPiFixo?: boolean;

 *   promocaoPrecoVendaExibicaoOverride?: string | null;

 *   promocaoNomeExibicao?: string | null;

 *   exibirReservaEstrategica?: boolean;

 *   scheduledPromoBadgeAsAvailable?: boolean;

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
  exibirRodapePrecoManualPromocao = false,
  layoutPiFixo = false,
  promocaoPrecoVendaExibicaoOverride = null,
  promocaoNomeExibicao = null,
  promocaoPrecoOriginalExibicao = null,
  exibirReservaEstrategica = true,
  layoutCabecalhoPromocaoPi = false,
  forcarLinhaDescontoSellerPromocao = false,
  descontoSellerPromocaoExibicao = null,
  scheduledPromoBadgeAsAvailable = false,
  financialScenarioPending = false,
  promotionFeeDiscountBrl = null,
  snapshotFeeDiscountBrl = null,
  promotionOfficialAmountToReceiveBrl = null,
  promotionRevenueSource = null,
  promotionSelectedKey = null,
  promotionSnapshot = null,
  officialRowContract = null,
  comparisonModel = null,
  isCurrentListingType = false,
  selectedPromotionRequestId = null,
  listingTypeCard = null,
  promocaoCardViewModel = null,

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

        baselineListingSaleDisplayOverride={baselineListingSaleDisplayOverride}

        inlineEditSale={inlineEditSale}

        inlineEditMargin={inlineEditMargin}

        salePriceEditControl={salePriceEditControl}

        contingencyLines={contingencyLines}
        strategicReserveLines={strategicReserveLines}
        listingUnitSaleDisplayOverride={listingUnitSaleDisplayOverride}
        listingTypeSelectionBadge={listingTypeSelectionBadge}
        cardFooterNotice={cardFooterNotice}
        exibirRodapePrecoManualPromocao={exibirRodapePrecoManualPromocao}
        layoutPiFixo={layoutPiFixo}
        promocaoPrecoVendaExibicaoOverride={promocaoPrecoVendaExibicaoOverride}
        promocaoNomeExibicao={promocaoNomeExibicao}
        promocaoPrecoOriginalExibicao={promocaoPrecoOriginalExibicao}
        exibirReservaEstrategica={exibirReservaEstrategica}
        layoutCabecalhoPromocaoPi={layoutCabecalhoPromocaoPi}
        forcarLinhaDescontoSellerPromocao={forcarLinhaDescontoSellerPromocao}
        descontoSellerPromocaoExibicao={descontoSellerPromocaoExibicao}
        scheduledPromoBadgeAsAvailable={scheduledPromoBadgeAsAvailable}
        financialScenarioPending={financialScenarioPending}
        promotionFeeDiscountBrl={promotionFeeDiscountBrl}
        snapshotFeeDiscountBrl={snapshotFeeDiscountBrl}
        promotionOfficialAmountToReceiveBrl={promotionOfficialAmountToReceiveBrl}
        promotionRevenueSource={promotionRevenueSource}
        promotionSelectedKey={promotionSelectedKey}
        promotionSnapshot={promotionSnapshot}
        officialRowContract={officialRowContract}
        comparisonModel={comparisonModel}
        isCurrentListingType={isCurrentListingType}
        selectedPromotionRequestId={selectedPromotionRequestId}
        listingTypeCard={listingTypeCard}
        promocaoCardViewModel={promocaoCardViewModel}

      />

    </div>

  );

}



export const PricingScenarioDetail = memo(PricingScenarioDetailInner);

PricingScenarioDetail.displayName = "PricingScenarioDetail";

