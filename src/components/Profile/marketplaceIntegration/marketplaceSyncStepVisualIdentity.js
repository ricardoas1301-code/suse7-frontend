/** Identidade visual fixa por etapa — ordem canônica do checklist ML (8 etapas). */
export const MARKETPLACE_SYNC_STEP_VISUAL_IDENTITY_BY_KEY = {
  ml_connect: "connect",
  sales_recent: "sales",
  listings: "listings",
  fees: "fees",
  products: "products",
  customers: "customers",
  monitoring: "monitoring",
  historical_sales: "historical",
};

/**
 * @param {string} stepKey
 * @returns {string}
 */
export function resolveMarketplaceSyncStepVisualIdentity(stepKey) {
  return MARKETPLACE_SYNC_STEP_VISUAL_IDENTITY_BY_KEY[String(stepKey || "")] || "connect";
}
