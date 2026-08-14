import { buildApiUrl, apiFetch } from "../../../config/api.js";
import { mapProdutoSkuLookup, normalizeListingSkuInput } from "./listingSkuLookupDomain.js";

export {
  LISTING_SKU_LOOKUP_DEBOUNCE_MS,
  LISTING_SKU_LOOKUP_MSG_NOT_FOUND,
  LISTING_SKU_LOOKUP_MSG_SEARCHING,
  LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH,
  LISTING_SKU_LOOKUP_SAVE_ACTION_INDIVIDUAL,
  buildListingSkuLookupNotFoundMessage,
  evaluateListingSkuIndividualConfirmReady,
  evaluateListingSkuRowReady,
  mapProdutoSkuLookup,
  normalizeListingSkuInput,
  shouldRejectListingSkuExistingMatch,
} from "./listingSkuLookupDomain.js";

/**
 * @param {string} query
 */
export async function fetchListingSkuLookup(query) {
  const normalized = normalizeListingSkuInput(query);
  const url = buildApiUrl(`/api/ml/listings/sku-lookup?sku=${encodeURIComponent(normalized)}`);
  if (!url) {
    return {
      ok: false,
      error: "Configure VITE_API_BASE_URL.",
      products: [],
      query: normalized,
    };
  }

  const response = await apiFetch(url, { method: "GET" });
  if (!response.ok) {
    return {
      ok: false,
      error:
        typeof response.error === "string"
          ? response.error
          : "Não foi possível localizar o produto por SKU.",
      products: [],
      query: normalized,
    };
  }

  const products = Array.isArray(response.data?.products)
    ? response.data.products
        .map((entry) =>
          mapProdutoSkuLookup(
            entry && typeof entry === "object" ? /** @type {Record<string, unknown>} */ (entry) : {},
          ),
        )
        .filter((entry) => entry.id)
    : [];

  return {
    ok: true,
    error: "",
    products,
    query: normalized,
  };
}
