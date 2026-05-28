// Mapeia atalhos legados da sidebar → categorias do motor central

/** @type {Record<string, string[]>} */
export const CENTRAL_NOTIFICATION_FOCUS_GROUPS = {
  sales: ["SALES", "PROFIT"],
  products: ["PRODUCTS", "INVENTORY"],
  marketplace: ["MARKETPLACE"],
  health: ["ACCOUNT_HEALTH", "COMPETITION", "SYNC", "SYSTEM"],
};

/** @param {string} focus */
export function categoryCodesForFocus(focus) {
  const key = String(focus ?? "").trim().toLowerCase();
  return CENTRAL_NOTIFICATION_FOCUS_GROUPS[key] ?? [];
}

/** @param {string} categoryCode */
export function focusAnchorId(categoryCode) {
  return `s7-ncat-${String(categoryCode).toLowerCase()}`;
}
