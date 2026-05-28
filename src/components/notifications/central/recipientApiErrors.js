// Mensagens seller-friendly para erros da API de destinatários

/**
 * @param {{ error?: string, message?: string, duplicated_field?: string, field?: string } | null | undefined} payload
 * @param {{ label?: string, email?: string, whatsapp?: string }} [fieldErrors]
 */
export function mapRecipientApiError(payload, fieldErrors = {}) {
  if (payload?.error === "DUPLICATE_RECIPIENT") {
    const field = payload.duplicated_field ?? inferDuplicateField(payload.message);
    if (field === "email") return { message: "E-mail já cadastrado em outro destinatário.", field: "email" };
    if (field === "whatsapp") {
      return { message: "WhatsApp já cadastrado em outro destinatário.", field: "whatsapp" };
    }
  }

  if (payload?.field && fieldErrors[payload.field]) {
    return { message: fieldErrors[payload.field], field: payload.field };
  }

  return { message: payload?.message ?? "Não foi possível salvar o destinatário." };
}

/** @param {string | undefined} message */
function inferDuplicateField(message) {
  const m = String(message ?? "").toLowerCase();
  if (m.includes("e-mail") || m.includes("email")) return "email";
  if (m.includes("whatsapp")) return "whatsapp";
  return null;
}
