// ======================================================================
// Lookup O(1) empresa/CNPJ para tooltips de ranking (sem request por hover).
// ======================================================================

/**
 * @param {Record<string, unknown>[]} companies
 * @param {Record<string, unknown>[]} accounts
 */
export function buildRankingTooltipCompanyLookup(companies, accounts) {
  const validCompanies = Array.isArray(companies)
    ? companies.filter((c) => c?.id != null && String(c.id).trim() !== "")
    : [];
  const registeredCompanyCount = validCompanies.length;
  const showCompanyLogo = registeredCompanyCount >= 2;

  /** @type {Map<string, { id: string; name: string; logoUrl: string; initial: string }>} */
  const companyById = new Map();
  for (const c of validCompanies) {
    const id = String(c.id).trim();
    const name =
      c.trade_name != null && String(c.trade_name).trim() !== ""
        ? String(c.trade_name).trim()
        : c.company_name != null && String(c.company_name).trim() !== ""
          ? String(c.company_name).trim()
          : "Empresa";
    companyById.set(id, {
      id,
      name,
      logoUrl: c.logo_url != null && String(c.logo_url).trim() !== "" ? String(c.logo_url).trim() : "",
      initial: name.charAt(0).toUpperCase(),
    });
  }

  /** @type {Map<string, string>} */
  const sellerCompanyIdByAccountId = new Map();
  const accountList = Array.isArray(accounts) ? accounts : [];
  for (const a of accountList) {
    const accId = a?.id != null ? String(a.id).trim() : "";
    const scId = a?.seller_company_id != null ? String(a.seller_company_id).trim() : "";
    if (accId && scId) sellerCompanyIdByAccountId.set(accId, scId);
  }

  /**
   * @param {Record<string, unknown> | null | undefined} item
   */
  function resolveCompanyForRankingItem(item) {
    if (!showCompanyLogo || !item || typeof item !== "object") return null;

    const accountId =
      item.marketplace_account_id != null ? String(item.marketplace_account_id).trim() : "";
    let sellerCompanyId = accountId ? sellerCompanyIdByAccountId.get(accountId) ?? null : null;

    if (!sellerCompanyId && item.seller_company_id != null) {
      const direct = String(item.seller_company_id).trim();
      if (direct) sellerCompanyId = direct;
    }

    if (!sellerCompanyId) return null;
    return companyById.get(sellerCompanyId) ?? null;
  }

  return {
    registeredCompanyCount,
    showCompanyLogo,
    resolveCompanyForRankingItem,
  };
}
