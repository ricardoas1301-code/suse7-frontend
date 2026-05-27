import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID =
  "reprocess_product_listing_link";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   productId?: string;
 *   sku?: string;
 *   linkedListingsCount?: number | null;
 *   previousLinkStatus?: string | null;
 * }} SellerToolboxReprocessProductListingLinkOperationContext
 */

/**
 * @param {SellerToolboxReprocessProductListingLinkOperationContext} context
 */
export async function executeFakeReprocessProductListingLink(context) {
  const sku = String(context.sku ?? "").trim();
  if (!sku) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const linkedListingsProcessed = Number(context.linkedListingsCount);
  const safeCount = Number.isFinite(linkedListingsProcessed) ? linkedListingsProcessed : 2;

  return {
    success: true,
    reprocessedAt: new Date().toISOString(),
    previousLinkStatus: "warning",
    newLinkStatus: "healthy",
    linkedListingsProcessed: safeCount,
  };
}
