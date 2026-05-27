import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PLAN } from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID = "change_subscription_plan";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   currentPlan?: string;
 * }} ChangePlanOperationContext
 */

/**
 * @param {ChangePlanOperationContext} context
 */
export async function executeFakeChangeSubscriptionPlan(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousPlan = String(context.currentPlan ?? "Pro").trim() || "Pro";

  return {
    success: true,
    previousPlan,
    newPlan: SUBSCRIPTION_MANAGEMENT_FAKE_NEW_PLAN,
    changedAt: new Date().toISOString(),
  };
}
