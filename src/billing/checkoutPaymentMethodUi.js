/** @typedef {"PIX" | "BOLETO" | "CREDIT_CARD"} CheckoutPaymentMethodId */

/**
 * Catálogo visual dos métodos aceitos no checkout de planos (Asaas).
 * @type {Array<{
 *   id: CheckoutPaymentMethodId;
 *   label: string;
 *   description: string;
 *   enabled: boolean;
 *   badge?: string;
 * }>}
 */
export const CHECKOUT_PAYMENT_METHOD_OPTIONS = [
  {
    id: "PIX",
    label: "Pix",
    description: "Aprovação rápida via QR Code",
    enabled: true,
  },
  {
    id: "CREDIT_CARD",
    label: "Cartão de crédito",
    description: "Crédito recorrente mensal",
    enabled: true,
  },
  {
    id: "BOLETO",
    label: "Boleto",
    description: "Compensação em até 3 dias úteis",
    enabled: true,
  },
];

/**
 * @param {unknown} value
 * @returns {CheckoutPaymentMethodId}
 */
export function normalizeCheckoutPaymentMethod(value) {
  const raw = String(value || "PIX").toUpperCase();
  if (raw === "BOLETO" || raw === "CREDIT_CARD") return raw;
  return "PIX";
}
