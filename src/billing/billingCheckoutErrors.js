// ======================================================================
// Mensagens de erro de checkout billing (cartão)
// ======================================================================

export const INVALID_CARD_HOLDER_POSTAL_CODE_MESSAGE =
  "CEP do titular do cartão inválido. Atualize o endereço de cobrança antes de pagar com cartão.";

export const DEBIT_CARD_NOT_SUPPORTED_MESSAGE =
  "Cartão de débito não está disponível neste checkout. Use Pix, boleto ou cartão de crédito.";

/**
 * @param {{ ok?: boolean; error?: string; data?: Record<string, unknown> } | null | undefined} res
 * @param {string} [fallback]
 */
export function resolveBillingCardErrorMessage(res, fallback = "Pagamento não aprovado. Confira os dados do cartão ou tente outro método.") {
  if (!res || res.ok) return null;

  const code = String(res.data?.code ?? "").toLowerCase();
  if (code === "debit_card_not_supported") {
    return DEBIT_CARD_NOT_SUPPORTED_MESSAGE;
  }
  if (
    code === "invalid_card_holder_postal_code" ||
    code === "invalid_card_holder_postal_code_required" ||
    code === "card_holder_postal_code_required"
  ) {
    return INVALID_CARD_HOLDER_POSTAL_CODE_MESSAGE;
  }

  const gatewayCode = String(res.data?.gateway_error_code ?? "");
  const gatewayMessage = String(res.data?.gateway_error_message ?? "").toLowerCase();
  if (gatewayCode === "invalid_holderInfo" && gatewayMessage.includes("cep")) {
    return INVALID_CARD_HOLDER_POSTAL_CODE_MESSAGE;
  }

  return typeof res.data?.message === "string" && res.data.message.trim() !== ""
    ? res.data.message
    : res.error || fallback;
}
