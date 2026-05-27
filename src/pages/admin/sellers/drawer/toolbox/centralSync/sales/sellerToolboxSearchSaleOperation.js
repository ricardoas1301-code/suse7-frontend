import { waitFakeOperationDelay } from "../../subscription/sellerToolboxFakeOperationTiming";
import { buildSalesSyncMockSale, normalizeSalesSyncSaleId } from "./salesSyncModel";

export const SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID = "search_sale";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   saleId?: string;
 * }} SellerToolboxSearchSaleOperationContext
 */

/**
 * @param {SellerToolboxSearchSaleOperationContext} context
 */
export async function executeFakeSearchSale(context) {
  const saleId = normalizeSalesSyncSaleId(context.saleId);
  if (!saleId) {
    throw new Error("fake_execution_failed");
  }

  if (import.meta.env.DEV && saleId.includes("[DEV:FORCE_ERROR]")) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  const sale = buildSalesSyncMockSale(saleId);

  return {
    success: true,
    searchedAt: new Date().toISOString(),
    sale,
  };
}
