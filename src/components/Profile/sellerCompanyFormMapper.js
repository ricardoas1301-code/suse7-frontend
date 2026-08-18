import Decimal from "decimal.js";

/**
 * Formata percentual vindo da API para input pt-BR (Decimal.js — sem float binário).
 * @param {unknown} raw
 * @returns {string}
 */
export function formatSellerCompanyPercentInputFromApi(raw) {
  if (raw == null || String(raw).trim() === "") return "";
  try {
    const d = new Decimal(String(raw).replace(",", ".").trim());
    if (!d.isFinite() || d.lt(0) || d.gt(100)) return "";
    return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2).replace(".", ",");
  } catch {
    return "";
  }
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function digitsOnlySellerCompanyCep(raw) {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 8);
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function formatSellerCompanyCepInputFromApi(raw) {
  const digits = digitsOnlySellerCompanyCep(raw);
  if (digits.length <= 5) return digits;
  return digits.replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function normalizeSellerCompanyCepForPatch(raw) {
  const digits = digitsOnlySellerCompanyCep(raw);
  if (digits === "") return null;
  return digits.length === 8 ? digits : null;
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true } | { ok: false; message: string }}
 */
export function validateSellerCompanyCepInput(raw) {
  const digits = digitsOnlySellerCompanyCep(raw);
  if (digits === "") return { ok: true };
  if (digits.length !== 8) {
    return { ok: false, message: "CEP inválido. Informe 8 dígitos." };
  }
  return { ok: true };
}

/**
 * @param {Record<string, unknown>} company
 * @param {{ accountEmail?: string }} [options]
 */
export function mapSellerCompanyApiToForm(company, options = {}) {
  const isPrimary = Boolean(company?.is_primary);
  const accountEmail = String(options.accountEmail ?? "").trim();

  return {
    company_name: company?.company_name ?? "",
    trade_name: company?.trade_name ?? "",
    document_cnpj: company?.document_cnpj != null ? String(company.document_cnpj).replace(/\D/g, "") : "",
    tax_regime: company?.tax_regime ?? "",
    default_tax_rate: formatSellerCompanyPercentInputFromApi(company?.default_tax_rate),
    operational_cost_rate: formatSellerCompanyPercentInputFromApi(company?.operational_cost_rate),
    internal_notes: company?.internal_notes ?? "",
    phone: company?.phone ?? "",
    whatsapp: company?.whatsapp ?? "",
    cep: formatSellerCompanyCepInputFromApi(company?.cep),
    address_street: company?.address_street ?? "",
    address_number: company?.address_number ?? "",
    address_complement: company?.address_complement ?? "",
    address_district: company?.address_district ?? "",
    address_city: company?.address_city ?? "",
    address_state: company?.address_state ?? "",
    logo_url: company?.logo_url ?? "",
    contact_email: isPrimary ? accountEmail || company?.contact_email || "" : company?.contact_email ?? "",
    is_primary: isPrimary,
  };
}

/**
 * Normaliza e-mail de contato para comparação/persistência.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeSellerCompanyContactEmailForPatch(value) {
  const email = String(value ?? "").trim().toLowerCase();
  return email === "" ? null : email;
}

/**
 * @param {Record<string, unknown>} form
 * @param {{
 *   isPrimary?: boolean;
 *   baselineContactEmail?: string | null;
 *   baselineCep?: string | null;
 * }} [options]
 */
export function buildSellerCompanyEditPatchBody(form, options = {}) {
  const digitsPhone = (s) => (s != null ? String(s).replace(/\D/g, "") : "");
  const trimOrNull = (v) => {
    const t = String(v ?? "").trim();
    return t === "" ? null : t;
  };

  /** @type {Record<string, unknown>} */
  const body = {
    company_name: String(form.company_name ?? "").trim(),
    trade_name: trimOrNull(form.trade_name),
    default_tax_rate: trimOrNull(form.default_tax_rate),
    operational_cost_rate: trimOrNull(form.operational_cost_rate),
    phone: digitsPhone(form.phone) || null,
    whatsapp: digitsPhone(form.whatsapp) || null,
    address_street: trimOrNull(form.address_street),
    address_number: trimOrNull(form.address_number),
    address_complement: trimOrNull(form.address_complement),
    address_district: trimOrNull(form.address_district),
    address_city: trimOrNull(form.address_city),
    address_state: trimOrNull(form.address_state),
    logo_url: trimOrNull(form.logo_url),
  };

  const nextCep = normalizeSellerCompanyCepForPatch(form.cep);
  const baselineCep = normalizeSellerCompanyCepForPatch(options.baselineCep);
  if (nextCep !== baselineCep) {
    body.cep = nextCep;
  }

  if (!options.isPrimary) {
    const nextEmail = normalizeSellerCompanyContactEmailForPatch(form.contact_email);
    const baselineEmail = normalizeSellerCompanyContactEmailForPatch(options.baselineContactEmail);
    if (nextEmail !== baselineEmail) {
      body.contact_email = nextEmail;
    }
  }

  return body;
}

