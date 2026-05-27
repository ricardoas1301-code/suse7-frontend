import {
  computeConsumptionPercentage,
  computeConsumptionRemaining,
  normalizeConsumptionAmount,
  resolveConsumptionStatus,
  SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK,
  SELLER_TOOLBOX_FAKE_RECALCULATED_CONSUMED,
} from "./sellerToolboxConsumptionModel";
import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "./sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID = "recalculate_consumption";

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   monthlyLimit?: number;
 *   previousConsumed?: number;
 * }} SellerToolboxRecalculateConsumptionOperationContext
 */

/**
 * @param {SellerToolboxRecalculateConsumptionOperationContext} context
 */
export async function executeFakeRecalculateConsumption(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  const monthlyLimit = normalizeConsumptionAmount(
    context.monthlyLimit ?? SELLER_TOOLBOX_CONSUMPTION_DEFAULT_MOCK.monthlyLimit,
  );
  const previousConsumed = normalizeConsumptionAmount(context.previousConsumed);
  const consumed = SELLER_TOOLBOX_FAKE_RECALCULATED_CONSUMED;
  const remaining = computeConsumptionRemaining(monthlyLimit, consumed);
  const percentage = computeConsumptionPercentage(monthlyLimit, consumed);
  const status = resolveConsumptionStatus(percentage);
  const recalculatedAt = new Date().toISOString();

  await waitFakeOperationDelay();

  return {
    success: true,
    consumed,
    remaining,
    percentage,
    status,
    previousConsumed,
    newConsumed: consumed,
    monthlyLimit,
    recalculatedAt,
    sources: [
      {
        marketplace: "mercado_livre",
        marketplaceLabel: "Mercado Livre",
        accounts: 1,
        companies: 1,
        salesCount: consumed,
      },
    ],
  };
}
