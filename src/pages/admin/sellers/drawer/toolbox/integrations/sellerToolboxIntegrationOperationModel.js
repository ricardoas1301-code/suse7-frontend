import { DEV_CENTER_CATEGORIAS_RELOAD } from "../../../../../../components/devCenter/operational/devCenterOperationalReloadModel";
import { createRealIntegrationOperationHandler } from "./sellerToolboxIntegrationApiOperations";
import {
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
} from "../centralSync/accounts/sellerToolboxValidateMarketplaceTokenOperation";
import {
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
} from "../centralSync/accounts/sellerToolboxForceMarketplaceSyncOperation";
import { SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID } from "./sellerToolboxReimportMarketplaceAccountOperation";
import { SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID } from "./sellerToolboxInvalidateIntegrationCacheOperation";
import { SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID } from "./sellerToolboxRefreshIntegrationHealthOperation";
import { extractAccountsSyncHandlerContext } from "../centralSync/accounts/accountsSyncOperationModel";

/** @type {string[]} */
export const SELLER_TOOLBOX_REAL_INTEGRATION_RELOAD_CATEGORIES = [
  DEV_CENTER_CATEGORIAS_RELOAD.INTEGRACOES,
  DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
];

export const SELLER_TOOLBOX_INTEGRATION_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
  SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID,
  SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID,
  SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID,
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const INTEGRATION_REIMPORT_QUICK_REASONS = [
  { key: "data_divergence", label: "Divergência de dados", prefix: "Divergência de dados: " },
  { key: "manual_reprocess", label: "Reprocessamento manual", prefix: "Reprocessamento manual: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const INTEGRATION_INVALIDATE_CACHE_QUICK_REASONS = [
  { key: "stale_cache", label: "Cache desatualizado", prefix: "Cache desatualizado: " },
  { key: "operational_fix", label: "Correção operacional", prefix: "Correção operacional: " },
  { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const INTEGRATION_REFRESH_HEALTH_QUICK_REASONS = [
  { key: "health_check", label: "Verificação de saúde", prefix: "Verificação de saúde: " },
  { key: "operational_review", label: "Conferência operacional", prefix: "Conferência operacional: " },
  { key: "post_incident", label: "Pós-incidente", prefix: "Pós-incidente: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ account?: import("../centralSync/accounts/accountsSyncModel").AccountsSyncViewModel | null }} [accountsSync]
 */
export function extractIntegrationHandlerContext(metadata, accountsSync) {
  return extractAccountsSyncHandlerContext(metadata, accountsSync);
}

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const INTEGRATION_VALIDATE_TOKEN_OPERATION_CONFIG = {
  handler: createRealIntegrationOperationHandler(SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID),
  quickReasons: [
    { key: "suspicious_token", label: "Token suspeito", prefix: "Token suspeito: " },
    { key: "operational_review", label: "Conferência operacional", prefix: "Conferência operacional: " },
    { key: "post_login_adjustment", label: "Ajuste pós-login", prefix: "Ajuste pós-login: " },
    { key: "preventive_check", label: "Verificação preventiva", prefix: "Verificação preventiva: " },
    { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
  ],
  applyAccountsTokenValidationResult: true,
  recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_INTEGRATION_RELOAD_CATEGORIES,
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractIntegrationHandlerContext(metadata, accountsSync),
  devLog: {
    started: "marketplace_token_validation_started",
    completed: "marketplace_token_validation_completed",
    failed: "marketplace_token_validation_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newTokenStatus: data.newTokenStatus,
      validatedAt: data.validatedAt,
      auditId: data.auditId ?? null,
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
      auditId: data.auditId ?? null,
      reasonLength,
      timestamp: data.validatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Token revalidado",
      description: "Validação persistida no backend e painéis recarregados.",
    },
    error: {
      title: "Falha ao revalidar token",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const INTEGRATION_FORCE_SYNC_OPERATION_CONFIG = {
  handler: createRealIntegrationOperationHandler(SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID),
  quickReasons: [
    { key: "outdated_sync", label: "Sync desatualizado", prefix: "Sync desatualizado: " },
    { key: "manual_reprocess", label: "Reprocessamento manual", prefix: "Reprocessamento manual: " },
    { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
    { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
    { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
  ],
  applyAccountsForceSyncResult: true,
  recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_INTEGRATION_RELOAD_CATEGORIES,
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractIntegrationHandlerContext(metadata, accountsSync),
  devLog: {
    started: "marketplace_sync_force_started",
    completed: "marketplace_sync_force_completed",
    failed: "marketplace_sync_force_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newSyncStatus: data.newSyncStatus,
      syncedAt: data.syncedAt,
      auditId: data.auditId ?? null,
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
      auditId: data.auditId ?? null,
      reasonLength,
      timestamp: data.syncedAt,
    }),
  },
  feedback: {
    success: {
      title: "Sincronização enfileirada",
      description: "Sync operacional solicitado e painéis recarregados.",
    },
    error: {
      title: "Falha ao sincronizar",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const INTEGRATION_REIMPORT_ACCOUNT_OPERATION_CONFIG = {
  handler: createRealIntegrationOperationHandler(SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID),
  quickReasons: INTEGRATION_REIMPORT_QUICK_REASONS,
  applyAccountsForceSyncResult: true,
  recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_INTEGRATION_RELOAD_CATEGORIES,
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractIntegrationHandlerContext(metadata, accountsSync),
  devLog: {
    started: "marketplace_account_reimport_started",
    completed: "marketplace_account_reimport_completed",
    failed: "marketplace_account_reimport_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      reimported: data.reimported,
      syncedAt: data.syncedAt,
      auditId: data.auditId ?? null,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
  },
  operationalLog: {
    event: "marketplace_account_reimported",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      accountId: metadata?.accountId ?? null,
      auditId: data.auditId ?? null,
      reasonLength,
      timestamp: data.syncedAt,
    }),
  },
  feedback: {
    success: {
      title: "Reimportação solicitada",
      description: "Jobs de reimportação enfileirados e painéis recarregados.",
    },
    error: {
      title: "Falha ao reimportar conta",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const INTEGRATION_INVALIDATE_CACHE_OPERATION_CONFIG = {
  handler: createRealIntegrationOperationHandler(SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID),
  quickReasons: INTEGRATION_INVALIDATE_CACHE_QUICK_REASONS,
  recarregarCategoriasOperacionais: [
    ...SELLER_TOOLBOX_REAL_INTEGRATION_RELOAD_CATEGORIES,
    DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX,
  ],
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractIntegrationHandlerContext(metadata, accountsSync),
  devLog: {
    started: "integration_cache_invalidate_started",
    completed: "integration_cache_invalidate_completed",
    failed: "integration_cache_invalidate_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      cacheInvalidatedAt: data.cacheInvalidatedAt,
      auditId: data.auditId ?? null,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
  },
  operationalLog: {
    event: "integration_cache_invalidated",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      accountId: metadata?.accountId ?? null,
      auditId: data.auditId ?? null,
      reasonLength,
      timestamp: data.cacheInvalidatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Cache invalidado",
      description: "Cache operacional invalidado e painéis recarregados.",
    },
    error: {
      title: "Falha ao invalidar cache",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const INTEGRATION_REFRESH_HEALTH_OPERATION_CONFIG = {
  handler: createRealIntegrationOperationHandler(SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID),
  quickReasons: INTEGRATION_REFRESH_HEALTH_QUICK_REASONS,
  applyAccountsTokenValidationResult: true,
  recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_INTEGRATION_RELOAD_CATEGORIES,
  buildHandlerContext: ({ metadata, accountsSync }) =>
    extractIntegrationHandlerContext(metadata, accountsSync),
  devLog: {
    started: "integration_health_refresh_started",
    completed: "integration_health_refresh_completed",
    failed: "integration_health_refresh_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      connection_health: data.connection_health,
      refreshedAt: data.refreshedAt,
      auditId: data.auditId ?? null,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      accountId: metadata?.accountId ?? null,
    }),
  },
  operationalLog: {
    event: "integration_health_refreshed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      accountId: metadata?.accountId ?? null,
      auditId: data.auditId ?? null,
      reasonLength,
      timestamp: data.refreshedAt,
    }),
  },
  feedback: {
    success: {
      title: "Saúde atualizada",
      description: "Snapshot de saúde persistido e painéis recarregados.",
    },
    error: {
      title: "Falha ao atualizar saúde",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/**
 * @param {string | null | undefined} actionId
 */
export function isSellerToolboxIntegrationOperationActionId(actionId) {
  return SELLER_TOOLBOX_INTEGRATION_OPERATION_ACTION_IDS.includes(String(actionId ?? ""));
}
