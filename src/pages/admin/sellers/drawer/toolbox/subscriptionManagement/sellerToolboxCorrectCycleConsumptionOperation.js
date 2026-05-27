import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import {
  SUBSCRIPTION_MANAGEMENT_FAKE_NEW_CONSUMPTION,
  computeRemainingSales,
} from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID = "correct_cycle_consumption";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   salesLimit?: number;
 *   currentConsumption?: number;
 * }} CorrectCycleConsumptionOperationContext
 */

/**
 * @param {CorrectCycleConsumptionOperationContext} context
 */
export async function executeFakeCorrectCycleConsumption(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const salesLimit = Number(context.salesLimit ?? 5000);
  const previousConsumption = Number(context.currentConsumption ?? 1825);
  const newConsumption = SUBSCRIPTION_MANAGEMENT_FAKE_NEW_CONSUMPTION;

  return {
    success: true,
    previousConsumption,
    newConsumption,
    remainingSales: computeRemainingSales(salesLimit, newConsumption),
    changedAt: new Date().toISOString(),
  };
}
