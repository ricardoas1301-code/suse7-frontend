import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID = "enable_feature_flag";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   flagKey?: string;
 *   previousEnabled?: boolean;
 *   flagLabel?: string;
 * }} SellerToolboxEnableFeatureFlagOperationContext
 */

/**
 * @param {SellerToolboxEnableFeatureFlagOperationContext} context
 */
export async function executeFakeEnableFeatureFlag(context) {
  const flagKey = String(context.flagKey ?? "").trim();
  if (!flagKey) {
    throw new Error("fake_execution_failed");
  }

  if (context.previousEnabled === true) {
    throw new Error("fake_execution_failed");
  }

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    flagKey,
    enabled: true,
    updatedAt: new Date().toISOString(),
  };
}
