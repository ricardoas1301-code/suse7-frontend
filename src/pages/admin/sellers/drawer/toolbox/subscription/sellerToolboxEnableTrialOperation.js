import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "./sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID = "enable_trial";

export const SELLER_TOOLBOX_FAKE_TRIAL_DAYS_GRANTED = 15;

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext} SellerToolboxSubscriptionOperationContext
 */

/**
 * @param {SellerToolboxSubscriptionOperationContext} context
 * @returns {Promise<{ trialStatus: "active"; trialDaysGranted: number }>}
 */
export async function executeFakeEnableTrial(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    trialStatus: "active",
    trialDaysGranted: SELLER_TOOLBOX_FAKE_TRIAL_DAYS_GRANTED,
  };
}