/**
 * Ordem canônica de validação — Nova empresa (UX).
 * Não confundir com ordem visual do DOM (duas colunas).
 */
export const SELLER_COMPANY_CREATE_REQUIRED_FIELD_ORDER = [
  "company_name",
  "trade_name",
  "document_cnpj",
  "default_tax_rate",
  "contact_email",
  "whatsapp",
  "cep",
  "address_number",
];

/** @param {unknown} value */
function isSellerCompanyContactEmailFormatValid(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (email === "") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @param {typeof SELLER_COMPANY_CREATE_REQUIRED_FIELD_ORDER[number]} field
 * @param {Record<string, unknown>} form
 * @returns {{ message: string } | null}
 */
function validateSellerCompanyCreateRequiredField(field, form) {
  switch (field) {
    case "company_name":
      if (!String(form.company_name ?? "").trim()) {
        return { message: "Informe a razão social." };
      }
      return null;
    case "trade_name":
      if (!String(form.trade_name ?? "").trim()) {
        return { message: "Informe o nome fantasia." };
      }
      return null;
    case "document_cnpj": {
      const doc = String(form.document_cnpj ?? "").replace(/\D/g, "");
      if (doc.length !== 14) {
        return { message: "Informe um CNPJ válido." };
      }
      return null;
    }
    case "default_tax_rate":
      if (!String(form.default_tax_rate ?? "").trim()) {
        return { message: "Informe a alíquota de imposto (%)." };
      }
      return null;
    case "contact_email":
      if (!String(form.contact_email ?? "").trim()) {
        return { message: "Informe o e-mail da empresa." };
      }
      if (!isSellerCompanyContactEmailFormatValid(form.contact_email)) {
        return { message: "Informe um e-mail de contato válido para a empresa." };
      }
      return null;
    case "whatsapp":
      if (!String(form.whatsapp ?? "").replace(/\D/g, "")) {
        return { message: "Informe o WhatsApp." };
      }
      return null;
    case "cep": {
      const cepDigits = digitsOnlySellerCompanyCep(form.cep);
      if (cepDigits.length !== 8) {
        return { message: "Informe um CEP válido." };
      }
      return null;
    }
    case "address_number":
      if (!String(form.address_number ?? "").trim()) {
        return { message: "Informe o número do endereço." };
      }
      return null;
    default:
      return null;
  }
}

/**
 * @param {Record<string, unknown>} form
 * @returns {{ ok: true } | { ok: false; message: string; field: string }}
 */
export function validateSellerCompanyCreateForm(form) {
  for (const field of SELLER_COMPANY_CREATE_REQUIRED_FIELD_ORDER) {
    const failure = validateSellerCompanyCreateRequiredField(field, form);
    if (failure) {
      return { ok: false, message: failure.message, field };
    }
  }

  return { ok: true };
}

/**
 * @param {Record<string, unknown>} form
 * @returns {Record<string, unknown>}
 */
export function buildSellerCompanyCreateBody(form) {
  const digitsPhone = (s) => (s != null ? String(s).replace(/\D/g, "") : "");
  const trimOrNull = (v) => {
    const t = String(v ?? "").trim();
    return t === "" ? null : t;
  };
  const normalizedEmail = normalizeSellerCompanyContactEmailForPatch(form.contact_email);
  const normalizedCep = normalizeSellerCompanyCepForPatch(form.cep);

  return {
    company_name: String(form.company_name ?? "").trim(),
    trade_name: trimOrNull(form.trade_name),
    document_cnpj: String(form.document_cnpj ?? "").replace(/\D/g, ""),
    default_tax_rate: trimOrNull(form.default_tax_rate),
    operational_cost_rate: trimOrNull(form.operational_cost_rate),
    contact_email: normalizedEmail,
    cep: normalizedCep,
    phone: digitsPhone(form.phone) || null,
    whatsapp: digitsPhone(form.whatsapp) || null,
    address_street: trimOrNull(form.address_street),
    address_number: trimOrNull(form.address_number),
    address_complement: trimOrNull(form.address_complement),
    address_district: trimOrNull(form.address_district),
    address_city: trimOrNull(form.address_city),
    address_state: trimOrNull(form.address_state),
    logo_url: trimOrNull(form.logo_url),
  };
}
