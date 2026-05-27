import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { resolveNextBillingCycle } from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID = "change_billing_cycle";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   billingCycle?: string;
 * }} ChangeBillingCycleOperationContext
 */

/**
 * @param {ChangeBillingCycleOperationContext} context
 */
export async function executeFakeChangeBillingCycle(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousBillingCycle = String(context.billingCycle ?? "monthly").trim() || "monthly";
  const newBillingCycle = resolveNextBillingCycle(previousBillingCycle);

  return {
    success: true,
    previousBillingCycle,
    newBillingCycle,
    changedAt: new Date().toISOString(),
  };
}
