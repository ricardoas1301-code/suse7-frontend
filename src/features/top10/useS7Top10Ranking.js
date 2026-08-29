// ======================================================================
// Hook local (sem estado global): Top 10 quantity → Map listing_id → entry.
// Uma consulta por página/scope; lookup O(1) nas linhas.
// ======================================================================

import { useCallback, useMemo } from "react";
import { useSalesTop10 } from "../../hooks/useSalesTop10.js";
import { buildLocalLast30DaysTop10Params } from "./buildLocalLast30DaysTop10Params.js";
import {
  buildTop10QuantityRankLookup,
  lookupTop10Rank,
  lookupTop10RankEntry,
  pickListingIdForTop10Badge,
} from "./buildTop10QuantityRankLookup.js";

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @param {string} fallbackMarketplace
 */
function resolveRowMarketplace(row, fallbackMarketplace) {
  if (row?.marketplace != null && String(row.marketplace).trim() !== "") {
    return String(row.marketplace).trim();
  }
  if (row?.marketplaceRaw != null && String(row.marketplaceRaw).trim() !== "") {
    return String(row.marketplaceRaw).trim();
  }
  return fallbackMarketplace || "mercado_livre";
}

/**
 * @param {{
 *   marketplaceAccountId?: string | null;
 *   marketplace?: string | null;
 *   enabled?: boolean;
 * }} [options]
 */
export function useS7Top10Ranking(options = {}) {
  const accountId =
    options.marketplaceAccountId != null ? String(options.marketplaceAccountId).trim() : "";
  const marketplace = options.marketplace != null ? String(options.marketplace).trim() : "";
  const enabled = options.enabled !== false;

  const params = useMemo(
    () =>
      buildLocalLast30DaysTop10Params({
        marketplaceAccountId: accountId,
        marketplace,
      }),
    [accountId, marketplace],
  );

  const top10 = useSalesTop10(params, { enabled });

  const rankByListingId = useMemo(
    () => buildTop10QuantityRankLookup(top10.topListingsByQuantity),
    [top10.topListingsByQuantity],
  );

  const getEntryForListingId = useCallback(
    /**
     * @param {unknown} listingId
     * @param {string} [marketplaceHint]
     */
    (listingId, marketplaceHint) =>
      lookupTop10RankEntry(
        rankByListingId,
        listingId,
        marketplaceHint || marketplace || "mercado_livre",
      ),
    [rankByListingId, marketplace],
  );

  const getRankForListingId = useCallback(
    /**
     * @param {unknown} listingId
     * @param {string} [marketplaceHint]
     */
    (listingId, marketplaceHint) =>
      lookupTop10Rank(rankByListingId, listingId, marketplaceHint || marketplace || "mercado_livre"),
    [rankByListingId, marketplace],
  );

  const getEntryForRow = useCallback(
    /**
     * @param {Record<string, unknown> | null | undefined} row
     */
    (row) => {
      const listingId = pickListingIdForTop10Badge(row);
      if (!listingId) return null;
      return lookupTop10RankEntry(rankByListingId, listingId, resolveRowMarketplace(row, marketplace));
    },
    [rankByListingId, marketplace],
  );

  const getRankForRow = useCallback(
    /**
     * @param {Record<string, unknown> | null | undefined} row
     */
    (row) => getEntryForRow(row)?.rank ?? null,
    [getEntryForRow],
  );

  return {
    rankByListingId,
    getEntryForListingId,
    getRankForListingId,
    getEntryForRow,
    getRankForRow,
    loading: top10.loading,
    refreshing: top10.refreshing,
    error: top10.error,
    succeeded: top10.succeeded,
    topListingsByQuantity: top10.topListingsByQuantity,
  };
}
