import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID = "recalculate_listing_health";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   listingId?: string;
 *   sku?: string;
 *   marketplace?: string;
 *   previousHealthScore?: number | null;
 * }} SellerToolboxRecalculateListingHealthOperationContext
 */

/**
 * @param {SellerToolboxRecalculateListingHealthOperationContext} context
 */
export async function executeFakeRecalculateListingHealth(context) {
  const listingId = String(context.listingId ?? "").trim();
  if (!listingId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousHealthScore = Number(context.previousHealthScore);
  const safePrevious = Number.isFinite(previousHealthScore) ? previousHealthScore : 86;

  return {
    success: true,
    recalculatedAt: new Date().toISOString(),
    previousHealthScore: safePrevious,
    newHealthScore: 91,
    healthStatus: "healthy",
  };
}
