// ======================================================================
// Preço exibido — catálogo vigente vs legado da assinatura
// ======================================================================

/**
 * @param {{
 *   renewalExperience?: Record<string, unknown> | null;
 *   catalogPlan?: Record<string, unknown> | null;
 *   resolvedPlan?: Record<string, unknown> | null;
 *   subscription?: Record<string, unknown> | null;
 * }} input
 */
export function resolveSubscriptionDisplayPriceMonthly(input) {
  const { renewalExperience, catalogPlan, resolvedPlan, subscription } = input;
  if (renewalExperience?.amount != null && renewalExperience.amount !== "") {
    return renewalExperience.amount;
  }
  if (resolvedPlan?.price_monthly != null) return resolvedPlan.price_monthly;
  if (catalogPlan?.price_monthly != null) return catalogPlan.price_monthly;
  return subscription?.amount ?? null;
}

/**
 * @param {Record<string, unknown> | null | undefined} payment
 */
export function resolveHistoricalPaymentAmount(payment) {
  if (!payment) return null;
  if (payment.amount_cents != null) return Number(payment.amount_cents) / 100;
  return payment.amount ?? null;
}
