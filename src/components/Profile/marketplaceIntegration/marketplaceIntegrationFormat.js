/**
 * Formatação e resolução de documentos — integrações marketplace (SSOT empresa).
 */

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
export function formatMarketplaceCompanyCnpj(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length !== 14) return null;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/**
 * Resolve CNPJ formatado pela empresa vinculada (seller_company_id canônico).
 * @param {Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>} companiesById
 * @param {unknown} sellerCompanyId
 * @returns {string}
 */
export function resolveLinkedCompanyDocumentFormatted(companiesById, sellerCompanyId) {
  const scId = sellerCompanyId != null ? String(sellerCompanyId).trim() : "";
  if (!scId) return "—";

  const co =
    companiesById instanceof Map
      ? companiesById.get(scId)
      : companiesById?.[scId] ?? null;
  if (!co) return "—";

  const formatted = formatMarketplaceCompanyCnpj(co.document_cnpj ?? co.document);
  if (formatted) return formatted;
  if (co.document_masked && String(co.document_masked).trim()) {
    return String(co.document_masked).trim();
  }
  return "—";
}

/**
 * @param {Array<{ id?: string | null }>} companies
 * @returns {Map<string, Record<string, unknown>>}
 */
export function buildSellerCompaniesById(companies) {
  const map = new Map();
  if (!Array.isArray(companies)) return map;
  for (const co of companies) {
    const id = co?.id != null ? String(co.id).trim() : "";
    if (id) map.set(id, co);
  }
  return map;
}

/**
 * @param {Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>} companiesById
 * @param {unknown} sellerCompanyId
 * @param {string} [fallbackName]
 */
export function resolveLinkedCompanyPresentation(companiesById, sellerCompanyId, fallbackName = "Empresa") {
  const scId = sellerCompanyId != null ? String(sellerCompanyId).trim() : "";
  const co =
    scId && companiesById instanceof Map
      ? companiesById.get(scId)
      : scId
        ? companiesById?.[scId] ?? null
        : null;

  const name =
    (co?.trade_name && String(co.trade_name).trim()) ||
    (co?.company_name && String(co.company_name).trim()) ||
    String(fallbackName || "Empresa").trim() ||
    "Empresa";
  const letter = name.charAt(0).toUpperCase() || "E";
  const logoUrl = co?.logo_url != null ? String(co.logo_url).trim() : "";

  return {
    id: scId || null,
    name,
    avatarUrl: logoUrl || null,
    avatarAlt: `Logo da empresa ${name}`,
    avatarInitial: letter,
  };
}
