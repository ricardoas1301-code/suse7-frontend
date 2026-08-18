// ======================================================================
// Máscara de documento fiscal para pré-confirmação OAuth (privacidade).
// ======================================================================

/**
 * @param {string | null | undefined} raw
 */
export function mascararDocumentoFiscalBr(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.***.***/****-${digits.slice(12, 14)}`;
  }
  if (digits.length === 11) {
    return `***.***.***-${digits.slice(9, 11)}`;
  }
  if (digits.length >= 4) {
    return `***${digits.slice(-4)}`;
  }
  return "—";
}

/**
 * @param {Record<string, unknown> | null | undefined} company
 */
export function resolverNomeEmpresaPreConfirmacao(company) {
  if (!company || typeof company !== "object") return "Empresa";
  const trade = company.trade_name != null ? String(company.trade_name).trim() : "";
  const legal = company.company_name != null ? String(company.company_name).trim() : "";
  return trade || legal || "Empresa";
}
