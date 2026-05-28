import {
  SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID,
} from "./sellerToolboxEnableFeatureFlagOperation";
import {
  SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID,
} from "./sellerToolboxDisableFeatureFlagOperation";
import { createRealFeatureFlagOperationHandler } from "./sellerToolboxFeatureFlagApiOperations";
import { DEV_CENTER_CATEGORIAS_RELOAD } from "../../../../../../components/devCenter/operational/devCenterOperationalReloadModel";

/** @type {string[]} */
export const SELLER_TOOLBOX_REAL_FEATURE_FLAG_RELOAD_CATEGORIES = [
  DEV_CENTER_CATEGORIAS_RELOAD.FEATURE_FLAGS,
  DEV_CENTER_CATEGORIAS_RELOAD.TOOLBOX,
  DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
  DEV_CENTER_CATEGORIAS_RELOAD.TIMELINE,
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_QUICK_REASONS = [
  {
    key: "beta_release",
    label: "Liberação beta",
    prefix: "Liberação beta: ",
  },
  {
    key: "commercial_release",
    label: "Liberação comercial",
    prefix: "Liberação comercial: ",
  },
  {
    key: "operational_adjustment",
    label: "Ajuste operacional",
    prefix: "Ajuste operacional: ",
  },
  {
    key: "internal_validation",
    label: "Validação interna",
    prefix: "Validação interna: ",
  },
  {
    key: "seller_support",
    label: "Suporte ao seller",
    prefix: "Suporte ao seller: ",
  },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_QUICK_REASONS = [
  {
    key: "beta_closure",
    label: "Encerramento de beta",
    prefix: "Encerramento de beta: ",
  },
  {
    key: "operational_adjustment",
    label: "Ajuste operacional",
    prefix: "Ajuste operacional: ",
  },
  {
    key: "preventive_rollback",
    label: "Rollback preventivo",
    prefix: "Rollback preventivo: ",
  },
  {
    key: "internal_request",
    label: "Solicitação interna",
    prefix: "Solicitação interna: ",
  },
  {
    key: "seller_support",
    label: "Suporte ao seller",
    prefix: "Suporte ao seller: ",
  },
];

export const SELLER_TOOLBOX_FEATURE_FLAG_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID,
  SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID,
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 */
export function extractFeatureFlagHandlerContext(metadata) {
  return {
    flagKey: String(metadata?.flagKey ?? "").trim(),
    previousEnabled: metadata?.previousEnabled === true,
    flagLabel: String(metadata?.flagLabel ?? "").trim(),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 */
export function extractEnableFeatureFlagHandlerContext(metadata) {
  return extractFeatureFlagHandlerContext(metadata);
}

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_OPERATION_CONFIG = {
  handler: createRealFeatureFlagOperationHandler(SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID),
  quickReasons: SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_QUICK_REASONS,
  applyFeatureFlagResult: true,
  recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_FEATURE_FLAG_RELOAD_CATEGORIES,
  buildHandlerContext: ({ metadata }) => extractEnableFeatureFlagHandlerContext(metadata),
  devLog: {
    started: "feature_flag_enable_started",
    completed: "feature_flag_enable_completed",
    failed: "feature_flag_enable_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      flagKey: metadata?.flagKey ?? null,
      flagLabel: metadata?.flagLabel ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      flagKey: data.flagKey,
      enabled: data.enabled,
      updatedAt: data.updatedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      flagKey: metadata?.flagKey ?? null,
      flagLabel: metadata?.flagLabel ?? null,
    }),
  },
  operationalLog: {
    event: "feature_flag_enabled",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      flagKey: data.flagKey,
      flagLabel: metadata?.flagLabel ?? null,
      reasonLength,
      previousEnabled: metadata?.previousEnabled === true,
      newEnabled: true,
      updatedAt: data.updatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Feature flag ativada",
      description: "Estado persistido no backend e painéis recarregados.",
    },
    error: {
      title: "Falha ao ativar feature flag",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_OPERATION_CONFIG = {
  handler: createRealFeatureFlagOperationHandler(SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID),
  quickReasons: SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_QUICK_REASONS,
  applyFeatureFlagResult: true,
  recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_FEATURE_FLAG_RELOAD_CATEGORIES,
  buildHandlerContext: ({ metadata }) => extractFeatureFlagHandlerContext(metadata),
  devLog: {
    started: "feature_flag_disable_started",
    completed: "feature_flag_disable_completed",
    failed: "feature_flag_disable_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      flagKey: metadata?.flagKey ?? null,
      flagLabel: metadata?.flagLabel ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      flagKey: data.flagKey,
      enabled: data.enabled,
      updatedAt: data.updatedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      flagKey: metadata?.flagKey ?? null,
      flagLabel: metadata?.flagLabel ?? null,
    }),
  },
  operationalLog: {
    event: "feature_flag_disabled",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      flagKey: data.flagKey,
      flagLabel: metadata?.flagLabel ?? null,
      reasonLength,
      previousEnabled: true,
      newEnabled: false,
      updatedAt: data.updatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Feature flag desativada",
      description: "Estado persistido no backend e painéis recarregados.",
    },
    error: {
      title: "Falha ao desativar feature flag",
      description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
    },
  },
};

/**
 * @param {string | null | undefined} actionId
 */
export function isSellerToolboxFeatureFlagOperationActionId(actionId) {
  return SELLER_TOOLBOX_FEATURE_FLAG_OPERATION_ACTION_IDS.includes(String(actionId ?? ""));
}
