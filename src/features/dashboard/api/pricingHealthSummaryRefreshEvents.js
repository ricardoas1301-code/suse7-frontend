// ======================================================================
// Evento — invalidação da Central de Saúde da Precificação (pós-save de custos).
// ======================================================================

export const PRICING_HEALTH_SUMMARY_REFRESH_EVENT = "suse7:pricing-health-summary:refresh";

/** @param {Record<string, unknown>} [detail] */
export function notifyPricingHealthSummaryRefresh(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PRICING_HEALTH_SUMMARY_REFRESH_EVENT, {
      detail: { reason: "product_costs_saved", ...detail },
    }),
  );
}
