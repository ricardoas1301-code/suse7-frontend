import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID = "reimport_listing";

export const SELLER_TOOLBOX_REIMPORT_LISTING_SCOPES = Object.freeze([
  "listing_core",
  "listing_price",
  "listing_shipping",
  "listing_stock",
  "marketplace_payload",
]);

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   listingId?: string;
 *   sku?: string;
 *   marketplace?: string;
 * }} SellerToolboxReimportListingOperationContext
 */

/**
 * @param {SellerToolboxReimportListingOperationContext} context
 */
export async function executeFakeReimportListing(context) {
  const listingId = String(context.listingId ?? "").trim();
  if (!listingId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    reimportedAt: new Date().toISOString(),
    refreshedScopes: [...SELLER_TOOLBOX_REIMPORT_LISTING_SCOPES],
  };
}
