// =============================================================================
// Dev Center Clientes Global — Baseline S_4.9.1 (manifesto liberável)
// Epic S_4.6 → S_4.8 fechado. Sem breaking change de contrato.
// =============================================================================

/** Checkpoints frontend (suse7-frontend) — ordem cronológica epic 4.6–4.8 */
export const CUSTOMERS_GLOBAL_BASELINE_CHECKPOINTS = Object.freeze([
  "0cf5a05 — S_4.6.4 boundary consolidado",
  "5db4ac7 — S_4.7.1 contrato detail",
  "83a00cc — S_4.7.2 ops agregado",
  "89d220a — S_4.7.3 cache stale",
  "4d89fdf — S_4.7.4 empty states",
  "24fdf76 — S_4.8.1 LGPD",
  "ff9d6ee — S_4.8.2 cross-seller",
  "d2a4dce — S_4.8.3 permissões",
  "82cc240 — S_4.8.4 hardening",
  "4A91 — S_4.9.1 build final (este manifesto)",
]);

/** @typedef {"ATIVO" | "LEGADO" | "REMOVIDO"} InventoryStatus */

/**
 * @typedef {Readonly<{ id: string; status: InventoryStatus; path: string; notes?: string }>}
 * InventoryEntry
 */

/** @type {readonly InventoryEntry[]} */
export const CUSTOMERS_GLOBAL_INVENTORY = Object.freeze([
  { id: "route-list", status: "ATIVO", path: "GET /api/dev-center/customers-global", notes: "customers[] + summary" },
  { id: "route-detail", status: "ATIVO", path: "GET /api/dev-center/customers-global/:id", notes: "S_4.7.1 enriched" },
  { id: "page", status: "ATIVO", path: "src/pages/admin/DevCenterCustomersGlobal.jsx" },
  { id: "gate", status: "ATIVO", path: "src/pages/admin/DevCenterRoute.jsx" },
  { id: "api", status: "ATIVO", path: "src/services/devCenterApi.js" },
  { id: "cache", status: "ATIVO", path: "src/pages/admin/devCenterGlobalDetailCache.js" },
  { id: "ops-kit", status: "ATIVO", path: "src/components/devCenter/ops/*" },
  { id: "boundary", status: "ATIVO", path: "src/constants/customersDomainBoundary.js" },
  { id: "lgpd-gov", status: "ATIVO", path: "src/constants/customersGlobalLgpdGovernance.js" },
  { id: "cross-gov", status: "ATIVO", path: "src/constants/customersGlobalCrossSellerGovernance.js" },
  { id: "perm-gov", status: "ATIVO", path: "src/constants/customersGlobalPermissionsGovernance.js" },
  { id: "hard-gov", status: "ATIVO", path: "src/constants/customersGlobalHardeningGovernance.js" },
  { id: "be-routes", status: "ATIVO", path: "suse7-backend/.../devCenterAdminRoutes.js" },
  { id: "be-detail", status: "ATIVO", path: "suse7-backend/.../devCenterCustomersGlobalDetailService.js" },
  { id: "be-summary", status: "ATIVO", path: "suse7-backend/.../devCenterCustomersGlobalOpsSummaryService.js" },
  { id: "be-access", status: "ATIVO", path: "suse7-backend/.../devCenterAccess.js" },
  { id: "be-input", status: "ATIVO", path: "suse7-backend/.../devCenterCustomersGlobalInput.js" },
  { id: "customersApi", status: "REMOVIDO", path: "—", notes: "S_4.6.1" },
  { id: "OpsIssueList", status: "REMOVIDO", path: "—", notes: "S_4.6.1" },
  { id: "OpsFiltersBar-seller", status: "LEGADO", path: "scope=seller", notes: "kit compartilhado Clientes360 futuro" },
]);

/** Scripts de validação — executar antes de deploy DEV */
export const CUSTOMERS_GLOBAL_VALIDATION_SCRIPTS = Object.freeze({
  frontendBuild: "cd suse7-frontend && npm run build",
  backendUnitAccess: "cd suse7-backend && npm run test:dev-center-access",
  backendUnitInput: "cd suse7-backend && npm run test:dev-center-customers-input",
  smokeBoundary: "cd suse7-backend && npm run smoke:dev-center-customers-boundary",
  smokeHardening: "cd suse7-backend && npm run smoke:dev-center-customers-hardening",
  auditLgpd: "node scripts/audit_dev_center_customers_global_lgpd.mjs",
  auditCrossSeller: "node scripts/audit_dev_center_cross_seller_static.mjs",
  auditPermissions: "node scripts/audit_dev_center_permissions_static.mjs",
});

/** Métricas baseline S_4.9.1 (referência) */
export const CUSTOMERS_GLOBAL_BASELINE_METRICS = Object.freeze({
  frontendModules: 2232,
  frontendBuildSec: 5.8,
  smokeBoundaryOk: 55,
  smokeHardeningOk: 14,
  drawerOpenCacheHitRequests: 0,
  drawerOpenColdRequests: 1,
  detailCacheTtlSec: 90,
  detailCacheMaxEntries: 8,
});
