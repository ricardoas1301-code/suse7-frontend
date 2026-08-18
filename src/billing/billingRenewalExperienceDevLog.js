// ======================================================================
// Diagnóstico DEV seguro — hidratação da renovação (S1.HF.6.4)
// ======================================================================

/**
 * @param {string | null | undefined} value
 */
function maskId(value) {
  const raw = String(value || "").trim();
  if (raw.length <= 8) return raw ? "***" : null;
  return `${raw.slice(0, 4)}…${raw.slice(-4)}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} experience
 * @param {string} source
 */
export function logBillingRenewalUiStateResolved(experience, source) {
  if (!import.meta.env.DEV) return;

  console.info("[BILLING_RENEWAL_UI_STATE_RESOLVED]", {
    source,
    subscription_id: maskId(experience?.subscription_id),
    renewal_state: experience?.renewal_state ?? null,
    primary_action: experience?.primary_action ?? null,
    renewal_cycle_id_present: Boolean(experience?.renewal_cycle_id),
    renewal_cycle_id: maskId(experience?.renewal_cycle_id),
    amount: experience?.amount ?? null,
    due_state: experience?.due_state ?? null,
    due_date: experience?.due_date ?? null,
  });
}

/**
 * @param {string} reason
 * @param {Record<string, unknown>} [context]
 */
export function logBillingRenewalCheckoutBlocked(reason, context = {}) {
  if (!import.meta.env.DEV) return;
  console.warn("[BILLING_RENEWAL_CHECKOUT_BLOCKED]", {
    reason,
    ...context,
  });
}
