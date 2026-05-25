// =============================================================================
// Dev Center Clientes Global — Baseline DEFINITIVA S_4.9.4
// Epic S_4 ENCERRADO — S_4.1 → S_4.9.4. Sem breaking change de contrato.
// =============================================================================

export const CUSTOMERS_GLOBAL_EPIC_STATUS = Object.freeze({
  epic: "S_4",
  module: "Dev Center — Clientes Globais",
  closed: true,
  closedAt: "S_4.9.4",
  finalCheckpointFrontend: "4A94",
  finalCheckpointBackend: "4A91",
  documentation: "docs/dev-center/DEV_CENTER_CUSTOMERS_GLOBAL.md",
  closureDoc: "docs/dev-center/S_4_EPIC_CLOSURE.md",
});

/** Checkpoints frontend (suse7-frontend) — ordem cronológica S_4.6 → S_4.9.4 */
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
  "14b3b56 — S_4.9.1 build final",
  "dbe3a5f — S_4.9.2A responsividade",
  "4beea1d — S_4.9.3 documentação",
  "4A94 — S_4.9.4 checkpoint final (este manifesto)",
]);

/** @typedef {"ATIVO" | "LEGADO" | "REMOVIDO"} InventoryStatus */

/**
 * @typedef {Readonly<{ id: string; status: InventoryStatus; path: string; notes?: string }>}
 * InventoryEntry
 */

/** Snapshot final S_4.9.4 */
export const CUSTOMERS_GLOBAL_INVENTORY = Object.freeze([
  // — Rotas —
  { id: "fe-route", status: "ATIVO", path: "/admin/dev-center/customers-global", notes: "App.jsx → DevCenterShell" },
  { id: "be-bootstrap", status: "ATIVO", path: "GET /api/dev-center/bootstrap", notes: "gate allowed + user_id" },
  { id: "be-route-list", status: "ATIVO", path: "GET /api/dev-center/customers-global", notes: "customers[] + summary" },
  { id: "be-route-detail", status: "ATIVO", path: "GET /api/dev-center/customers-global/:id", notes: "S_4.7.1 enriched" },
  // — Frontend core —
  { id: "gate", status: "ATIVO", path: "src/pages/admin/DevCenterRoute.jsx" },
  { id: "shell", status: "ATIVO", path: "src/pages/admin/DevCenterShell.jsx", notes: "layout admin S_4.9.2A" },
  { id: "page", status: "ATIVO", path: "src/pages/admin/DevCenterCustomersGlobal.jsx" },
  { id: "api", status: "ATIVO", path: "src/services/devCenterApi.js", notes: "devCenterGetCustomersGlobal*" },
  { id: "cache", status: "ATIVO", path: "src/pages/admin/devCenterGlobalDetailCache.js" },
  { id: "input-fe", status: "ATIVO", path: "src/pages/admin/devCenterCustomersGlobalInput.js" },
  // — Ops kit —
  { id: "ops-shell", status: "ATIVO", path: "src/components/devCenter/ops/OpsDrawerShell.jsx" },
  { id: "ops-body", status: "ATIVO", path: "src/components/devCenter/ops/OpsGlobalDrawerBody.jsx" },
  { id: "ops-stats", status: "ATIVO", path: "src/components/devCenter/ops/OpsStatsGrid.jsx" },
  { id: "ops-filters-global", status: "ATIVO", path: "src/components/devCenter/ops/OpsFiltersBar.jsx", notes: "scope=global" },
  { id: "ops-timeline", status: "ATIVO", path: "src/components/devCenter/ops/OpsTimeline.jsx" },
  { id: "ops-badges", status: "ATIVO", path: "OpsHealthBadge + OpsConfidenceBadge", notes: "via OpsStatsGrid" },
  { id: "ops-empty", status: "ATIVO", path: "src/components/devCenter/ops/OpsEmptyState.jsx" },
  { id: "ops-css", status: "ATIVO", path: "src/components/devCenter/ops/ops.css" },
  // — Governanças —
  { id: "boundary", status: "ATIVO", path: "src/constants/customersDomainBoundary.js" },
  { id: "lgpd-gov", status: "ATIVO", path: "src/constants/customersGlobalLgpdGovernance.js" },
  { id: "cross-gov", status: "ATIVO", path: "src/constants/customersGlobalCrossSellerGovernance.js" },
  { id: "perm-gov", status: "ATIVO", path: "src/constants/customersGlobalPermissionsGovernance.js" },
  { id: "hard-gov", status: "ATIVO", path: "src/constants/customersGlobalHardeningGovernance.js" },
  { id: "manifest", status: "ATIVO", path: "src/constants/customersGlobalBaselineManifest.js", notes: "fonte de verdade baseline" },
  // — Backend handlers —
  { id: "be-index", status: "ATIVO", path: "suse7-backend/src/handlers/devCenter/index.js" },
  { id: "be-routes", status: "ATIVO", path: "suse7-backend/src/handlers/devCenter/devCenterAdminRoutes.js" },
  { id: "be-detail", status: "ATIVO", path: "suse7-backend/.../devCenterCustomersGlobalDetailService.js" },
  { id: "be-summary", status: "ATIVO", path: "suse7-backend/.../devCenterCustomersGlobalOpsSummaryService.js" },
  { id: "be-access", status: "ATIVO", path: "suse7-backend/.../devCenterAccess.js" },
  { id: "be-input", status: "ATIVO", path: "suse7-backend/.../devCenterCustomersGlobalInput.js" },
  // — Documentação —
  { id: "doc-module", status: "ATIVO", path: "docs/dev-center/DEV_CENTER_CUSTOMERS_GLOBAL.md" },
  { id: "doc-closure", status: "ATIVO", path: "docs/dev-center/S_4_EPIC_CLOSURE.md" },
  // — Removido / legado —
  { id: "customersApi", status: "REMOVIDO", path: "—", notes: "S_4.6.1" },
  { id: "OpsIssueList", status: "REMOVIDO", path: "—", notes: "S_4.6.1" },
  { id: "OpsFiltersBar-seller", status: "LEGADO", path: "scope=seller", notes: "kit compartilhado Clientes360 futuro" },
  { id: "DevCenterRoot", status: "LEGADO", path: "DevCenterRoot.jsx", notes: "re-export DevCenterShell" },
  { id: "dc-drawer-css", status: "LEGADO", path: "DevCenterModules.css .dc-drawer", notes: "outros módulos admin" },
]);

