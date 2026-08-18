/**
 * @param {{
 *   listingId: string | null | undefined;
 *   marketplace?: string | null | undefined;
 *   marketplaceAccountId?: string | null | undefined;
 * }} input
 */
export function buildListingExecutiveApiParams({
  listingId,
  marketplace = null,
  marketplaceAccountId = null,
}) {
  const listingIdNorm = String(listingId ?? "").trim();
  if (!listingIdNorm) return null;

  const params = {
    q: listingIdNorm,
    period_preset: "lifetime",
    ranking_limit: 10,
  };

  const marketplaceNorm = String(marketplace ?? "").trim();
  if (marketplaceNorm) params.marketplace = marketplaceNorm;

  const accountNorm = String(marketplaceAccountId ?? "").trim();
  if (accountNorm) params.marketplace_account_id = accountNorm;

  return params;
}
