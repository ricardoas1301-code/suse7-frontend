const OPEN_EVENT = "s7:daily-sales-summary:open-modal";

/**
 * @param {Record<string, unknown>} inboxItem
 * @param {"auto_popup" | "inbox_click" | "inbox_page_click"} [source]
 */
export function emitOpenDailySalesSummaryModal(inboxItem, source = "inbox_click") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OPEN_EVENT, {
      detail: {
        source,
        inboxItem,
      },
    }),
  );
}

export function getDailySalesSummaryOpenEventName() {
  return OPEN_EVENT;
}
