/** @typedef {"idle" | "loading" | "loaded" | "empty" | "error"} ProductsSyncSearchState */

/** @typedef {"active" | "inactive" | "archived" | "draft"} ProductsSyncProductStatus */

/** @typedef {"healthy" | "warning" | "danger" | "pending"} ProductsSyncListingLinkStatus */

/** @typedef {"active" | "paused" | "closed" | "under_review" | "inactive"} ProductsSyncLinkedListingStatus */

/** @typedef {"healthy" | "warning" | "danger" | "pending"} ProductsSyncLinkedListingHealthStatus */

/**
 * @typedef {{
 *   listingId: string;
 *   marketplace: string;
 *   marketplaceLabel: string;
 *   accountLabel: string;
 *   status: ProductsSyncLinkedListingStatus;
 *   healthStatus: ProductsSyncLinkedListingHealthStatus;
 * }} ProductsSyncLinkedListingViewModel
 */

/**
 * @typedef {{
 *   productId: string;
 *   sku: string;
 *   title: string;
 *   productStatus: ProductsSyncProductStatus;
 *   linkedListingsCount: number;
 *   marketplacesCount: number;
 *   marketplaceAccountsCount: number;
 *   createdAt: string;
 *   updatedAt: string;
 *   lastLinkSyncAt: string;
 *   listingLinkStatus: ProductsSyncListingLinkStatus;
 *   linkedListings: ProductsSyncLinkedListingViewModel[];
 * }} ProductsSyncViewModel
 */

export const PRODUCTS_SYNC_DEFAULT_MOCK_SKU = "FOGAO-4B-IND";
export const PRODUCTS_SYNC_NOT_FOUND_TOKEN = "NOT_FOUND";

/**
 * @param {string | null | undefined} query
 */
export function normalizeProductsSyncQuery(query) {
  return String(query ?? "").trim();
}

/**
 * @param {string | null | undefined} query
 */
export function validateProductsSyncQuery(query) {
  const normalized = normalizeProductsSyncQuery(query);
  if (!normalized) {
    return { isValid: false, errorMessage: "Informe o SKU do produto.", query: normalized };
  }
  return { isValid: true, errorMessage: "", query: normalized };
}

/**
 * @param {string} sku
 * @returns {ProductsSyncViewModel}
 */
export function buildProductsSyncMockProduct(sku) {
  const normalizedSku = normalizeProductsSyncQuery(sku) || PRODUCTS_SYNC_DEFAULT_MOCK_SKU;
  const now = Date.now();

  const linkedListings = /** @type {ProductsSyncLinkedListingViewModel[]} */ ([
    {
      listingId: "MLB6086959274",
      marketplace: "mercado_livre",
      marketplaceLabel: "Mercado Livre",
      accountLabel: "Conta Principal",
      status: "active",
      healthStatus: "healthy",
    },
    {
      listingId: "MLB6086959275",
      marketplace: "mercado_livre",
      marketplaceLabel: "Mercado Livre",
      accountLabel: "Conta Reserva",
      status: "paused",
      healthStatus: "warning",
    },
  ]);

  return {
    productId: "prod_001",
    sku: normalizedSku.toUpperCase(),
    title: "Fogão Industrial 4 bocas",
    productStatus: "active",
    linkedListingsCount: linkedListings.length,
    marketplacesCount: 1,
    marketplaceAccountsCount: 2,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 120).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    lastLinkSyncAt: new Date(now - 1000 * 60 * 55).toISOString(),
    listingLinkStatus: "warning",
    linkedListings,
  };
}

/**
 * @param {ProductsSyncProductStatus | string | null | undefined} status
 */
export function resolveProductStatusLabel(status) {
  switch (status) {
    case "active":
      return "Ativo";
    case "inactive":
      return "Inativo";
    case "archived":
      return "Arquivado";
    case "draft":
      return "Rascunho";
    default:
      return "—";
  }
}

/**
 * @param {ProductsSyncProductStatus | string | null | undefined} status
 * @returns {"active" | "inactive" | "archived" | "draft" | "neutral"}
 */
export function resolveProductStatusVariant(status) {
  switch (status) {
    case "active":
      return "active";
    case "inactive":
      return "inactive";
    case "archived":
      return "archived";
    case "draft":
      return "draft";
    default:
      return "neutral";
  }
}

/**
 * @param {ProductsSyncListingLinkStatus | string | null | undefined} status
 */
export function resolveListingLinkStatusLabel(status) {
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
 * @param {ProductsSyncListingLinkStatus | string | null | undefined} status
 * @returns {"healthy" | "warning" | "danger" | "pending" | "neutral"}
 */
export function resolveListingLinkStatusVariant(status) {
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
 * @param {ProductsSyncLinkedListingStatus | string | null | undefined} status
 */
export function resolveLinkedListingStatusLabel(status) {
  switch (status) {
    case "active":
      return "Ativo";
    case "paused":
      return "Pausado";
    case "closed":
      return "Encerrado";
    case "under_review":
      return "Em revisão";
    case "inactive":
      return "Inativo";
    default:
      return "—";
  }
}

/**
 * @param {ProductsSyncLinkedListingHealthStatus | string | null | undefined} status
 */
export function resolveLinkedListingHealthLabel(status) {
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
 * @param {string | null | undefined} iso
 */
export function formatProductsSyncDateTime(iso) {
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
 * @param {ProductsSyncProductStatus | string} status
 */
export function productsSyncProductStatusClassName(status) {
  const variant = resolveProductStatusVariant(status);
  return `products-sync-result-card__status products-sync-result-card__status--product-${variant}`;
}

/**
 * @param {ProductsSyncListingLinkStatus | string} status
 */
export function productsSyncListingLinkStatusClassName(status) {
  const variant = resolveListingLinkStatusVariant(status);
  return `products-sync-result-card__status products-sync-result-card__status--link-${variant}`;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 */
export function resolveProductsSyncPanelState({
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
