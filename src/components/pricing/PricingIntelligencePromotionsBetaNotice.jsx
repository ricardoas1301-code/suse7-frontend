// ======================================================
// PI — Aviso discreto Beta compacto (aba Promoções).
// ======================================================

import { PROMOTION_BETA_BANNER_ARIA, PROMOTION_BETA_TAB_HELPER } from "../../features/pricing/promotions/promotionBetaPricePresentation.js";

export function PricingIntelligencePromotionsBetaNotice() {
  return (
    <div
      className="pricing-intelligence-page__promotions-beta-banner"
      role="note"
      aria-label={PROMOTION_BETA_BANNER_ARIA}
    >
      <p className="pricing-intelligence-page__promotions-beta-banner-text">{PROMOTION_BETA_TAB_HELPER}</p>
    </div>
  );
}
