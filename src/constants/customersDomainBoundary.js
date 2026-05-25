// =============================================================================
// Fronteira de domínio — Clientes Admin Global × Seller (S_4.6.4 — fundação estável)
//
// INVENTÁRIO — DOMÍNIO ADMIN GLOBAL [ATIVO]
//   Endpoints:
//     GET /api/dev-center/customers-global      → customers[] + summary (admin_global)
//     GET /api/dev-center/customers-global/:id  → customer + overview + activity + quality + ingestion + metadata
//       quality/ingestion por cliente: not_available (S_4.7.1)
//   Frontend:
//     DevCenterCustomersGlobal.jsx, devCenterApi.js (getCustomersGlobal*)
//     OpsStatsGrid, OpsFiltersBar (scope=global), OpsDrawerShell, OpsTimeline,
//     OpsHealthBadge, OpsConfidenceBadge, OpsEmptyState, opsPresentation.js
//   Backend:
//     devCenterAdminRoutes.js, devCenterCustomersGlobalOpsSummaryService.js
//   Responsabilidades: listagem cross-seller, summary agregado, LGPD
//
// INVENTÁRIO — DOMÍNIO SELLER [ATIVO]
//   Endpoints:
//     GET  /api/customers
//     GET  /api/customers/:id
//     POST /api/customers/ingest-from-sales
//   Frontend: Clientes360.jsx (buildApiUrl + apiFetch direto)
//   Backend: handlers/customers/*, customerIngestionHealthService, customerDataQualityService
//   Responsabilidades: operação seller escopada por JWT
//
// REMOVIDO (S_4.6.1): customersApi.js, fetchCustomersList, OpsIssueList, fallback seller no Dev Center
// LEGADO: OpsFiltersBar scope=seller — kit compartilhado para Clientes360 futuro (não usado ainda)
//
// Regra: Dev Center Global NUNCA consome contrato seller. Clientes360 NUNCA consome admin global.
// Governança LGPD: constants/customersGlobalLgpdGovernance.js (S_4.8.1)
// Governança cross-seller: constants/customersGlobalCrossSellerGovernance.js (S_4.8.2)
// Governança permissões: constants/customersGlobalPermissionsGovernance.js (S_4.8.3)
// Hardening: constants/customersGlobalHardeningGovernance.js (S_4.8.4)
// Smoke permanente: npm run smoke:dev-center-customers-boundary (backend)
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

/** Referência única para auditorias de fronteira e guardrails. */
export const CUSTOMERS_DOMAIN_BOUNDARY = Object.freeze({
  adminGlobal: CUSTOMERS_DOMAIN_ADMIN_GLOBAL,
  seller: CUSTOMERS_DOMAIN_SELLER,
});
