import { waitFakeOperationDelay } from "../../subscription/sellerToolboxFakeOperationTiming";
import {
  buildProductsSyncMockProduct,
  normalizeProductsSyncQuery,
  PRODUCTS_SYNC_NOT_FOUND_TOKEN,
} from "./productsSyncModel";

export const SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID = "search_product";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   query?: string;
 * }} SellerToolboxSearchProductOperationContext
 */

/**
 * @param {SellerToolboxSearchProductOperationContext} context
 */
export async function executeFakeSearchProduct(context) {
  const query = normalizeProductsSyncQuery(context.query);
  if (!query) {
    throw new Error("fake_execution_failed");
  }

  if (import.meta.env.DEV && query.includes("[DEV:FORCE_ERROR]")) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  if (query.toUpperCase() === PRODUCTS_SYNC_NOT_FOUND_TOKEN) {
    return {
      success: true,
      searchedAt: new Date().toISOString(),
      product: null,
      empty: true,
    };
  }

  const product = buildProductsSyncMockProduct(query);

  return {
    success: true,
    searchedAt: new Date().toISOString(),
    product,
    empty: false,
  };
}
