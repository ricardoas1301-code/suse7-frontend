import assert from "node:assert/strict";
import {
  getListingProductLinkActions,
  shouldShowCadastrarCustosListaRow,
} from "../src/features/listings/utils/listingProductLinkActions.js";

const base = {
  productId: "product-1",
  sku: "SKU-1",
  isProductReady: false,
  initialSyncUniverseStable: true,
  pricingContext: { product_health: { product_health_status: "INCOMPLETE_PRODUCT" } },
};

const missingSku = {
  ...base,
  sku: null,
  skuDependencyPending: true,
  skuDependencyReason: "ml_missing_sku",
};
const missingSkuActions = getListingProductLinkActions(missingSku, () => {});
assert.equal(missingSkuActions.showInformSkuMl, true);
assert.equal(missingSkuActions.showVincular, false);
assert.equal(missingSkuActions.showCompletar, false);
assert.equal(missingSkuActions.primaryCtaLabel, "Cadastrar SKU");
assert.equal(shouldShowCadastrarCustosListaRow(missingSku), false);

const missingLink = {
  ...base,
  skuDependencyPending: true,
  skuDependencyReason: "product_link_missing",
};
const missingLinkActions = getListingProductLinkActions(missingLink, () => {});
assert.equal(missingLinkActions.showInformSkuMl, false);
assert.equal(missingLinkActions.showVincular, true);
assert.equal(missingLinkActions.showCompletar, false);
assert.equal(missingLinkActions.primaryCtaLabel, "Vincular produto");

const costsOnly = {
  ...base,
  skuDependencyPending: false,
  skuDependencyReason: null,
};
const costsActions = getListingProductLinkActions(costsOnly, () => {});
assert.equal(costsActions.showInformSkuMl, false);
assert.equal(costsActions.showVincular, false);
assert.equal(costsActions.showCompletar, true);

console.log("[test_listing_sku_dependency_state_machine_unit] OK");
