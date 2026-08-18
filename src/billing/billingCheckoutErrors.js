// ======================================================================
// Mensagens de erro de checkout billing (cartão)
// ======================================================================

export const INVALID_CARD_HOLDER_POSTAL_CODE_MESSAGE =
  "CEP do titular do cartão inválido. Atualize o endereço de cobrança antes de pagar com cartão.";

export const DEBIT_CARD_NOT_SUPPORTED_MESSAGE =
  "Cartão de débito não está disponível neste checkout. Use Pix, boleto ou cartão de crédito.";

export const PAYMENT_METHOD_ALREADY_EXISTS_MESSAGE =
  "Não foi possível cadastrar este cartão, pois ele já está registrado como forma de pagamento nesta conta. Utilize um cartão diferente ou mantenha o método já cadastrado.";

export const CARD_VALIDATION_LOCAL_MESSAGE = "Confira os campos destacados.";

export const CARD_TOKENIZATION_FAILED_MESSAGE =
  "Não foi possível validar os dados do cartão. Confira as informações e tente novamente.";

export const CARD_COMMUNICATION_ERROR_MESSAGE =
  "Não foi possível cadastrar o cartão agora. Tente novamente em instantes.";

/**
 * @param {{ ok?: boolean; error?: string; status?: number; data?: Record<string, unknown> } | null | undefined} res
 */
function resolveBillingDomainCode(res) {
  if (!res) return "";
  const data = res.data;
  if (!data || typeof data !== "object") return "";
  const code = data.code;
  return typeof code === "string" && code.trim() !== "" ? code.trim().toLowerCase() : "";
}

/**
 * @param {{ ok?: boolean; error?: string; status?: number; data?: Record<string, unknown> } | null | undefined} res
 * @param {string} [fallback]
 */
export function resolveBillingCardErrorMessage(
  res,
  fallback = "Pagamento não aprovado. Confira os dados do cartão ou tente outro método."
) {
  if (!res || res.ok) return null;

  const code = resolveBillingDomainCode(res);

  if (code === "payment_method_already_exists" || res.status === 409) {
    return PAYMENT_METHOD_ALREADY_EXISTS_MESSAGE;
  }
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
  if (
    code === "card_token_unavailable" ||
    code === "card_checkout_failed" ||
    code === "card_validation_error" ||
    code === "card_payload_required" ||
    code === "card_payload_invalid"
  ) {
    return CARD_TOKENIZATION_FAILED_MESSAGE;
  }
  if (
    res.status === 0 ||
    res.connectionError ||
    code === "asaas_error" ||
    code === "checkout_failed" ||
    code === "billing_config"
  ) {
    return CARD_COMMUNICATION_ERROR_MESSAGE;
  }

  const gatewayCode = String(res.data?.gateway_error_code ?? "");
  const gatewayMessage = String(res.data?.gateway_error_message ?? "").toLowerCase();
  if (gatewayCode === "invalid_holderInfo" && gatewayMessage.includes("cep")) {
    return INVALID_CARD_HOLDER_POSTAL_CODE_MESSAGE;
  }

  if (typeof res.data?.message === "string" && res.data.message.trim() !== "") {
    const message = res.data.message.trim();
    if (/gateway|asaas|token|fingerprint|stack/i.test(message)) {
      return CARD_TOKENIZATION_FAILED_MESSAGE;
    }
    return message;
  }

  return res.error || fallback;
}
