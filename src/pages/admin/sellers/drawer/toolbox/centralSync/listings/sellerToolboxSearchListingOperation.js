import { waitFakeOperationDelay } from "../../subscription/sellerToolboxFakeOperationTiming";
import {
  buildListingsSyncMockListing,
  LISTINGS_SYNC_NOT_FOUND_TOKEN,
  normalizeListingsSyncQuery,
} from "./listingsSyncModel";

export const SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID = "search_listing";

/**
 * @typedef {import("../../subscription/sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext & {
 *   query?: string;
 * }} SellerToolboxSearchListingOperationContext
 */

/**
 * @param {SellerToolboxSearchListingOperationContext} context
 */
export async function executeFakeSearchListing(context) {
  const query = normalizeListingsSyncQuery(context.query);
  if (!query) {
    throw new Error("fake_execution_failed");
  }

  if (import.meta.env.DEV && query.includes("[DEV:FORCE_ERROR]")) {
    throw new Error("fake_execution_failed");
  }

  await waitFakeOperationDelay();

  if (query.toUpperCase() === LISTINGS_SYNC_NOT_FOUND_TOKEN) {
    return {
      success: true,
      searchedAt: new Date().toISOString(),
      listing: null,
      empty: true,
    };
  }

  const listing = buildListingsSyncMockListing(query);

  return {
    success: true,
    searchedAt: new Date().toISOString(),
    listing,
    empty: false,
  };
}
