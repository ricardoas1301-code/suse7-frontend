import { formatSellerCompanyPercentInputFromApi } from "../../../components/Profile/sellerCompanyFormMapper.js";
import {
  normalizeSellerCompanyContactEmailForPatch,
} from "../../../components/Profile/sellerCompanyFormMapper.js";
import { isValidCnpjInput, normalizeCnpjDigits } from "../../../utils/cnpjValidation.js";
import {
  formatarPercentualDiretoFinal,
  percentualDiretoEstaVazio,
  percentualDiretoParaPayload,
} from "../../../utils/s7PercentDirectInput.js";

export { formatSellerCompanyPercentInputFromApi as formatConfigurationPercentInputFromApi };

/**
 * @param {unknown} raw
 * @returns {{ ok: true; normalized: string; field: string } | { ok: false; message: string; field: string }}
 */
export function validateConfigurationPercentInput(raw, options = {}) {
  const emptyMessage = options.emptyMessage ?? "Informe o percentual.";
  if (percentualDiretoEstaVazio(raw)) {
    return { ok: false, message: emptyMessage, field: "percent" };
  }

  const payload = percentualDiretoParaPayload(raw);
  if (!payload) {
    return {
      ok: false,
      message: "Percentual inválido. Use um valor entre 0 e 100.",
      field: "percent",
    };
  }

  return { ok: true, normalized: payload, field: "percent" };
}

/**
 * @param {Record<string, unknown>} company
 * @param {{ accountEmail?: string; profileTelefone?: string | null }} [options]
 */
export function mapConfigurationCompanyDataForm(company, options = {}) {
  const accountEmail = String(options.accountEmail ?? "").trim();
  const profilePhone = options.profileTelefone != null ? String(options.profileTelefone) : "";
  return {
    company_name: company?.company_name ?? "",
    trade_name: company?.trade_name ?? "",
    document_cnpj:
      company?.document_cnpj != null ? String(company.document_cnpj).replace(/\D/g, "") : "",
    contact_email: accountEmail || company?.contact_email || "",
    whatsapp: company?.whatsapp ?? "",
    phone: company?.phone ?? profilePhone ?? "",
    documentReadOnly: Boolean(String(company?.document_cnpj ?? "").replace(/\D/g, "").length === 14),
  };
}

/**
 * @param {Record<string, unknown>} form
 * @returns {{ ok: true } | { ok: false; message: string; field?: string }}
 */
export function validateConfigurationCompanyDataForm(form) {
  if (!String(form.company_name ?? "").trim()) {
    return { ok: false, field: "company_name", message: "Informe a razão social." };
  }
  if (!String(form.trade_name ?? "").trim()) {
    return { ok: false, field: "trade_name", message: "Informe o nome fantasia." };
  }
  const doc = normalizeCnpjDigits(String(form.document_cnpj ?? ""));
  if (doc.length !== 14 || !isValidCnpjInput(doc)) {
    return { ok: false, field: "document_cnpj", message: "Informe um CNPJ válido." };
  }
  const email = String(form.contact_email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, field: "contact_email", message: "Informe um e-mail válido." };
  }
  if (!String(form.whatsapp ?? "").replace(/\D/g, "")) {
    return { ok: false, field: "whatsapp", message: "Informe o WhatsApp." };
  }
  return { ok: true };
}

/**
 * @param {Record<string, unknown>} form
 */
export function buildConfigurationCompanyDataPatchBody(form) {
  const digits = (value) => String(value ?? "").replace(/\D/g, "");
  return {
    company_name: String(form.company_name ?? "").trim(),
    trade_name: String(form.trade_name ?? "").trim(),
    contact_email: normalizeSellerCompanyContactEmailForPatch(form.contact_email),
    whatsapp: digits(form.whatsapp) || null,
    phone: digits(form.phone) || null,
  };
}

/**
 * @param {unknown} raw
 */
export function buildConfigurationPercentPatchValue(raw) {
  return percentualDiretoParaPayload(raw);
}

/**
 * @param {{ closesAt?: string; workingDays?: number[] }} payload
 */
export function validateConfigurationOperationalCycleForm(payload) {
  const closesAt = String(payload?.closesAt ?? "").trim();
  if (!closesAt || !/^(\d{1,2}):(\d{2})/.test(closesAt)) {
    return {
      ok: false,
      field: "operational_close_time",
      message: "Informe o horário de encerramento operacional.",
    };
  }
  const workingDays = Array.isArray(payload?.workingDays) ? payload.workingDays : [];
  if (workingDays.length === 0) {
    return {
      ok: false,
      field: "operational_working_days",
      message: "Selecione ao menos um dia de operação.",
    };
  }
  return { ok: true };
}
