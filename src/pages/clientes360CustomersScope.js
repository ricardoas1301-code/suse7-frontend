// =============================================================================
// Clientes360 — escopo seller (S_4.6.2)
//
// Reexporta fronteira oficial seller. NÃO consumir /api/dev-center/customers-global.
// =============================================================================

import { CUSTOMERS_DOMAIN_SELLER } from "../constants/customersDomainBoundary.js";

export const CLIENTES360_CUSTOMERS_SCOPE = {
  officialApis: CUSTOMERS_DOMAIN_SELLER.officialApis,
  outOfScopeApis: [...CUSTOMERS_DOMAIN_SELLER.forbiddenApis],
  forbiddenAdminApis: [...CUSTOMERS_DOMAIN_SELLER.forbiddenApis],
  summaryScope: CUSTOMERS_DOMAIN_SELLER.summaryScope,
  scopeNote: CUSTOMERS_DOMAIN_SELLER.scopeNote,
};