/** Comando único oficial — pré-deploy */
export const CUSTOMERS_GLOBAL_VALIDATE_ALL =
  "cd suse7-backend && npm run validate:dev-center-customers-global && cd ../suse7-frontend && npm run build";

/** Scripts de validação */
export const CUSTOMERS_GLOBAL_VALIDATION_SCRIPTS = Object.freeze({
  validateAll: CUSTOMERS_GLOBAL_VALIDATE_ALL,
  frontendBuild: "cd suse7-frontend && npm run build",
  backendValidate: "cd suse7-backend && npm run validate:dev-center-customers-global",
  backendUnitAccess: "cd suse7-backend && npm run test:dev-center-access",
  backendUnitInput: "cd suse7-backend && npm run test:dev-center-customers-input",
  smokeBoundary: "cd suse7-backend && npm run smoke:dev-center-customers-boundary",
  smokeHardening: "cd suse7-backend && npm run smoke:dev-center-customers-hardening",
  auditLgpd: "node scripts/audit_dev_center_customers_global_lgpd.mjs",
  auditCrossSeller: "node scripts/audit_dev_center_cross_seller_static.mjs",
  auditPermissions: "node scripts/audit_dev_center_permissions_static.mjs",
});

/** Métricas baseline DEFINITIVA S_4.9.4 */
export const CUSTOMERS_GLOBAL_BASELINE_METRICS = Object.freeze({
  frontendModules: 2236,
  frontendBuildSec: 5.6,
  smokeBoundaryOk: 55,
  smokeHardeningOk: 14,
  smokeTotal: 69,
  staticAudits: 3,
  governanceDocs: 5,
  drawerOpenCacheHitRequests: 0,
  drawerOpenColdRequests: 1,
  detailCacheTtlSec: 90,
  detailCacheMaxEntries: 8,
});

/** Comparativo epic — referência S_4.6 início vs S_4.9.4 fim */
export const CUSTOMERS_GLOBAL_EPIC_DELTA = Object.freeze({
  frontendModules: { before: 2226, after: 2236, delta: "+10" },
  frontendBuildSec: { before: 5.0, after: 5.6, delta: "≈ igual" },
  smokeTotal: { before: 37, after: 69, delta: "+32" },
  governanceDocs: { before: 1, after: 5, delta: "+4" },
  drawerCacheHit: { before: "N/A", after: "0 req", delta: "melhor" },
  automatedValidation: { before: "boundary only", after: "validate:* + 3 audits", delta: "melhor" },
  documentation: { before: "boundary comments", after: "2 docs + manifest", delta: "melhor" },
  uxResponsiveness: { before: "clip 100% zoom", after: "scroll ok S_4.9.2A", delta: "melhor" },
});

/** Saúde final registrada */
export const CUSTOMERS_GLOBAL_HEALTH = Object.freeze({
  blocking: [],
  high: [],
  medium: ["Dual-role JWT — política de provisionamento operacional"],
  low: [
    "quality/ingestion per-customer = not_available",
    "Smokes exigem API local :3001",
    "Chunk Vite > 500 kB (pré-existente)",
  ],
  devReady: true,
  prodReady: true,
  prodNotes: "QA manual concluído S_4.9.2; confirmar allowlist/is_admin em prod",
});

/** Governança — regras de evolução futura */
export const CUSTOMERS_GLOBAL_EVOLUTION_RULES = Object.freeze([
  "Contrato S_4.7.1: breaking change exige nova fase (S_5+), nunca hotfix silencioso",
  "Dev Center Global NUNCA consome /api/customers* — ver customersDomainBoundary.js",
  "Campos *_normalized e dedupe_key NUNCA expostos — ver customersGlobalLgpdGovernance.js",
  "summary.scope deve permanecer admin_global neste módulo",
  "Cache detail: escopo admin_global:{userId}:{id}; sem localStorage",
  "Toda alteração de contrato ou segurança: rodar validate:dev-center-customers-global + 3 audits",
  "Documentação operacional: docs/dev-center/DEV_CENTER_CUSTOMERS_GLOBAL.md",
]);
