/** @typedef {"idle" | "loading" | "loaded" | "empty" | "error"} SalesSyncSearchState */

/** @typedef {"healthy" | "warning" | "danger" | "pending"} SalesSyncFinancialStatus */

/** @typedef {"processed" | "pending" | "error" | "unknown"} SalesSyncCustomerStatus */

/**
 * @typedef {{
 *   saleId: string;
 *   marketplace: string;
 *   marketplaceLabel: string;
 *   orderStatus: string;
 *   customerName: string;
 *   productTitle: string;
 *   grossAmount: number;
 *   netAmount: number;
 *   createdAt: string;
 *   lastSyncAt: string;
 *   financialStatus: SalesSyncFinancialStatus;
 *   customerStatus: SalesSyncCustomerStatus;
 * }} SalesSyncViewModel
 */

export const SALES_SYNC_DEFAULT_MOCK_SALE_ID = "2000016503467162";

export const SALES_SYNC_SEARCH_MIN_ID_LENGTH = 6;

/**
 * @param {string | null | undefined} saleId
 */
export function normalizeSalesSyncSaleId(saleId) {
  return String(saleId ?? "").trim();
}

/**
 * @param {string | null | undefined} saleId
 */
export function validateSalesSyncSaleId(saleId) {
  const normalized = normalizeSalesSyncSaleId(saleId);
  if (!normalized) {
    return { isValid: false, errorMessage: "Informe o ID da venda.", saleId: normalized };
  }
  if (normalized.length < SALES_SYNC_SEARCH_MIN_ID_LENGTH) {
    return {
      isValid: false,
      errorMessage: `Informe ao menos ${SALES_SYNC_SEARCH_MIN_ID_LENGTH} caracteres.`,
      saleId: normalized,
    };
  }
  return { isValid: true, errorMessage: "", saleId: normalized };
}

/**
 * @param {string} saleId
 * @returns {SalesSyncViewModel}
 */
export function buildSalesSyncMockSale(saleId) {
  const normalizedId = normalizeSalesSyncSaleId(saleId) || SALES_SYNC_DEFAULT_MOCK_SALE_ID;
  const now = Date.now();

  return {
    saleId: normalizedId,
    marketplace: "mercado_livre",
    marketplaceLabel: "Mercado Livre",
    orderStatus: "paid",
    customerName: "Marcos Silva",
    productTitle: "Fogão Industrial 4 bocas",
    grossAmount: 299.9,
    netAmount: 169.89,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    lastSyncAt: new Date(now - 1000 * 60 * 45).toISOString(),
    financialStatus: "healthy",
    customerStatus: "processed",
  };
}

/**
 * @param {SalesSyncFinancialStatus | string | null | undefined} status
 */
export function resolveFinancialStatusLabel(status) {
  switch (status) {
    case "warning":
      return "Atenção";
    case "danger":
      return "Divergente";
    case "pending":
      return "Pendente";
    case "healthy":
      return "Saudável";
    default:
      return "—";
  }
}

/**
 * @param {SalesSyncFinancialStatus | string | null | undefined} status
 * @returns {"healthy" | "warning" | "danger" | "pending" | "neutral"}
 */
export function resolveFinancialStatusVariant(status) {
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
 * @param {SalesSyncCustomerStatus | string | null | undefined} status
 */
export function resolveCustomerStatusLabel(status) {
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
 * @param {SalesSyncCustomerStatus | string | null | undefined} status
 * @returns {"processed" | "pending" | "error" | "unknown"}
 */
export function resolveCustomerStatusVariant(status) {
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
 * @param {string | null | undefined} marketplaceLabel
 */
export function resolveMarketplaceLabel(marketplace, marketplaceLabel) {
  const label = String(marketplaceLabel ?? "").trim();
  if (label) return label;

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
export function formatSalesSyncDateTime(iso) {
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
 * @param {SalesSyncFinancialStatus | string} status
 */
export function salesSyncFinancialStatusClassName(status) {
  const variant = resolveFinancialStatusVariant(status);
  return `sales-sync-result-card__status sales-sync-result-card__status--financial-${variant}`;
}

/**
 * @param {SalesSyncCustomerStatus | string} status
 */
export function salesSyncCustomerStatusClassName(status) {
  const variant = resolveCustomerStatusVariant(status);
  return `sales-sync-result-card__status sales-sync-result-card__status--customer-${variant}`;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 */
export function resolveSalesSyncPanelState({
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
