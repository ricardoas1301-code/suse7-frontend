// ======================================================================
// CPJ-0001 S1.02 — data-refresh in-place (sem remount/page-refresh).
// ======================================================================

export const S7_SSOT_SALES_DATA_REFRESH_EVENT = "s7:ssot-sales-data-refresh";

/**
 * Dispara atualização de dados de vendas/dashboard sem remontar a página.
 * @param {{ source?: string; marketplace_account_id?: string | null }} [detail]
 */
export function notifySsotSalesDataRefresh(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(S7_SSOT_SALES_DATA_REFRESH_EVENT, {
      detail: {
        source: detail.source || "sync",
        marketplace_account_id: detail.marketplace_account_id ?? null,
        at: Date.now(),
      },
    }),
  );
}

/**
 * @param {(detail: Record<string, unknown>) => void} handler
 * @returns {() => void}
 */
export function subscribeSsotSalesDataRefresh(handler) {
  if (typeof window === "undefined") return () => {};
  /** @param {Event} event */
  const listener = (event) => {
    const detail =
      event instanceof CustomEvent && event.detail != null && typeof event.detail === "object"
        ? /** @type {Record<string, unknown>} */ (event.detail)
        : {};
    handler(detail);
  };
  window.addEventListener(S7_SSOT_SALES_DATA_REFRESH_EVENT, listener);
  return () => window.removeEventListener(S7_SSOT_SALES_DATA_REFRESH_EVENT, listener);
}
