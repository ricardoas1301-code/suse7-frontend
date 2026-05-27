import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID = "disable_feature_flag";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   flagKey?: string;
 *   previousEnabled?: boolean;
 *   flagLabel?: string;
 * }} SellerToolboxDisableFeatureFlagOperationContext
 */

/**
 * @param {SellerToolboxDisableFeatureFlagOperationContext} context
 */
export async function executeFakeDisableFeatureFlag(context) {
  const flagKey = String(context.flagKey ?? "").trim();
  if (!flagKey) {
    throw new Error("fake_execution_failed");
  }

  if (context.previousEnabled !== true) {
    throw new Error("fake_execution_failed");
  }

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    flagKey,
    enabled: false,
    updatedAt: new Date().toISOString(),
  };
}
