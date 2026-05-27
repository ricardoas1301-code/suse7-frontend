/** @typedef {"idle" | "loading" | "loaded" | "empty" | "error"} AccountsSyncSearchState */

/** @typedef {"healthy" | "warning" | "danger" | "expired" | "unknown"} AccountsSyncTokenStatus */

/** @typedef {"healthy" | "warning" | "danger" | "pending" | "unknown"} AccountsSyncStatus */

/** @typedef {"healthy" | "warning" | "danger" | "unknown"} AccountsSyncIngestionHealth */

/**
 * @typedef {{
 *   accountId: string;
 *   accountLabel: string;
 *   marketplace: string;
 *   marketplaceLabel: string;
 *   sellerNickname: string;
 *   tokenStatus: AccountsSyncTokenStatus;
 *   tokenExpiresAt: string;
 *   syncStatus: AccountsSyncStatus;
 *   lastSyncAt: string;
 *   linkedProductsCount: number;
 *   linkedListingsCount: number;
 *   salesImportedToday: number;
 *   ingestionHealth: AccountsSyncIngestionHealth;
 * }} AccountsSyncViewModel
 */

export const ACCOUNTS_SYNC_DEFAULT_MOCK_QUERY = "Conta Principal ML";
export const ACCOUNTS_SYNC_NOT_FOUND_TOKEN = "NOT_FOUND";

/**
 * @param {string | null | undefined} query
 */
export function normalizeAccountsSyncQuery(query) {
  return String(query ?? "").trim();
}

/**
 * @param {string | null | undefined} query
 */
export function validateAccountsSyncQuery(query) {
  const normalized = normalizeAccountsSyncQuery(query);
  if (!normalized) {
    return { isValid: false, errorMessage: "Informe o nome da conta marketplace.", query: normalized };
  }
  return { isValid: true, errorMessage: "", query: normalized };
}

/**
 * @param {string} query
 * @returns {AccountsSyncViewModel}
 */
export function buildAccountsSyncMockAccount(query) {
  const normalized = normalizeAccountsSyncQuery(query) || ACCOUNTS_SYNC_DEFAULT_MOCK_QUERY;
  const now = Date.now();

  return {
    accountId: "acc_ml_001",
    accountLabel: normalized,
    marketplace: "mercado_livre",
    marketplaceLabel: "Mercado Livre",
    sellerNickname: "SUSE7_OFICIAL",
    tokenStatus: "warning",
    tokenExpiresAt: new Date(now + 1000 * 60 * 60 * 24 * 14).toISOString(),
    syncStatus: "warning",
    lastSyncAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    linkedProductsCount: 128,
    linkedListingsCount: 412,
    salesImportedToday: 34,
    ingestionHealth: "healthy",
  };
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
 * @param {AccountsSyncTokenStatus | string | null | undefined} status
 */
export function resolveTokenStatusLabel(status) {
  switch (status) {
    case "healthy":
      return "Saudável";
    case "warning":
      return "Atenção";
    case "danger":
      return "Crítico";
    case "expired":
      return "Expirado";
    default:
      return "Desconhecido";
  }
}

/**
 * @param {AccountsSyncTokenStatus | string | null | undefined} status
 * @returns {"healthy" | "warning" | "danger" | "expired" | "unknown"}
 */
export function resolveTokenStatusVariant(status) {
  switch (status) {
    case "healthy":
      return "healthy";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

/**
 * @param {AccountsSyncStatus | string | null | undefined} status
 */
export function resolveSyncStatusLabel(status) {
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
      return "Desconhecido";
  }
}

/**
 * @param {AccountsSyncStatus | string | null | undefined} status
 * @returns {"healthy" | "warning" | "danger" | "pending" | "unknown"}
 */
export function resolveSyncStatusVariant(status) {
  switch (status) {
    case "healthy":
      return "healthy";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

/**
 * @param {AccountsSyncIngestionHealth | string | null | undefined} health
 */
export function resolveIngestionHealthLabel(health) {
  switch (health) {
    case "healthy":
      return "Saudável";
    case "warning":
      return "Atenção";
    case "danger":
      return "Crítico";
    default:
      return "Desconhecido";
  }
}

/**
 * @param {AccountsSyncIngestionHealth | string | null | undefined} health
 * @returns {"healthy" | "warning" | "danger" | "unknown"}
 */
export function resolveIngestionHealthVariant(health) {
  switch (health) {
    case "healthy":
      return "healthy";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "unknown";
  }
}

/**
 * @param {string | null | undefined} iso
 */
export function formatAccountsSyncDateTime(iso) {
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
 * @param {AccountsSyncTokenStatus | string} status
 */
export function accountsSyncTokenStatusClassName(status) {
  const variant = resolveTokenStatusVariant(status);
  return `accounts-sync-result-card__status accounts-sync-result-card__status--token-${variant}`;
}

/**
 * @param {AccountsSyncStatus | string} status
 */
export function accountsSyncSyncStatusClassName(status) {
  const variant = resolveSyncStatusVariant(status);
  return `accounts-sync-result-card__status accounts-sync-result-card__status--sync-${variant}`;
}

/**
 * @param {AccountsSyncIngestionHealth | string} health
 */
export function accountsSyncIngestionHealthClassName(health) {
  const variant = resolveIngestionHealthVariant(health);
  return `accounts-sync-result-card__status accounts-sync-result-card__status--ingestion-${variant}`;
}

/**
 * @param {{
 *   sellerId?: string | null;
 *   drawerState?: import("../../../SellerDrawerStateResolver").SellerDrawerState | null;
 *   toolboxState?: import("../../sellerToolboxContextModel").SellerToolboxState | null;
 *   isReady?: boolean;
 * }} input
 */
export function resolveAccountsSyncPanelState({
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
