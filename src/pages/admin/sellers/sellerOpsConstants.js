/** @typedef {{ value: string; label: string }} Option */

/** Exibir botão fallback "Abrir" na fila — desligar localmente antes da remoção definitiva (S_5.1.2). */
export const SHOW_SELLER_OPEN_BUTTON = true;

export const SELLER_OPEN_BUTTON_TOOLTIP = "Abrir detalhes do seller";

/** @type {Option[]} */
export const SELLER_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "sem integração", label: "Sem integração" },
];

/** @type {Option[]} */
export const SELLER_INTEGRATION_OPTIONS = [
  { value: "ativa", label: "Integração ativa" },
  { value: "atencao", label: "Integração com atenção" },
  { value: "sem_integracao", label: "Sem integração" },
];

/** @type {Option[]} */
export const SELLER_BILLING_OPTIONS = [
  { value: "trial", label: "Trial / pendente" },
  { value: "grace", label: "Grace period" },
  { value: "past_due", label: "Inadimplente" },
  { value: "active", label: "Assinatura ativa" },
];

/** @type {Option[]} */
export const SELLER_HEALTH_OPTIONS = [
  { value: "saudavel", label: "Saudável" },
  { value: "atencao", label: "Atenção" },
  { value: "critico", label: "Crítico" },
];

/** @type {Record<string, string>} */
export const MARKETPLACE_LABELS = {
  mercado_livre: "Mercado Livre",
  amazon: "Amazon",
  shopee: "Shopee",
};

/**
 * @param {string | null | undefined} value
 * @param {Option[]} options
 */
export function sellerLabel(value, options) {
  const hit = options.find((o) => o.value === value);
  return hit?.label ?? value ?? "—";
}

/**
 * @param {string | null | undefined} mp
 */
export function marketplaceLabel(mp) {
  if (!mp) return "—";
  return MARKETPLACE_LABELS[mp] ?? mp.replace(/_/g, " ");
}
