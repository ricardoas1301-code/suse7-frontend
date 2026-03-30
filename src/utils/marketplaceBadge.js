// ======================================================================
// Logo / identidade visual por marketplace (grid de anúncios e afins).
// ======================================================================

/**
 * @typedef {{ src: string; alt: string }} MarketplaceBadgeAsset
 */

/** @type {Record<string, MarketplaceBadgeAsset>} */
const MERCADO_LIVRE = {
  src: "/marketplaces/mercadolivre.png",
  alt: "Mercado Livre",
};

/**
 * @param {string | null | undefined} marketplaceSlug — ex.: mercado_livre, shopee
 * @returns {MarketplaceBadgeAsset | null}
 */
export function getMarketplaceBadgeAsset(marketplaceSlug) {
  const m = String(marketplaceSlug || "")
    .trim()
    .toLowerCase();
  if (m === "mercado_livre" || m === "mercadolivre") return MERCADO_LIVRE;
  if (m === "shopee") return null;
  if (m === "amazon") return null;
  if (m === "shein") return null;
  return null;
}
