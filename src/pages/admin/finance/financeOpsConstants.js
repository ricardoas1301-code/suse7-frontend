/** @typedef {{ value: string; label: string }} Option */

export const PAYMENT_STATUS_OPTIONS = [
  { value: "paid", label: "Aprovado" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Falhou" },
  { value: "overdue", label: "Vencido" },
  { value: "refunded", label: "Estornado" },
];

export const BILLING_FLAG_OPTIONS = [
  { value: "grace", label: "Grace" },
  { value: "past_due", label: "Inadimplente" },
  { value: "trial", label: "Trial" },
];

export const FINANCIAL_HEALTH_OPTIONS = [
  { value: "saudavel", label: "Saudável" },
  { value: "atencao", label: "Atenção" },
  { value: "risco_churn", label: "Risco churn" },
  { value: "inadimplente", label: "Inadimplente" },
  { value: "trial_expirando", label: "Trial expirando" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "Cartão", label: "Cartão" },
  { value: "Pix", label: "Pix" },
  { value: "Boleto", label: "Boleto" },
];

export const RENEWAL_FILTER_OPTIONS = [{ value: "upcoming", label: "Renovação em 7 dias" }];

export function financeLabel(value, options) {
  const hit = options.find((o) => o.value === value);
  return hit?.label ?? value ?? "—";
}

export function paymentStatusLabel(status) {
  return financeLabel(status, PAYMENT_STATUS_OPTIONS);
}
