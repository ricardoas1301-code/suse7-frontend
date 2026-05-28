// ======================================================================
// Contato destinatário — validação e máscara WhatsApp (Fase 3.2.2)
// ======================================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const RECIPIENT_FIELD_MESSAGES = {
  label: "Informe o nome do destinatário.",
  email: "Informe um e-mail válido.",
  whatsapp: "Informe um WhatsApp válido.",
};

/** @param {string} value */
export function formatWhatsAppBr(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return digits.replace(/(\d{2})(\d+)/, "($1) $2");
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

/** @param {string} raw */
export function normalizeWhatsAppDigits(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

/** @param {string} email */
export function validateRecipientEmail(email, { required = true } = {}) {
  const v = String(email ?? "").trim();
  if (!v) {
    return required ? { ok: false, message: RECIPIENT_FIELD_MESSAGES.email } : { ok: true, empty: true };
  }
  if (!EMAIL_RE.test(v)) {
    return { ok: false, message: RECIPIENT_FIELD_MESSAGES.email };
  }
  return { ok: true, value: v.toLowerCase() };
}

/** @param {string} whatsapp */
export function validateRecipientWhatsApp(whatsapp, { required = true } = {}) {
  const digits = normalizeWhatsAppDigits(whatsapp);
  if (!digits) {
    return required ? { ok: false, message: RECIPIENT_FIELD_MESSAGES.whatsapp } : { ok: true, empty: true };
  }
  if (/[a-zA-Z]/.test(String(whatsapp ?? ""))) {
    return { ok: false, message: RECIPIENT_FIELD_MESSAGES.whatsapp };
  }
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, message: RECIPIENT_FIELD_MESSAGES.whatsapp };
  }
  return { ok: true, value: digits };
}

/**
 * @param {{ label?: string, email?: string, whatsapp?: string }} form
 */
export function validateRecipientForm(form) {
  const errors = {};

  if (!String(form.label ?? "").trim()) {
    errors.label = RECIPIENT_FIELD_MESSAGES.label;
  }

  const emailCheck = validateRecipientEmail(form.email ?? "", { required: true });
  if (!emailCheck.ok) errors.email = emailCheck.message ?? RECIPIENT_FIELD_MESSAGES.email;

  const waCheck = validateRecipientWhatsApp(form.whatsapp ?? "", { required: true });
  if (!waCheck.ok) errors.whatsapp = waCheck.message ?? RECIPIENT_FIELD_MESSAGES.whatsapp;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    label: String(form.label).trim(),
    email: emailCheck.value,
    whatsapp: waCheck.value,
  };
}

/** Impede letras e símbolos no campo WhatsApp. @param {string} next */
export function sanitizeWhatsAppInput(next) {
  return formatWhatsAppBr(next);
}
