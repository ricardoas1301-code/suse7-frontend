import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID = "validate_marketplace_token";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   accountId?: string;
 *   accountLabel?: string;
 *   marketplace?: string;
 * }} SellerToolboxValidateMarketplaceTokenOperationContext
 */

/**
 * @param {SellerToolboxValidateMarketplaceTokenOperationContext} context
 */
export async function executeFakeValidateMarketplaceToken(context) {
  const accountId = String(context.accountId ?? "").trim();
  if (!accountId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const validatedAt = new Date().toISOString();
  const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  return {
    success: true,
    validatedAt,
    previousTokenStatus: "warning",
    newTokenStatus: "healthy",
    tokenExpiresAt,
  };
}
