import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID = "recalculate_sale_financial";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   saleId?: string;
 *   marketplace?: string;
 *   previousNetAmount?: number;
 * }} SellerToolboxRecalculateSaleFinancialOperationContext
 */

/**
 * @param {SellerToolboxRecalculateSaleFinancialOperationContext} context
 */
export async function executeFakeRecalculateSaleFinancial(context) {
  const saleId = String(context.saleId ?? "").trim();
  if (!saleId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  const previousNetAmount = Number(context.previousNetAmount);
  const safePrevious = Number.isFinite(previousNetAmount) ? previousNetAmount : 169.89;

  await waitFakeOperationDelay();

  return {
    success: true,
    recalculatedAt: new Date().toISOString(),
    previousNetAmount: safePrevious,
    newNetAmount: Math.round((safePrevious + 1.53) * 100) / 100,
    financialStatus: "healthy",
  };
}
