/** Mesmo debounce do modal individual. */
export const LISTING_SKU_LOOKUP_DEBOUNCE_MS = 320;

export const LISTING_SKU_LOOKUP_MSG_SEARCHING = "Buscando produto para este SKU...";

export const LISTING_SKU_LOOKUP_MSG_NOT_FOUND =
  "Nenhum produto encontrado com este SKU no seu cat├ílogo.";

export const LISTING_SKU_LOOKUP_SAVE_ACTION_INDIVIDUAL = "Salvar";
export const LISTING_SKU_LOOKUP_SAVE_ACTION_BATCH = "Salvar SKUs";

/**
 * @param {string} saveActionLabel
 */
export function buildListingSkuLookupNotFoundMessage(saveActionLabel) {
  const action = String(saveActionLabel ?? "").trim();
  if (!action) return LISTING_SKU_LOOKUP_MSG_NOT_FOUND;
  return `${LISTING_SKU_LOOKUP_MSG_NOT_FOUND} Caso queira cadastrar este SKU como novo, clique em ${action}.`;
}

/**
 * Match existente rejeitado pelo seller ÔÇö exige reset completo da resolu├º├úo.
 * @param {{
 *   productId: string;
 *   selectedProductId: string;
 *   skuMatchesCount: number;
 * }} params
 */
export function shouldRejectListingSkuExistingMatch({
  productId,
  selectedProductId,
  skuMatchesCount,
}) {
  return selectedProductId === productId && skuMatchesCount > 0;
}

/**
 * Normaliza SKU para consulta/persist├¬ncia: trim externo apenas (preserva zeros ├á esquerda).
 * @param {unknown} value
 */
export function normalizeListingSkuInput(value) {
  return String(value ?? "").trim();
}

/**
 * @param {Record<string, unknown>} payload
 */
export function mapProdutoSkuLookup(payload) {
  return {
    id: payload?.id != null ? String(payload.id).trim() : "",
    productName:
      payload?.product_name != null && String(payload.product_name).trim() !== ""
        ? String(payload.product_name).trim()
        : "Produto sem nome",
    sku:
      payload?.sku != null && String(payload.sku).trim() !== ""
        ? String(payload.sku).trim()
        : null,
    matchedBy: payload?.matched_by === "variant" ? "variant" : "product",
    matchedVariantSku:
      payload?.matched_variant_sku != null && String(payload.matched_variant_sku).trim() !== ""
        ? String(payload.matched_variant_sku).trim()
        : null,
    productImages: payload?.product_images != null ? payload.product_images : null,
    productImageLinks: Array.isArray(payload?.product_image_links) ? payload.product_image_links : [],
  };
}

/**
 * @param {{
 *   trimmedSku: string;
 *   lookupLoading: boolean;
 *   lookupSettledSku: string;
 *   skuMatches: { id: string }[];
 *   selectedProductId: string;
 *   lookupError: string;
 * }} state
 */
export function evaluateListingSkuRowReady(state) {
  const trimmedSku = normalizeListingSkuInput(state.trimmedSku);
  if (!trimmedSku) return false;
  if (trimmedSku.length >= 2 && (state.lookupLoading || state.lookupSettledSku !== trimmedSku)) {
    return false;
  }
  if (state.lookupError) return false;
  if (state.skuMatches.length === 0) {
    return state.lookupSettledSku === trimmedSku;
  }
  return (
    Boolean(state.selectedProductId) &&
    state.skuMatches.some((entry) => entry.id === state.selectedProductId)
  );
}

/**
 * @param {{
 *   trimmedSku: string;
 *   lookupLoading: boolean;
 *   lookupSettledSku: string;
 *   skuMatches: { id: string }[];
 *   selectedProductId: string;
 *   lookupError: string;
 * }} state
 */
export function evaluateListingSkuIndividualConfirmReady(state) {
  const trimmedSku = normalizeListingSkuInput(state.trimmedSku);
  if (!trimmedSku) return false;
  if (trimmedSku.length >= 2 && (state.lookupLoading || state.lookupSettledSku !== trimmedSku)) {
    return false;
  }
  if (state.lookupError) return false;
  const hasSelection =
    Boolean(state.selectedProductId) &&
    state.skuMatches.some((entry) => entry.id === state.selectedProductId);
  return state.skuMatches.length <= 1 || hasSelection;
}
