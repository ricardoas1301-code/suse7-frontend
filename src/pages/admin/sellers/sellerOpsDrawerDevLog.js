const PREFIX = "[S7][SellerDrawer]";

/**
 * Instrumentação DEV — abertura do drawer seller (sem analytics).
 * @param {"row_click_open" | "open_blocked" | "button_fallback" | "state_loading" | "state_empty" | "state_error"} event
 * @param {Record<string, unknown>} [payload]
 */
export function logSellerDrawer(event, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.info(`${PREFIX} ${event}`, payload);
}
