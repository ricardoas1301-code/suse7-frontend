import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "./sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID = "add_subscription_days";

export const SELLER_TOOLBOX_FAKE_ADDED_DAYS = 15;

/**
 * @typedef {{
 *   sellerId: string;
 *   reason: string;
 *   reasonLength: number;
 * }} SellerToolboxSubscriptionOperationContext
 */

/**
 * @param {SellerToolboxSubscriptionOperationContext} context
 * @returns {Promise<{ addedDays: number }>}
 */
export async function executeFakeAddDays(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    addedDays: SELLER_TOOLBOX_FAKE_ADDED_DAYS,
  };
}
