import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PRICE } from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID = "edit_subscription_price";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   subscriptionPrice?: number;
 * }} EditSubscriptionPriceOperationContext
 */

/**
 * @param {EditSubscriptionPriceOperationContext} context
 */
export async function executeFakeEditSubscriptionPrice(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousPrice = Number(context.subscriptionPrice ?? 149.9);

  return {
    success: true,
    previousPrice,
    newPrice: SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PRICE,
    changedAt: new Date().toISOString(),
  };
}
