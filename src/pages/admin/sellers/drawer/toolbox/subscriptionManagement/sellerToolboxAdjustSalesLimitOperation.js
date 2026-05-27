import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { SUBSCRIPTION_MANAGEMENT_FAKE_NEW_LIMIT } from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID = "adjust_sales_limit";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   salesLimit?: number;
 * }} AdjustSalesLimitOperationContext
 */

/**
 * @param {AdjustSalesLimitOperationContext} context
 */
export async function executeFakeAdjustSalesLimit(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousLimit = Number(context.salesLimit ?? 5000);

  return {
    success: true,
    previousLimit,
    newLimit: SUBSCRIPTION_MANAGEMENT_FAKE_NEW_LIMIT,
    changedAt: new Date().toISOString(),
  };
}
