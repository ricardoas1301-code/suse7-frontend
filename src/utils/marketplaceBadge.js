// ======================================================================
// Branding por marketplace (badge/canal) — fonte única para UI.
// ======================================================================

/**
 * @typedef {{
 *   label: string;
 *   logoSrc: string | null;
 *   fallbackIcon: "catalog_filter_mkt";
 * }} MarketplaceBrand
 */

/**
 * @param {string | null | undefined} raw
 * @returns {string}
 */
function normalizeMarketplaceCode(raw) {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (key === "mercadolivre" || key === "ml") return "mercado_livre";
  return key;
}

/** @type {Record<string, MarketplaceBrand>} */
const MARKETPLACE_BRAND_MAP = {
  mercado_livre: {
    label: "Mercado Livre",
    logoSrc: "/marketplaces/mercado-livre.png",
    fallbackIcon: "catalog_filter_mkt",
  },
  shopee: {
    label: "Shopee",
    logoSrc: null,
    fallbackIcon: "catalog_filter_mkt",
  },
  amazon: {
    label: "Amazon",
    logoSrc: null,
    fallbackIcon: "catalog_filter_mkt",
  },
  shein: {
    label: "Shein",
    logoSrc: null,
    fallbackIcon: "catalog_filter_mkt",
  },
  magalu: {
    label: "Magalu",
    logoSrc: null,
    fallbackIcon: "catalog_filter_mkt",
  },
};

/**
 * @param {string | null | undefined} marketplaceCode
 * @returns {MarketplaceBrand}
 */
export function getMarketplaceBrand(marketplaceCode) {
  const code = normalizeMarketplaceCode(marketplaceCode);
  if (MARKETPLACE_BRAND_MAP[code]) return MARKETPLACE_BRAND_MAP[code];
  const pretty = code
    ? code
        .replace(/_/g, " ")
        .split(" ")
        .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : ""))
        .join(" ")
    : "Marketplace";
  return {
    label: pretty,
    logoSrc: null,
    fallbackIcon: "catalog_filter_mkt",
  };
}

/**
 * Compat: consumidores antigos do badge.
 * @param {string | null | undefined} marketplaceSlug
 * @returns {{ src: string; alt: string } | null}
 */
export function getMarketplaceBadgeAsset(marketplaceSlug) {
  const brand = getMarketplaceBrand(marketplaceSlug);
  return brand.logoSrc ? { src: brand.logoSrc, alt: brand.label } : null;
}
