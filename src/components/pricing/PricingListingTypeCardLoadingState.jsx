// ======================================================
// Loading visual por card Clássico/Premium (evita falso erro durante sync).
// ======================================================

import { listingTypePillLabel } from "./pricingListingTypeUi.js";

/**
 * @param {{ listingType: "classic" | "premium" }} props
 */
export function PricingListingTypeCardLoadingState({ listingType }) {
  const rotulo = listingTypePillLabel(listingType);
  return (
    <div className="pricing-listing-type-compare__loading" role="status" aria-live="polite">
      <div className="pricing-listing-type-compare__loading-spinner-wrap" aria-hidden>
        <span className="anuncios-raiox-venda-loading__spinner" />
      </div>
      <p className="pricing-listing-type-compare__loading-title">{rotulo}</p>
      <p className="pricing-listing-type-compare__loading-text">
        Carregando informações do anúncio {rotulo}…
      </p>
    </div>
  );
}
