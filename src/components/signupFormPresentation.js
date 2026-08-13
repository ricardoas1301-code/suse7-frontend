/**
 * Apresentação de validação do SignUp — paridade com Nova empresa (toast + reportValidity).
 * Não altera critérios de validação; apenas foco e feedback visual nativo.
 */

/**
 * Ordem canônica dos obrigatórios no SignUp (validação sequencial + foco).
 * SSOT única — usada por apresentação, submit e testes.
 */
export const SIGNUP_VALIDATION_FIELD_ORDER = [
  "nome",
  "nome_loja",
  "cpf_cnpj",
  "email",
  "whatsapp",
  "senha",
  "senha2",
  "termos",
];

/**
 * Mensagens de obrigatoriedade vazia — paridade textual com Nova empresa onde aplicável.
 * SSOT única para toast, balão nativo e estado visual sequencial.
 * @type {Record<string, string>}
 */
export const SIGNUP_REQUIRED_FIELD_MESSAGES = {
  nome: "Informe a razão social.",
  nome_loja: "Informe o nome fantasia.",
  cpf_cnpj: "Informe o CPF/CNPJ.",
  email: "Informe o e-mail.",
  whatsapp: "Informe o WhatsApp.",
  senha: "Informe a senha.",
};

/**
 * @param {string} field
 * @returns {string}
 */
export function getSignupRequiredFieldMessage(field) {
  return SIGNUP_REQUIRED_FIELD_MESSAGES[field] ?? "Campo obrigatório";
}

/**
 * @param {Record<string, string>} errors
 * @returns {{ field: string; message: string } | null}
 */
export function getFirstSignupValidationError(errors) {
  if (!errors || typeof errors !== "object") return null;
  for (const field of SIGNUP_VALIDATION_FIELD_ORDER) {
    const message = errors[field];
    if (message) return { field, message };
  }
  return null;
}

/**
 * Apresentação sequencial: apenas o primeiro erro visível por tentativa de submit.
 * @param {Record<string, string>} allErrors
 * @returns {Record<string, string>}
 */
export function toSequentialSignupErrors(allErrors) {
  const first = getFirstSignupValidationError(allErrors);
  if (!first) return {};
  return { [first.field]: first.message };
}

/** @param {HTMLFormElement | null} formEl */
export function clearSignupFieldValidity(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll("input, textarea, select").forEach((el) => {
    if ("setCustomValidity" in el) {
      el.setCustomValidity("");
    }
  });
}

/**
 * @param {HTMLFormElement | null} formEl
 * @param {string | undefined} field
 */
export function clearSignupFieldValidityForField(formEl, field) {
  if (!formEl || !field || field === "termos") return;
  const el = formEl.querySelector(`[name="${field}"]`);
  if (el && "setCustomValidity" in el) {
    el.setCustomValidity("");
  }
}

/**
 * Toast lateral + balão nativo do browser (seta no campo), como Nova empresa.
 * @param {HTMLFormElement | null} formEl
 * @param {string | undefined} field
 * @param {string} message
 */
export function showSignupFieldValidation(formEl, field, message) {
  if (!field || !formEl || field === "termos") return;
  clearSignupFieldValidity(formEl);
  const el = formEl.querySelector(`[name="${field}"]`);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  el.focus();
  el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  el.setCustomValidity(message);
  el.reportValidity();
}
