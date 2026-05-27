import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { SELLER_TOOLBOX_REFRESH_SELLER_SCOPE_KEYS } from "./sellerToolboxCacheRefreshModel";

export const SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID = "refresh_seller";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   sellerName?: string;
 *   previousRefreshedAt?: string | null;
 * }} SellerToolboxRefreshSellerOperationContext
 */

/**
 * @param {SellerToolboxRefreshSellerOperationContext} context
 */
export async function executeFakeRefreshSeller(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    refreshedAt: new Date().toISOString(),
    refreshedScopes: [...SELLER_TOOLBOX_REFRESH_SELLER_SCOPE_KEYS],
  };
}
