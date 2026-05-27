import {
  SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
  executeFakeSearchMarketplaceAccount,
} from "./sellerToolboxSearchMarketplaceAccountOperation";
import {
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
  executeFakeValidateMarketplaceToken,
} from "./sellerToolboxValidateMarketplaceTokenOperation";
import {
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
  executeFakeForceMarketplaceSync,
} from "./sellerToolboxForceMarketplaceSyncOperation";

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const ACCOUNTS_SYNC_VALIDATE_TOKEN_QUICK_REASONS = [
  { key: "suspicious_token", label: "Token suspeito", prefix: "Token suspeito: " },
  { key: "operational_review", label: "Conferência operacional", prefix: "Conferência operacional: " },
  { key: "post_login_adjustment", label: "Ajuste pós-login", prefix: "Ajuste pós-login: " },
  { key: "preventive_check", label: "Verificação preventiva", prefix: "Verificação preventiva: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const ACCOUNTS_SYNC_FORCE_SYNC_QUICK_REASONS = [
  { key: "outdated_sync", label: "Sync desatualizado", prefix: "Sync desatualizado: " },
  { key: "manual_reprocess", label: "Reprocessamento manual", prefix: "Reprocessamento manual: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

export const ACCOUNTS_SYNC_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
];

export const ACCOUNTS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ account?: import("./accountsSyncModel").AccountsSyncViewModel | null }} accountsSync
 */
export function extractAccountsSyncHandlerContext(metadata, accountsSync) {
  const account = accountsSync?.account ?? null;
  return {
    accountId: String(metadata?.accountId ?? account?.accountId ?? "").trim(),
    accountLabel: String(metadata?.accountLabel ?? account?.accountLabel ?? "").trim(),
    marketplace: String(metadata?.marketplace ?? account?.marketplace ?? "").trim(),
  };
}

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const ACCOUNTS_SYNC_SEARCH_OPERATION_CONFIG = {
  handler: executeFakeSearchMarketplaceAccount,
  requiresReason: false,
  applyAccountsSyncSearchResult: true,
  buildHandlerContext: ({ metadata }) => ({
    query: String(metadata?.query ?? "").trim(),
  }),
  devLog: {
    started: "marketplace_account_search_started",
    completed: "marketplace_account_search_completed",
    failed: "marketplace_account_search_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      query: metadata?.query ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      accountId: data.account?.accountId ?? null,
      accountLabel: data.account?.accountLabel ?? null,
      marketplace: data.account?.marketplace ?? null,
      searchedAt: data.searchedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      query: metadata?.query ?? null,
    }),
  },
  operationalLog: {
    event: "marketplace_account_searched",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      accountId: data.account?.accountId ?? metadata?.accountId ?? null,
      accountLabel: data.account?.accountLabel ?? metadata?.accountLabel ?? null,
      marketplace: data.account?.marketplace ?? metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.searchedAt,
    }),
  },
  feedback: {
    success: {
      title: "Conta encontrada",
      description: "Resultado operacional carregado localmente — nenhuma consulta real foi feita.",
    },
    error: {
      title: "Falha na busca",
      description: "Não foi possível concluir a busca fake. Tente novamente.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const ACCOUNTS_SYNC_VALIDATE_TOKEN_OPERATION_CONFIG = {
  handler: executeFakeValidateMarketplaceToken,
  quickReasons: ACCOUNTS_SYNC_VALIDATE_TOKEN_QUICK_REASONS,
  applyAccountsTokenValidationResult: true,
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractAccountsSyncHandlerContext(metadata, accountsSync),
  devLog: {
    started: "marketplace_token_validation_started",
    completed: "marketplace_token_validation_completed",
    failed: "marketplace_token_validation_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
      accountLabel: metadata?.accountLabel ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newTokenStatus: data.newTokenStatus,
      validatedAt: data.validatedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
  },
  operationalLog: {
    event: "marketplace_token_validated",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      accountId: metadata?.accountId ?? null,
      accountLabel: metadata?.accountLabel ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.validatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Token validado (simulado)",
      description: "Status do token atualizado localmente — nenhuma validação real foi executada.",
    },
    error: {
      title: "Falha ao validar token",
      description: "Não foi possível concluir a validação fake.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const ACCOUNTS_SYNC_FORCE_SYNC_OPERATION_CONFIG = {
  handler: executeFakeForceMarketplaceSync,
  quickReasons: ACCOUNTS_SYNC_FORCE_SYNC_QUICK_REASONS,
  applyAccountsForceSyncResult: true,
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractAccountsSyncHandlerContext(metadata, accountsSync),
  devLog: {
    started: "marketplace_sync_force_started",
    completed: "marketplace_sync_force_completed",
    failed: "marketplace_sync_force_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
      accountLabel: metadata?.accountLabel ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newSyncStatus: data.newSyncStatus,
      importedSales: data.importedSales,
      importedListings: data.importedListings,
      syncedAt: data.syncedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
  },
  operationalLog: {
    event: "marketplace_sync_forced",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      accountId: metadata?.accountId ?? null,
      accountLabel: metadata?.accountLabel ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.syncedAt,
    }),
  },
  feedback: {
    success: {
      title: "Sync forçado (simulado)",
      description: "Status de sincronização atualizado localmente — nenhum sync real foi executado.",
    },
    error: {
      title: "Falha ao forçar sync",
      description: "Não foi possível concluir a sincronização fake.",
    },
  },
};
