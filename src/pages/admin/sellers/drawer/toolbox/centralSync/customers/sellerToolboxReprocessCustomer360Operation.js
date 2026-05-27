import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID = "reprocess_customer_360";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   customerId?: string;
 *   email?: string;
 *   phone?: string;
 *   totalOrders?: number | null;
 * }} SellerToolboxReprocessCustomer360OperationContext
 */

/**
 * @param {SellerToolboxReprocessCustomer360OperationContext} context
 */
export async function executeFakeReprocessCustomer360(context) {
  const customerId = String(context.customerId ?? "").trim();
  if (!customerId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const totalOrders = Number(context.totalOrders);
  const salesProcessed = Number.isFinite(totalOrders) ? totalOrders : 8;

  return {
    success: true,
    customer360ReprocessedAt: new Date().toISOString(),
    previousStatus: "pending",
    newStatus: "processed",
    salesProcessed,
  };
}
