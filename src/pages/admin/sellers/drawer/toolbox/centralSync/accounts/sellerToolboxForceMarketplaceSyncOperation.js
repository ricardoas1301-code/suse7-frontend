import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID = "force_marketplace_sync";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   accountId?: string;
 *   accountLabel?: string;
 *   marketplace?: string;
 * }} SellerToolboxForceMarketplaceSyncOperationContext
 */

/**
 * @param {SellerToolboxForceMarketplaceSyncOperationContext} context
 */
export async function executeFakeForceMarketplaceSync(context) {
  const accountId = String(context.accountId ?? "").trim();
  if (!accountId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    syncedAt: new Date().toISOString(),
    previousSyncStatus: "warning",
    newSyncStatus: "healthy",
    importedSales: 12,
    importedListings: 24,
  };
}
