import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPE_KEYS } from "./sellerToolboxCacheRefreshModel";

export const SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID = "clear_operational_cache";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   sellerName?: string;
 *   previousClearedAt?: string | null;
 * }} SellerToolboxClearOperationalCacheOperationContext
 */

/**
 * @param {SellerToolboxClearOperationalCacheOperationContext} context
 */
export async function executeFakeClearOperationalCache(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    clearedAt: new Date().toISOString(),
    clearedScopes: [...SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_SCOPE_KEYS],
  };
}
