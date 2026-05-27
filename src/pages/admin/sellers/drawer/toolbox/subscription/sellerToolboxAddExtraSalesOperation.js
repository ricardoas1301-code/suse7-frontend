import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "./sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_ADD_SUBSCRIPTION_SALES_ACTION_ID = "add_subscription_sales";

export const SELLER_TOOLBOX_FAKE_ADDED_SALES = 100;

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext} SellerToolboxSubscriptionOperationContext
 */

/**
 * @param {SellerToolboxSubscriptionOperationContext} context
 * @returns {Promise<{ addedSales: number }>}
 */
export async function executeFakeAddSales(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    addedSales: SELLER_TOOLBOX_FAKE_ADDED_SALES,
  };
}
