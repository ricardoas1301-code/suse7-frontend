// =============================================================================
// Dev Center S_4.8.2 — Governança cross-seller (documentação viva)
// =============================================================================

/** @typedef {"admin_global" | "seller" | "cross_seller"} DataScope */

/**
 * @typedef {Readonly<{
 *   entity: string;
 *   scope: DataScope;
 *   reads: string;
 *   aggregates: string;
 *   renders: string;
 *   canAggregate: boolean;
 *   canRender: boolean;
 *   canExitApi: boolean;
 *   notes?: string;
 * }>} CrossSellerBoundaryRecord
 */

/** @type {readonly CrossSellerBoundaryRecord[]} */
export const CUSTOMERS_CROSS_SELLER_BOUNDARIES = Object.freeze([
  {
    entity: "Admin Global (Dev Center)",
    scope: "admin_global",
    reads: "s7_global_customers (sem filtro user_id)",
    aggregates: "summary cross-seller, related_sellers no detail",
    renders: "DevCenterCustomersGlobal.jsx",
    canAggregate: true,
    canRender: true,
    canExitApi: true,
    notes: "Gate: resolveDevCenterAccess (is_admin | allowlist)",
  },
  {
    entity: "Seller (Clientes360)",
    scope: "seller",
    reads: "marketplace_customers WHERE user_id = JWT",
    aggregates: "summary escopado ao seller",
    renders: "Clientes360.jsx",
    canAggregate: false,
    canRender: true,
    canExitApi: true,
    notes: "Nunca lê s7_global_customers",
  },
  {
    entity: "Global Customer",
    scope: "cross_seller",
    reads: "s7_global_customers (dedupe cross-marketplace)",
    aggregates: "total_orders_global, related_sellers[]",
    renders: "OpsGlobalDrawerBody (admin only)",
    canAggregate: true,
    canRender: true,
    canExitApi: true,
    notes: "Registro deduplicado — visível só via admin global",
  },
  {
    entity: "Marketplace Account",
    scope: "seller",
    reads: "marketplace_accounts por user_id",
    aggregates: "N/A no drawer global (só referência em related_sellers)",
    renders: "RelatedSellersList (truncado)",
    canAggregate: false,
    canRender: true,
    canExitApi: true,
    notes: "IDs truncados na UI",
  },
  {
    entity: "Company (seller_company_id)",
    scope: "seller",
    reads: "via related_sellers JSON no global",
    aggregates: "contagem em activity",
    renders: "OpsGlobalOperationalContext",
    canAggregate: true,
    canRender: true,
    canExitApi: true,
    notes: "Correlação operacional admin — não expõe PII seller",
  },
]);

/** Rotas e escopo esperado por token */
export const CUSTOMERS_CROSS_SELLER_ACCESS_MATRIX = Object.freeze({
  seller_to_seller_api: { route: "GET /api/customers*", token: "seller", expected: "200 scoped user_id" },
  seller_to_admin_global: { route: "GET /api/dev-center/customers-global*", token: "seller", expected: "403" },
  admin_to_admin_global: { route: "GET /api/dev-center/customers-global*", token: "admin", expected: "200 admin_global" },
  admin_to_seller_api: { route: "GET /api/customers*", token: "admin", expected: "200 seller scope (não usado pela UI admin)" },
  seller_a_to_seller_b_detail: {
    route: "GET /api/customers/:id",
    token: "seller A",
    expected: "404 for B customer id",
  },
});

/** Cache admin global — dimensões de isolamento */
export const CUSTOMERS_GLOBAL_CACHE_POLICY = Object.freeze({
  scope: "admin_global",
  keyPattern: "admin_global:{globalCustomerId}",
  persistence: "none",
  crossSession: false,
  crossSellerKeyMix: false,
  notes: "Chave inclui escopo explícito; ids globais UUID únicos",
});
