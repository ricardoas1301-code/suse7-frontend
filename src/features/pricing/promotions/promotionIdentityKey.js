// ======================================================
// S4.3.6.16 — PromotionIdentityKey estável (fail-closed).
// Identidade por IDs oficiais — nunca por título/índice/família.
// ======================================================

/**
 * @typedef {{
 *   marketplaceAccountId: string | null;
 *   sellerId: string | null;
 *   listingId: string | null;
 *   variationId: string | null;
 *   promotionId: string | null;
 *   campaignId: string | null;
 *   dealId: string | null;
 *   offerId: string | null;
 *   promotionType: string | null;
 *   subType: string | null;
 *   identityKey: string;
 * }} PromotionIdentityKeyParts
 */

/** @param {unknown} v @returns {string | null} */
function normId(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s !== "" ? s : null;
}

/** @param {Record<string, unknown> | null | undefined} obj @param {string[]} keys */
function pickId(obj, keys) {
  if (obj == null) return null;
  for (const key of keys) {
    const value = normId(obj[key]);
    if (value != null) return value;
  }
  return null;
}

/**
 * Extrai partes de identidade a partir do scenario / contrato.
 * @param {{
 *   scenario?: unknown;
 *   listingExternalId?: string | null;
 *   accountId?: string | null;
 *   variationId?: string | null;
 * }} ctx
 * @returns {PromotionIdentityKeyParts}
 */
export function buildPromotionIdentityKeyParts(ctx = {}) {
  const scenario =
    ctx.scenario != null && typeof ctx.scenario === "object"
      ? /** @type {Record<string, unknown>} */ (ctx.scenario)
      : {};
  const card =
    scenario.promotion_card_contract != null && typeof scenario.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.promotion_card_contract)
      : null;
  const offer =
    scenario.promotion_offer_contract != null && typeof scenario.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.promotion_offer_contract)
      : null;
  const raw =
    offer?.raw_source_fields != null && typeof offer.raw_source_fields === "object"
      ? /** @type {Record<string, unknown>} */ (offer.raw_source_fields)
      : card?.source_fields != null && typeof card.source_fields === "object"
        ? /** @type {Record<string, unknown>} */ (card.source_fields)
        : null;

  const layers = [card, offer, raw, scenario];

  /** @param {string[]} keys */
  const fromLayers = (keys) => {
    for (const layer of layers) {
      const hit = pickId(layer, keys);
      if (hit != null) return hit;
    }
    return null;
  };

  const marketplaceAccountId =
    normId(ctx.accountId) ?? fromLayers(["marketplace_account_id", "account_id"]);
  const sellerId = fromLayers(["seller_id", "sellerId"]);
  const listingId =
    normId(ctx.listingExternalId) ??
    fromLayers(["listing_id", "listing_external_id", "external_listing_id", "item_id"]);
  const variationId = normId(ctx.variationId) ?? fromLayers(["variation_id", "variationId"]);
  const promotionId = fromLayers(["promotion_id", "id"]);
  const campaignId = fromLayers(["campaign_id", "campaignId"]);
  const dealId = fromLayers(["deal_id", "dealId"]);
  const offerId = fromLayers(["offer_id", "ref_id"]);
  const promotionType = fromLayers(["promotion_type", "type"]);
  const subType = fromLayers(["sub_type", "subtype", "promotion_sub_type"]);

  const identityKey = [
    marketplaceAccountId ?? "",
    sellerId ?? "",
    listingId ?? "",
    variationId ?? "",
    promotionId ?? "",
    campaignId ?? "",
    dealId ?? "",
    offerId ?? "",
    promotionType ?? "",
    subType ?? "",
  ].join("::");

  return {
    marketplaceAccountId,
    sellerId,
    listingId,
    variationId,
    promotionId,
    campaignId,
    dealId,
    offerId,
    promotionType,
    subType,
    identityKey,
  };
}

/**
 * Chave canônica estável — string única por promoção+anúncio.
 * @param {Parameters<typeof buildPromotionIdentityKeyParts>[0]} ctx
 */
export function buildPromotionIdentityKey(ctx = {}) {
  return buildPromotionIdentityKeyParts(ctx).identityKey;
}

/**
 * Verifica se a identidade tem evidência mínima (listing + promo/offer/deal).
 * @param {PromotionIdentityKeyParts} parts
 */
export function promotionIdentityIsComplete(parts) {
  if (parts.listingId == null || parts.listingId === "") return false;
  return (
    (parts.promotionId != null && parts.promotionId !== "") ||
    (parts.offerId != null && parts.offerId !== "") ||
    (parts.dealId != null && parts.dealId !== "") ||
    (parts.campaignId != null && parts.campaignId !== "")
  );
}
