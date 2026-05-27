import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID = "reprocess_sale_customer";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   saleId?: string;
 *   marketplace?: string;
 * }} SellerToolboxReprocessSaleCustomerOperationContext
 */

/**
 * @param {SellerToolboxReprocessSaleCustomerOperationContext} context
 */
export async function executeFakeReprocessSaleCustomer(context) {
  const saleId = String(context.saleId ?? "").trim();
  if (!saleId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    customerReprocessedAt: new Date().toISOString(),
    customerStatus: "processed",
  };
}
