/** @typedef {"idle" | "loading" | "loaded" | "empty" | "error"} ListingsSyncSearchState */

/** @typedef {"active" | "paused" | "closed" | "under_review" | "inactive"} ListingsSyncStatus */

/** @typedef {"classic" | "premium" | "free" | "gold" | "gold_special"} ListingsSyncListingType */

/** @typedef {"healthy" | "warning" | "danger" | "pending"} ListingsSyncHealthStatus */

/** @typedef {"linked" | "unlinked" | "pending" | "error"} ListingsSyncProductLinkStatus */

/**
 * @typedef {{
 *   listingId: string;
 *   sku: string;
 *   marketplace: string;
 *   marketplaceLabel: string;
 *   title: string;
 *   status: ListingsSyncStatus;
 *   listingType: ListingsSyncListingType;
 *   price: number;
 *   availableQuantity: number;
 *   soldQuantity: number;
 *   healthStatus: ListingsSyncHealthStatus;
 *   healthScore: number;
 *   lastSyncAt: string;
 *   productLinkStatus: ListingsSyncProductLinkStatus;
 * }} ListingsSyncViewModel
 */

export const LISTINGS_SYNC_DEFAULT_MOCK_QUERY = "MLB6086959274";
export const LISTINGS_SYNC_DEFAULT_MOCK_SKU = "FOGAO-4B-IND";
export const LISTINGS_SYNC_NOT_FOUND_TOKEN = "NOT_FOUND";

/**
 * @param {string | null | undefined} query
 */
export function normalizeListingsSyncQuery(query) {
  return String(query ?? "").trim();
}

/**
 * @param {string | null | undefined} query
 */
export function validateListingsSyncQuery(query) {
  const normalized = normalizeListingsSyncQuery(query);
  if (!normalized) {
    return { isValid: false, errorMessage: "Informe o MLB ou SKU do anúncio.", query: normalized };
  }
  return { isValid: true, errorMessage: "", query: normalized };
}

/**
 * @param {string | null | undefined} query
 * @returns {"mlb" | "sku"}
 */
export function detectListingsSyncSearchKind(query) {
  const normalized = normalizeListingsSyncQuery(query);
  if (/^MLB\d+$/i.test(normalized)) return "mlb";
  return "sku";
}

/**
 * @param {string} query
 * @returns {ListingsSyncViewModel}
 */
export function buildListingsSyncMockListing(query) {
  const normalized = normalizeListingsSyncQuery(query) || LISTINGS_SYNC_DEFAULT_MOCK_QUERY;
  const kind = detectListingsSyncSearchKind(normalized);
  const now = Date.now();

  const listingId =
    kind === "mlb" ? normalized.toUpperCase() : LISTINGS_SYNC_DEFAULT_MOCK_QUERY;
  const sku = kind === "sku" ? normalized.toUpperCase() : LISTINGS_SYNC_DEFAULT_MOCK_SKU;

  return {
    listingId,
    sku,
    marketplace: "mercado_livre",
    marketplaceLabel: "Mercado Livre",
    title: "Fogão Industrial 4 bocas",
    status: "active",
    listingType: "premium",
    price: 299.9,
    availableQuantity: 12,
    soldQuantity: 20,
    healthStatus: "healthy",
    healthScore: 86,
    lastSyncAt: new Date(now - 1000 * 60 * 30).toISOString(),
    productLinkStatus: "linked",
  };
}

/**
 * @param {ListingsSyncStatus | string | null | undefined} status
 */
export function resolveListingStatusLabel(status) {
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
 * @param {ListingsSyncStatus | string | null | undefined} status
 * @returns {"active" | "paused" | "closed" | "under_review" | "inactive" | "neutral"}
 */
export function resolveListingStatusVariant(status) {
  switch (status) {
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "closed":
      return "closed";
    case "under_review":
      return "under_review";
    case "inactive":
      return "inactive";
    default:
      return "neutral";
  }
}

/**
 * @param {ListingsSyncListingType | string | null | undefined} listingType
 */
export function resolveListingTypeLabel(listingType) {
  switch (listingType) {
    case "premium":
      return "Premium";
    case "classic":
      return "Clássico";
    case "free":
      return "Grátis";
    case "gold":
      return "Gold";
    case "gold_special":
      return "Gold Special";
    default:
      return "—";
  }
}

/**
 * @param {ListingsSyncHealthStatus | string | null | undefined} status
 */
export function resolveListingHealthLabel(status) {
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
 * @param {ListingsSyncHealthStatus | string | null | undefined} status
 * @returns {"healthy" | "warning" | "danger" | "pending" | "neutral"}
 */
export function resolveListingHealthVariant(status) {
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
 * @param {ListingsSyncProductLinkStatus | string | null | undefined} status
 */
export function resolveProductLinkStatusLabel(status) {
  switch (status) {
    case "linked":
      return "Vinculado";
    case "unlinked":
      return "Sem vínculo";
    case "pending":
      return "Pendente";
    case "error":
      return "Erro";
    default:
      return "—";
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
export function formatListingsSyncDateTime(iso) {
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
 * @param {ListingsSyncStatus | string} status
 */
export function listingsSyncStatusClassName(status) {
  const variant = resolveListingStatusVariant(status);
  return `listings-sync-result-card__status listings-sync-result-card__status--listing-${variant}`;
}

/**
 * @param {ListingsSyncHealthStatus | string} status
 */
export function listingsSyncHealthClassName(status) {
  const variant = resolveListingHealthVariant(status);
  return `listings-sync-result-card__status listings-sync-result-card__status--health-${variant}`;
}

/**
 * @param {ListingsSyncProductLinkStatus | string} status
 */
export function listingsSyncProductLinkClassName(status) {
  switch (status) {
    case "linked":
      return "listings-sync-result-card__status listings-sync-result-card__status--link-linked";
    case "unlinked":
      return "listings-sync-result-card__status listings-sync-result-card__status--link-unlinked";
    case "pending":
      return "listings-sync-result-card__status listings-sync-result-card__status--link-pending";
    case "error":
      return "listings-sync-result-card__status listings-sync-result-card__status--link-error";
    default:
      return "listings-sync-result-card__status listings-sync-result-card__status--link-neutral";
  }
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 */
export function resolveListingsSyncPanelState({
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
