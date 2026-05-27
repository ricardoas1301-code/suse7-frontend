import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "./sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_END_TRIAL_ACTION_ID = "end_trial";

/**
 * @typedef {import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext} SellerToolboxSubscriptionOperationContext
 */

/**
 * @param {SellerToolboxSubscriptionOperationContext} context
 * @returns {Promise<{ trialStatus: "ended" }>}
 */
export async function executeFakeEndTrial(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    trialStatus: "ended",
  };
}
