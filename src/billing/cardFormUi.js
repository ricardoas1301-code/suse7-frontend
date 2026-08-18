// ======================================================================
// Cartão — máscaras e validação básica (sem persistir PAN/CVV)
// ======================================================================

export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCardNumber(value) {
  const d = digitsOnly(value).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatCardExpiry(value) {
  const d = digitsOnly(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function formatCep(value) {
  const d = digitsOnly(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatCpfCnpj(value) {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPhoneBr(value) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").trim();
  }
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3").trim();
}

/**
 * @param {string} expiryMmYy — MM/AA ou MMAA
 */
export function splitCardExpiry(expiryMmYy) {
  const d = digitsOnly(expiryMmYy);
  return {
    expiry_month: d.slice(0, 2),
    expiry_year: d.length >= 4 ? d.slice(2, 4) : "",
  };
}

/**
 * @param {{
 *   holder_name?: string;
 *   card_number?: string;
 *   expiry?: string;
 *   cvv?: string;
 *   cpf_cnpj?: string;
 *   postal_code?: string;
 *   phone?: string;
 * }} fields
 */
const REQUIRED_FIELD_MESSAGE = "Campo obrigatório";

export function validateCardFormFields(fields) {
  const errors = {};
  if (!String(fields.holder_name || "").trim()) errors.holder_name = REQUIRED_FIELD_MESSAGE;
  const number = digitsOnly(fields.card_number);
  if (!number) errors.card_number = REQUIRED_FIELD_MESSAGE;
  else if (number.length < 13) errors.card_number = "Número do cartão inválido.";
  const { expiry_month, expiry_year } = splitCardExpiry(fields.expiry || "");
  if (!digitsOnly(fields.expiry || "")) errors.expiry = REQUIRED_FIELD_MESSAGE;
  else if (expiry_month.length !== 2 || expiry_year.length !== 2) errors.expiry = "Validade inválida (MM/AA).";
  const cvv = digitsOnly(fields.cvv);
  if (!cvv) errors.cvv = REQUIRED_FIELD_MESSAGE;
  else if (cvv.length < 3) errors.cvv = "CVV inválido.";
  const tax = digitsOnly(fields.cpf_cnpj);
  if (!tax) errors.cpf_cnpj = REQUIRED_FIELD_MESSAGE;
  else if (tax.length !== 11 && tax.length !== 14) errors.cpf_cnpj = "CPF ou CNPJ inválido.";
  return { errors, expiry_month, expiry_year, number, cvv, tax };
}

/**
 * @param {Record<string, unknown>} form
 */
export function buildCardApiPayload(form) {
  const validation = validateCardFormFields(form);
  if (Object.keys(validation.errors).length > 0) {
    return { ok: false, errors: validation.errors };
  }
  return {
    ok: true,
    payload: {
      holder_name: String(form.holder_name).trim(),
      card_number: validation.number,
      expiry_month: validation.expiry_month,
      expiry_year: validation.expiry_year,
      cvv: validation.cvv,
      cpf_cnpj: validation.tax,
      card_type: "credit",
      set_default: Boolean(form.set_default),
      persist: form.save_card !== false,
    },
  };
}
