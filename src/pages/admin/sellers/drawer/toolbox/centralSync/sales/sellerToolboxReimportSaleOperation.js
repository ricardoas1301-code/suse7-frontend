import {
  shouldSimulateSubscriptionOperationFailure,
  waitFakeOperationDelay,
} from "../../subscription/sellerToolboxFakeOperationTiming";

export const SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID = "reimport_sale";

export const SELLER_TOOLBOX_REIMPORT_SALE_SCOPES = Object.freeze([
  "sale_order",
  "sale_items",
  "marketplace_payload",
]);

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   saleId?: string;
 *   marketplace?: string;
 * }} SellerToolboxReimportSaleOperationContext
 */

/**
 * @param {SellerToolboxReimportSaleOperationContext} context
 */
export async function executeFakeReimportSale(context) {
  const saleId = String(context.saleId ?? "").trim();
  if (!saleId) throw new Error("fake_execution_failed");

  if (shouldSimulateSubscriptionOperationFailure(context.reason)) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  return {
    success: true,
    reimportedAt: new Date().toISOString(),
    refreshedScopes: [...SELLER_TOOLBOX_REIMPORT_SALE_SCOPES],
  };
}
