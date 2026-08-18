import { fetchPendingListingSkus } from "../../listings/api/listingSkuApi.js";
import {
  invalidateOperationalTasksCache,
  notifyListingSkusSaved,
} from "./operationalTasksApi.js";

export async function refreshOperationalTasksAfterListingSkuSaved() {
  const pending = await fetchPendingListingSkus({ page: 1, pageSize: 1 });
  if (pending.ok && Number.isFinite(Number(pending.total))) {
    return notifyListingSkusSaved({ remainingCount: Number(pending.total) });
  }
  invalidateOperationalTasksCache({
    reason: "listing_skus_saved",
    force_revalidate: true,
  });
  return null;
}
