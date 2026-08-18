// ======================================================================
// Constantes SSOT — paridade Central de Saúde dos Anúncios (backend).
// Fonte: suse7-backend/src/domain/listings/health/listingHealthConstants.js
// ======================================================================

export const LISTING_HEALTH_CRITICAL_STOCK_THRESHOLD = 3;

export const LISTING_HEALTH_REGISTRATION_BAND_KEYS = [
  "complete",
  "excellent",
  "attention",
  "critical",
  "urgent",
];

export const LISTING_HEALTH_OPERATIONAL_BAND_KEYS = [
  "active",
  "critical_stock",
  "zero_stock",
  "paused",
  "inactive",
];

export const LISTING_HEALTH_COMMERCIAL_BAND_KEYS = [
  "excellent_margin",
  "healthy_margin",
  "attention_margin",
  "critical_margin",
  "negative_margin",
  "no_commercial_data",
];

/** Estado neutro da lista (ordenação base). */
export const ANUNCIOS_QUICK_FILTER_NEUTRAL_ID = "top_sales";
