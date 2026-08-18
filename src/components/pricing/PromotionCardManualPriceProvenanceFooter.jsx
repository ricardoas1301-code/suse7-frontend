// ======================================================
// PI — Rodapé de proveniência do valor manual (aba Promoções).
// S4.3.6.15 — exclusivamente visual; sem impacto financeiro.
// ======================================================

import { PROMOTION_CARD_MANUAL_SALE_PRICE_FOOTER } from "../../features/pricing/promotions/promotionBetaPricePresentation.js";

/**
 * @param {{ visible?: boolean }} props
 */
export function PromotionCardManualPriceProvenanceFooter({ visible = false }) {
  if (visible !== true) return null;

  return (
    <div
      className="anuncios-sell-popover__section anuncios-sell-popover__section--future anuncios-pricing-modal__raiox-block s7-ml-scenario-compare__promo-manual-provenance-footer"
      data-s7-promo-manual-provenance-footer="true"
    >
      <p
        className="s7-ml-scenario-compare__promo-manual-provenance-footer-text"
        role="note"
      >
        {PROMOTION_CARD_MANUAL_SALE_PRICE_FOOTER}
      </p>
    </div>
  );
}
