/** @typedef {{ value: string; label: string }} Option */

/** @type {Option[]} */
export const BILLING_STATUS_OPTIONS = [
  { value: "active", label: "Ativa" },
  { value: "trialing", label: "Trial / pendente" },
  { value: "grace", label: "Grace period" },
  { value: "past_due", label: "Inadimplente" },
  { value: "canceled", label: "Cancelada" },
  { value: "paused", label: "Suspensa" },
];

/** @type {Option[]} */
export const BILLING_FLAG_OPTIONS = [
  { value: "grace", label: "Em grace" },
  { value: "past_due", label: "Past due" },
  { value: "trial", label: "Trial ativo" },
];

/** @type {Option[]} */
export const FINANCIAL_HEALTH_OPTIONS = [
  { value: "saudavel", label: "Saudável" },
  { value: "atencao", label: "Atenção" },
  { value: "risco_churn", label: "Risco churn" },
  { value: "inadimplente", label: "Inadimplente" },
  { value: "trial_expirando", label: "Trial expirando" },
];

/** @type {Option[]} */
export const RENEWAL_FILTER_OPTIONS = [{ value: "upcoming", label: "Renovação em 7 dias" }];

/**
 * @param {string | null | undefined} value
 * @param {Option[]} options
 */
export function subscriptionLabel(value, options) {
  const hit = options.find((o) => o.value === value);
  return hit?.label ?? value ?? "—";
}

/**
 * @param {string | null | undefined} status
 */
export function billingStatusLabel(status) {
  return subscriptionLabel(status, BILLING_STATUS_OPTIONS);
}
