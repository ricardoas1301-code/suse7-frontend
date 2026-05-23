// =============================================================================
// Clientes Globais 360 S7 — escopo Dev Center admin (S_4.6.2)
//
// Reexporta fronteira oficial admin. NÃO importar /api/customers neste domínio.
// =============================================================================

import { CUSTOMERS_DOMAIN_ADMIN_GLOBAL } from "../../constants/customersDomainBoundary.js";

export const DEV_CENTER_CUSTOMERS_GLOBAL_SCOPE = {
  officialApis: CUSTOMERS_DOMAIN_ADMIN_GLOBAL.officialApis,
  outOfScopeApis: [...CUSTOMERS_DOMAIN_ADMIN_GLOBAL.forbiddenApis],
  forbiddenSellerApis: [...CUSTOMERS_DOMAIN_ADMIN_GLOBAL.forbiddenApis],
  summaryScope: CUSTOMERS_DOMAIN_ADMIN_GLOBAL.summaryScope,
  scopeNote: CUSTOMERS_DOMAIN_ADMIN_GLOBAL.scopeNote,
};
