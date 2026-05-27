import { waitFakeOperationDelay } from "../../subscription/sellerToolboxFakeOperationTiming";
import {
  buildAccountsSyncMockAccount,
  ACCOUNTS_SYNC_NOT_FOUND_TOKEN,
  normalizeAccountsSyncQuery,
} from "./accountsSyncModel";

export const SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID = "search_marketplace_account";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   query?: string;
 * }} SellerToolboxSearchMarketplaceAccountOperationContext
 */

/**
 * @param {SellerToolboxSearchMarketplaceAccountOperationContext} context
 */
export async function executeFakeSearchMarketplaceAccount(context) {
  const query = normalizeAccountsSyncQuery(context.query);
  if (!query) {
    throw new Error("fake_execution_failed");
  }

  if (import.meta.env.DEV && query.includes("[DEV:FORCE_ERROR]")) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  if (query.toUpperCase() === ACCOUNTS_SYNC_NOT_FOUND_TOKEN) {
    return {
      success: true,
      searchedAt: new Date().toISOString(),
      account: null,
      empty: true,
    };
  }

  const account = buildAccountsSyncMockAccount(query);

  return {
    success: true,
    searchedAt: new Date().toISOString(),
    account,
    empty: false,
  };
}
