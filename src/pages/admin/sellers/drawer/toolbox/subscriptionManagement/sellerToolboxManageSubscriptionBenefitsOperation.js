import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../subscription/sellerToolboxFakeOperationTiming";
import { resolveNextBenefitsMutation } from "./subscriptionManagementModel";

export const SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID = "manage_subscription_benefits";

/**
 * @typedef {import("../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   benefits?: string[];
 * }} ManageSubscriptionBenefitsOperationContext
 */

/**
 * @param {ManageSubscriptionBenefitsOperationContext} context
 */
export async function executeFakeManageSubscriptionBenefits(context) {
  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const previousBenefits = Array.isArray(context.benefits) ? [...context.benefits] : [];
  const mutation = resolveNextBenefitsMutation(previousBenefits);

  return {
    success: true,
    action: mutation.action,
    benefitKey: mutation.benefitKey,
    previousBenefits,
    newBenefits: mutation.newBenefits,
    changedAt: new Date().toISOString(),
  };
}
