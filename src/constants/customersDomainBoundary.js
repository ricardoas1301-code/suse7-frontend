// =============================================================================
// Fronteira de domínio — Clientes Admin Global × Seller (S_4.6.2)
//
// Regra oficial:
//   Dev Center Global → somente adminGlobal.officialApis
//   Clientes360 seller → somente seller.officialApis
//
// Não cruzar contratos entre domínios.
// =============================================================================

/** @typedef {{ list: string; detail: string; ingest?: string }} CustomersOfficialApis */

/** @type {Readonly<{
 *   label: string;
 *   consumer: string;
 *   officialApis: CustomersOfficialApis;
 *   forbiddenApis: readonly string[];
 *   summaryScope: string;
 *   scopeNote: string;
 * }>} */
export const CUSTOMERS_DOMAIN_ADMIN_GLOBAL = Object.freeze({
  label: "Dev Center — Clientes Globais",
  consumer: "src/pages/admin/DevCenterCustomersGlobal.jsx",
  officialApis: Object.freeze({
    list: "/api/dev-center/customers-global",
    detail: "/api/dev-center/customers-global/:id",
  }),
  forbiddenApis: Object.freeze(["/api/customers", "/api/customers/:id", "/api/customers/ingest-from-sales"]),
  summaryScope: "admin_global",
  scopeNote:
    "Contrato admin global (summary.scope = admin_global). Agregado cross-seller; LGPD preservada. Sem dependência do contrato seller.",
});

/** @type {Readonly<{
 *   label: string;
 *   consumer: string;
 *   officialApis: CustomersOfficialApis;
 *   forbiddenApis: readonly string[];
 *   summaryScope: string;
 *   scopeNote: string;
 * }>} */
export const CUSTOMERS_DOMAIN_SELLER = Object.freeze({
  label: "Clientes360",
  consumer: "src/pages/Clientes360.jsx",
  officialApis: Object.freeze({
    list: "/api/customers",
    detail: "/api/customers/:id",
    ingest: "/api/customers/ingest-from-sales",
  }),
  forbiddenApis: Object.freeze(["/api/dev-center/customers-global", "/api/dev-center/customers-global/:id"]),
  summaryScope: "seller",
  scopeNote:
    "Contrato seller escopado por JWT (user_id). Listagem e detalhe do seller autenticado. Não consumir contrato admin global.",
});

/** Guardrail compartilhado — referência única para auditorias de fronteira. */
export const CUSTOMERS_DOMAIN_BOUNDARY = Object.freeze({
  adminGlobal: CUSTOMERS_DOMAIN_ADMIN_GLOBAL,
  seller: CUSTOMERS_DOMAIN_SELLER,
});
