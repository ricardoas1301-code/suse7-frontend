import { waitFakeOperationDelay } from "../../subscription/sellerToolboxFakeOperationTiming";
import {
  buildCustomersSyncMockCustomer,
  CUSTOMERS_SYNC_NOT_FOUND_TOKEN,
  normalizeCustomersSyncQuery,
} from "./customersSyncModel";

export const SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID = "search_customer";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   query?: string;
 * }} SellerToolboxSearchCustomerOperationContext
 */

/**
 * @param {SellerToolboxSearchCustomerOperationContext} context
 */
export async function executeFakeSearchCustomer(context) {
  const query = normalizeCustomersSyncQuery(context.query);
  if (!query) {
    throw new Error("fake_execution_failed");
  }

  if (import.meta.env.DEV && query.includes("[DEV:FORCE_ERROR]")) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  if (query.toUpperCase() === CUSTOMERS_SYNC_NOT_FOUND_TOKEN) {
    return {
      success: true,
      searchedAt: new Date().toISOString(),
      customer: null,
      empty: true,
    };
  }

  const customer = buildCustomersSyncMockCustomer(query);

  return {
    success: true,
    searchedAt: new Date().toISOString(),
    customer,
    empty: false,
  };
}
