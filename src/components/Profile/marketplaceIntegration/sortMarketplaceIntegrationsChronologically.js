/**
 * Ordenação cronológica de integrações marketplace (multi-marketplace).
 */

/**
 * @param {unknown} integration
 * @returns {number | null}
 */
export function resolveMarketplaceIntegrationConnectionCreatedAt(integration) {
  const candidates = [
    integration?.connected_at,
    integration?.created_at,
    integration?.connection_created_at,
  ];

  for (const candidate of candidates) {
    if (candidate == null || String(candidate).trim() === "") continue;
    const parsed = Date.parse(String(candidate));
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

/**
 * @param {Array<{ id?: string; is_primary?: boolean }>} companies
 * @param {unknown} sellerCompanyId
 * @returns {boolean}
 */
export function resolveIsPrimaryCompanyIntegration(integration, companies) {
  const sellerCompanyId =
    integration?.seller_company_id != null ? String(integration.seller_company_id).trim() : "";
  if (!sellerCompanyId) return false;

  const companyList = Array.isArray(companies) ? companies : [];
  const company = companyList.find((item) => String(item?.id ?? "").trim() === sellerCompanyId);
  return company?.is_primary === true;
}

/**
 * @param {unknown} integration
 * @returns {string}
 */
function resolveIntegrationStableId(integration) {
  if (integration?.id != null && String(integration.id).trim() !== "") {
    return String(integration.id).trim();
  }
  if (integration?.marketplace_account_id != null && String(integration.marketplace_account_id).trim() !== "") {
    return String(integration.marketplace_account_id).trim();
  }
  return "";
}

/**
 * Fallback quando o payload não expõe created_at: a API lista marketplace_accounts
 * com ORDER BY created_at DESC — inverter a ordem relativa equivale a ASC cronológico.
 * @param {number} index
 * @param {number} total
 * @returns {number}
 */
function resolveApiOrderFallbackRank(index, total) {
  return total - 1 - index;
}

/**
 * @param {{
 *   integrations: Array<Record<string, unknown>>;
 *   companies?: Array<{ id?: string; is_primary?: boolean }>;
 * }} params
 * @returns {Array<Record<string, unknown>>}
 */
export function sortMarketplaceIntegrationsChronologically({ integrations, companies = [] }) {
  const source = Array.isArray(integrations) ? integrations : [];
  const total = source.length;

  const decorated = source.map((item, index) => ({
    item,
    index,
    isPrimary: resolveIsPrimaryCompanyIntegration(item, companies),
    connectionMs: resolveMarketplaceIntegrationConnectionCreatedAt(item),
    stableId: resolveIntegrationStableId(item),
    fallbackRank: resolveApiOrderFallbackRank(index, total),
  }));

  decorated.sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;

    const leftHasTimestamp = left.connectionMs != null;
    const rightHasTimestamp = right.connectionMs != null;
    if (leftHasTimestamp !== rightHasTimestamp) return leftHasTimestamp ? -1 : 1;

    if (leftHasTimestamp && rightHasTimestamp && left.connectionMs !== right.connectionMs) {
      return left.connectionMs - right.connectionMs;
    }

    if (!leftHasTimestamp && !rightHasTimestamp && left.fallbackRank !== right.fallbackRank) {
      return left.fallbackRank - right.fallbackRank;
    }

    if (left.stableId !== right.stableId) {
      return left.stableId.localeCompare(right.stableId);
    }

    return left.index - right.index;
  });

  return decorated.map((entry) => entry.item);
}
