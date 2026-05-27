import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { resolveNextSubscriptionLifecycleStatus } from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID = "manage_subscription_status";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   subscriptionStatus?: string;
 * }} ManageSubscriptionStatusOperationContext
 */

/**
 * @param {ManageSubscriptionStatusOperationContext} context
 */
export async function executeFakeManageSubscriptionStatus(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousStatus = String(context.subscriptionStatus ?? "active").trim() || "active";
  const newStatus = resolveNextSubscriptionLifecycleStatus(previousStatus);

  return {
    success: true,
    previousStatus,
    newStatus,
    changedAt: new Date().toISOString(),
  };
}
