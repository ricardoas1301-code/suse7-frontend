/** @typedef {"idle" | "loading" | "loaded" | "empty" | "error"} CustomersSyncSearchState */

/** @typedef {"healthy" | "warning" | "danger" | "pending"} CustomersSyncCustomerStatus */

/** @typedef {"processed" | "pending" | "error" | "unknown"} CustomersSyncCustomer360Status */

/**
 * @typedef {{
 *   saleId: string;
 *   marketplace: string;
 *   grossAmount: number;
 *   createdAt: string;
 * }} CustomersSyncRecentSaleViewModel
 */

/**
 * @typedef {{
 *   customerId: string;
 *   customerName: string;
 *   email: string;
 *   phone: string;
 *   document: string;
 *   customerStatus: CustomersSyncCustomerStatus;
 *   customer360Status: CustomersSyncCustomer360Status;
 *   marketplaceCustomersCount: number;
 *   totalOrders: number;
 *   totalSpent: number;
 *   firstOrderAt: string;
 *   lastOrderAt: string;
 *   lastCustomer360SyncAt: string;
 *   recentSales: CustomersSyncRecentSaleViewModel[];
 * }} CustomersSyncViewModel
 */

export const CUSTOMERS_SYNC_DEFAULT_MOCK_QUERY = "marcos@email.com";
export const CUSTOMERS_SYNC_NOT_FOUND_TOKEN = "NOT_FOUND";

/**
 * @param {string | null | undefined} query
 */
export function normalizeCustomersSyncQuery(query) {
  return String(query ?? "").trim();
}

/**
 * @param {string | null | undefined} query
 */
export function validateCustomersSyncQuery(query) {
  const normalized = normalizeCustomersSyncQuery(query);
  if (!normalized) {
    return { isValid: false, errorMessage: "Informe e-mail, telefone ou documento do cliente.", query: normalized };
  }
  return { isValid: true, errorMessage: "", query: normalized };
}

/**
 * @param {string | null | undefined} query
 * @returns {"email" | "phone" | "document"}
 */
export function detectCustomersSyncSearchKind(query) {
  const normalized = normalizeCustomersSyncQuery(query);
  if (normalized.includes("@")) return "email";
  const digits = normalized.replace(/\D/g, "");
  if (digits.length === 11 && !normalized.includes("@")) return "phone";
  if (digits.length >= 11) return "document";
  if (/^\d+$/.test(normalized.replace(/\D/g, ""))) return "phone";
  return "email";
}

/**
 * @param {string} query
 * @returns {CustomersSyncViewModel}
 */
export function buildCustomersSyncMockCustomer(query) {
  const normalized = normalizeCustomersSyncQuery(query) || CUSTOMERS_SYNC_DEFAULT_MOCK_QUERY;
  const kind = detectCustomersSyncSearchKind(normalized);
  const now = Date.now();

  const email =
    kind === "email" ? normalized.toLowerCase() : "marcos@email.com";
  const phone =
    kind === "phone" ? normalized.replace(/\D/g, "") : "11999999999";
  const document =
    kind === "document" ? normalized.replace(/\D/g, "") : "12345678900";

  const recentSales = /** @type {CustomersSyncRecentSaleViewModel[]} */ ([
    {
      saleId: "2000016503467162",
      marketplace: "mercado_livre",
      grossAmount: 299.9,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      saleId: "2000016503467163",
      marketplace: "mercado_livre",
      grossAmount: 189.9,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
  ]);

  return {
    customerId: "cust_001",
    customerName: "Marcos Silva",
    email,
    phone,
    document,
    customerStatus: "healthy",
    customer360Status: "pending",
    marketplaceCustomersCount: 2,
    totalOrders: 8,
    totalSpent: 1890.42,
    firstOrderAt: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
    lastOrderAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    lastCustomer360SyncAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    recentSales,
  };
}

/**
 * @param {CustomersSyncCustomerStatus | string | null | undefined} status
 */
export function resolveCustomerStatusLabel(status) {
  switch (status) {
    case "healthy":
      return "Saudável";
    case "warning":
      return "Atenção";
    case "danger":
      return "Crítico";
    case "pending":
      return "Pendente";
    default:
      return "—";
  }
}

/**
 * @param {CustomersSyncCustomerStatus | string | null | undefined} status
 * @returns {"healthy" | "warning" | "danger" | "pending" | "neutral"}
 */
export function resolveCustomerStatusVariant(status) {
  switch (status) {
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "pending":
      return "pending";
    case "healthy":
      return "healthy";
    default:
      return "neutral";
  }
}

/**
 * @param {CustomersSyncCustomer360Status | string | null | undefined} status
 */
export function resolveCustomer360StatusLabel(status) {
  switch (status) {
    case "processed":
      return "Processado";
    case "pending":
      return "Pendente";
    case "error":
      return "Erro";
    default:
      return "Desconhecido";
  }
}

/**
 * @param {CustomersSyncCustomer360Status | string | null | undefined} status
 * @returns {"processed" | "pending" | "error" | "unknown"}
 */
export function resolveCustomer360StatusVariant(status) {
  switch (status) {
    case "processed":
      return "processed";
    case "pending":
      return "pending";
    case "error":
      return "error";
    default:
      return "unknown";
  }
}

/**
 * @param {string | null | undefined} marketplace
 */
export function resolveMarketplaceLabel(marketplace) {
  switch (String(marketplace ?? "").trim()) {
    case "mercado_livre":
      return "Mercado Livre";
    case "shopee":
      return "Shopee";
    case "amazon":
      return "Amazon";
    default:
      return "Marketplace";
  }
}

/**
 * @param {number | string | null | undefined} value
 */
export function formatCurrencyBRL(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {string | null | undefined} iso
 */
export function formatCustomersSyncDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  if (diffMs >= 0 && diffMs < 60_000) return "agora";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {CustomersSyncCustomerStatus | string} status
 */
export function customersSyncCustomerStatusClassName(status) {
  const variant = resolveCustomerStatusVariant(status);
  return `customers-sync-result-card__status customers-sync-result-card__status--customer-${variant}`;
}

/**
 * @param {CustomersSyncCustomer360Status | string} status
 */
export function customersSyncCustomer360StatusClassName(status) {
  const variant = resolveCustomer360StatusVariant(status);
  return `customers-sync-result-card__status customers-sync-result-card__status--customer360-${variant}`;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 */
export function resolveCustomersSyncPanelState({
  sellerId = null,
  drawerState = null,
  toolboxState = null,
  isReady = false,
}) {
  if (!sellerId) return "empty";
  if (drawerState === "loading" || toolboxState === "loading") return "loading";
  if (drawerState === "error" || toolboxState === "error") return "error";
  if (drawerState === "empty" || toolboxState === "empty") return "empty";
  if (!isReady) return "loading";
  return "loaded";
}
