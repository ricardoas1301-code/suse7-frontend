import {
  computeConsumptionPercentage,
  computeConsumptionRemaining,
  normalizeConsumptionAmount,
  resolveConsumptionStatus,
  SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK,
} from "./sellerToolboxConsumptionModel";
import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "./sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_RESET_CONSUMPTION_ACTION_ID = "reset_consumption";

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   monthlyLimit?: number;
 *   previousConsumed?: number;
 * }} SellerToolboxResetConsumptionOperationContext
 */

/**
 * @param {SellerToolboxResetConsumptionOperationContext} context
 */
export async function executeFakeResetConsumption(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  const monthlyLimit = normalizeConsumptionAmount(
    context.monthlyLimit ?? SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit,
  );
  const previousConsumed = normalizeConsumptionAmount(context.previousConsumed);
  const consumed = 0;
  const remaining = computeConsumptionRemaining(monthlyLimit, consumed);
  const percentage = computeConsumptionPercentage(monthlyLimit, consumed);
  const status = resolveConsumptionStatus(percentage);

  await waitFakeOperationDelay();

  return {
    success: true,
    consumed,
    remaining,
    percentage,
    status,
    previousConsumed,
    newConsumed: consumed,
    sources: [],
    recalculatedAt: null,
  };
}
