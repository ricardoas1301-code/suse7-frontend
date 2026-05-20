// ======================================================
// Semântica de margem do Raio-x da venda — reutiliza Precificação.
// ======================================================

import {
  getOfferStatusFromMargin,
  offerSemanticSuffixToCssClass,
} from "../mercadoLivrePricingScenarioCompareShared.js";

/**
 * @param {unknown} marginPercentRaw
 */
export function getSaleRayxMarginSemantic(marginPercentRaw) {
  const offerFromMargin = getOfferStatusFromMargin(marginPercentRaw);
  return {
    offerFromMargin,
    offerSemClass: offerFromMargin ? offerSemanticSuffixToCssClass(offerFromMargin.color) : "",
    healthLabel: offerFromMargin?.label ?? null,
  };
}
