import {
  SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID,
  executeFakeRefreshSeller,
} from "./sellerToolboxRefreshSellerOperation";
import {
  SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID,
  executeFakeClearOperationalCache,
} from "./sellerToolboxClearOperationalCacheOperation";
import {
  SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID,
  executeFakeReloadPanelData,
} from "./sellerToolboxReloadPanelDataOperation";

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_REFRESH_SELLER_QUICK_REASONS = [
  {
    key: "stale_data",
    label: "Dados desatualizados",
    prefix: "Dados desatualizados: ",
  },
  {
    key: "operational_review",
    label: "Conferência operacional",
    prefix: "Conferência operacional: ",
  },
  {
    key: "post_sync_adjustment",
    label: "Ajuste após sincronização",
    prefix: "Ajuste após sincronização: ",
  },
  {
    key: "seller_support",
    label: "Suporte ao seller",
    prefix: "Suporte ao seller: ",
  },
  {
    key: "internal_validation",
    label: "Validação interna",
    prefix: "Validação interna: ",
  },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_QUICK_REASONS = [
  {
    key: "inconsistent_data",
    label: "Dados inconsistentes",
    prefix: "Dados inconsistentes: ",
  },
  {
    key: "operational_review",
    label: "Conferência operacional",
    prefix: "Conferência operacional: ",
  },
  {
    key: "post_update_adjustment",
    label: "Ajuste após atualização",
    prefix: "Ajuste após atualização: ",
  },
  {
    key: "seller_support",
    label: "Suporte ao seller",
    prefix: "Suporte ao seller: ",
  },
  {
    key: "internal_validation",
    label: "Validação interna",
    prefix: "Validação interna: ",
  },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_RELOAD_PANEL_DATA_QUICK_REASONS = [
  {
    key: "stale_panel_data",
    label: "Dados desatualizados no painel",
    prefix: "Dados desatualizados no painel: ",
  },
  {
    key: "operational_review",
    label: "Conferência operacional",
    prefix: "Conferência operacional: ",
  },
  {
    key: "post_refresh_adjustment",
    label: "Ajuste após refresh",
    prefix: "Ajuste após refresh: ",
  },
  {
    key: "seller_support",
    label: "Suporte ao seller",
    prefix: "Suporte ao seller: ",
  },
  {
    key: "internal_validation",
    label: "Validação interna",
    prefix: "Validação interna: ",
  },
];

export const SELLER_TOOLBOX_CACHE_REFRESH_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID,
  SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID,
  SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID,
];

/**
 * @param {{
 *   metadata?: Record<string, unknown> | null;
 *   cacheRefresh?: {
 *     lastRefreshedAt?: string | null;
 *     lastClearedAt?: string | null;
 *     lastReloadedAt?: string | null;
 *   } | null;
 * }} input
 */
export function extractRefreshSellerHandlerContext(input) {
  return {
    sellerName: String(input.metadata?.sellerName ?? "").trim(),
    previousRefreshedAt: input.cacheRefresh?.lastRefreshedAt ?? null,
  };
}

/**
 * @param {{
 *   metadata?: Record<string, unknown> | null;
 *   cacheRefresh?: { lastClearedAt?: string | null } | null;
 * }} input
 */
export function extractClearOperationalCacheHandlerContext(input) {
  return {
    sellerName: String(input.metadata?.sellerName ?? "").trim(),
    previousClearedAt: input.cacheRefresh?.lastClearedAt ?? null,
  };
}

/**
 * @param {{
 *   metadata?: Record<string, unknown> | null;
 *   cacheRefresh?: { lastReloadedAt?: string | null } | null;
 * }} input
 */
export function extractReloadPanelDataHandlerContext(input) {
  return {
    sellerName: String(input.metadata?.sellerName ?? "").trim(),
    previousReloadedAt: input.cacheRefresh?.lastReloadedAt ?? null,
  };
}

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SELLER_TOOLBOX_REFRESH_SELLER_OPERATION_CONFIG = {
  handler: executeFakeRefreshSeller,
  quickReasons: SELLER_TOOLBOX_REFRESH_SELLER_QUICK_REASONS,
  applyCacheRefreshResult: true,
  buildHandlerContext: ({ metadata, cacheRefresh }) =>
    extractRefreshSellerHandlerContext({ metadata, cacheRefresh }),
  devLog: {
    started: "seller_refresh_started",
    completed: "seller_refresh_completed",
    failed: "seller_refresh_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      sellerName: metadata?.sellerName ?? null,
      previousRefreshedAt: metadata?.previousRefreshedAt ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      refreshedAt: data.refreshedAt,
      refreshedScopes: data.refreshedScopes,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      sellerName: metadata?.sellerName ?? null,
      previousRefreshedAt: metadata?.previousRefreshedAt ?? null,
    }),
  },
  operationalLog: {
    event: "seller_refreshed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      sellerId: metadata?.sellerId ?? null,
      sellerName: metadata?.sellerName ?? null,
      reasonLength,
      previousRefreshedAt: metadata?.previousRefreshedAt ?? null,
      refreshedAt: data.refreshedAt,
      refreshedScopes: data.refreshedScopes,
    }),
  },
  feedback: {
    success: {
      title: "Dados do seller atualizados com sucesso.",
      description: "Simulação concluída — nenhum dado real foi alterado.",
    },
    error: {
      title: "Falha ao atualizar dados",
      description: "Não foi possível concluir o refresh fake. Nenhum dado foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_OPERATION_CONFIG = {
  handler: executeFakeClearOperationalCache,
  quickReasons: SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_QUICK_REASONS,
  applyCacheClearResult: true,
  buildHandlerContext: ({ metadata, cacheRefresh }) =>
    extractClearOperationalCacheHandlerContext({ metadata, cacheRefresh }),
  devLog: {
    started: "operational_cache_clear_started",
    completed: "operational_cache_clear_completed",
    failed: "operational_cache_clear_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      sellerName: metadata?.sellerName ?? null,
      previousClearedAt: metadata?.previousClearedAt ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      clearedAt: data.clearedAt,
      clearedScopes: data.clearedScopes,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      sellerName: metadata?.sellerName ?? null,
      previousClearedAt: metadata?.previousClearedAt ?? null,
    }),
  },
  operationalLog: {
    event: "operational_cache_cleared",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      sellerId: metadata?.sellerId ?? null,
      sellerName: metadata?.sellerName ?? null,
      reasonLength,
      previousClearedAt: metadata?.previousClearedAt ?? null,
      clearedAt: data.clearedAt,
      clearedScopes: data.clearedScopes,
    }),
  },
  feedback: {
    success: {
      title: "Cache operacional limpo com sucesso.",
      description: "Simulação concluída — nenhum cache real foi alterado.",
    },
    error: {
      title: "Falha ao limpar cache",
      description: "Não foi possível concluir a limpeza fake. Nenhum dado foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SELLER_TOOLBOX_RELOAD_PANEL_DATA_OPERATION_CONFIG = {
  handler: executeFakeReloadPanelData,
  quickReasons: SELLER_TOOLBOX_RELOAD_PANEL_DATA_QUICK_REASONS,
  applyCacheReloadResult: true,
  buildHandlerContext: ({ metadata, cacheRefresh }) =>
    extractReloadPanelDataHandlerContext({ metadata, cacheRefresh }),
  devLog: {
    started: "panel_data_reload_started",
    completed: "panel_data_reload_completed",
    failed: "panel_data_reload_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      sellerName: metadata?.sellerName ?? null,
      previousReloadedAt: metadata?.previousReloadedAt ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      reloadedAt: data.reloadedAt,
      reloadedPanels: data.reloadedPanels,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      sellerName: metadata?.sellerName ?? null,
      previousReloadedAt: metadata?.previousReloadedAt ?? null,
    }),
  },
  operationalLog: {
    event: "panel_data_reloaded",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      sellerId: metadata?.sellerId ?? null,
      sellerName: metadata?.sellerName ?? null,
      reasonLength,
      previousReloadedAt: metadata?.previousReloadedAt ?? null,
      reloadedAt: data.reloadedAt,
      reloadedPanels: data.reloadedPanels,
    }),
  },
  feedback: {
    success: {
      title: "Dados do painel recarregados com sucesso.",
      description: "Simulação concluída — nenhum dado real foi alterado.",
    },
    error: {
      title: "Falha ao recarregar painel",
      description: "Não foi possível concluir o recarregamento fake. Nenhum dado foi alterado.",
    },
  },
};

/**
 * @param {string | null | undefined} actionId
 */
export function isSellerToolboxCacheRefreshOperationActionId(actionId) {
  return SELLER_TOOLBOX_CACHE_REFRESH_OPERATION_ACTION_IDS.includes(String(actionId ?? ""));
}
