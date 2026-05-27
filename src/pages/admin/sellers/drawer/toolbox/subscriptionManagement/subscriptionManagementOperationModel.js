import {
  SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID,
  executeFakeChangeSubscriptionPlan,
} from "./sellerToolboxChangePlanOperation";
import {
  SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID,
  executeFakeEditSubscriptionPrice,
} from "./sellerToolboxEditSubscriptionPriceOperation";
import {
  SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID,
  executeFakeAdjustSalesLimit,
} from "./sellerToolboxAdjustSalesLimitOperation";
import {
  SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID,
  executeFakeCorrectCycleConsumption,
} from "./sellerToolboxCorrectCycleConsumptionOperation";

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_QUICK_REASONS = [
  { key: "commercial_upgrade", label: "Upgrade comercial", prefix: "Upgrade comercial: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
  { key: "manual_migration", label: "Migração manual", prefix: "Migração manual: " },
  { key: "admin_correction", label: "Correção administrativa", prefix: "Correção administrativa: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_EDIT_PRICE_QUICK_REASONS = [
  { key: "commercial_adjustment", label: "Ajuste comercial", prefix: "Ajuste comercial: " },
  { key: "special_condition", label: "Condição especial", prefix: "Condição especial: " },
  { key: "admin_correction", label: "Correção administrativa", prefix: "Correção administrativa: " },
  { key: "premium_support", label: "Suporte premium", prefix: "Suporte premium: " },
  { key: "manual_upgrade", label: "Upgrade manual", prefix: "Upgrade manual: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_ADJUST_LIMIT_QUICK_REASONS = [
  { key: "operational_expansion", label: "Expansão operacional", prefix: "Expansão operacional: " },
  { key: "commercial_upgrade", label: "Upgrade comercial", prefix: "Upgrade comercial: " },
  { key: "manual_adjustment", label: "Ajuste manual", prefix: "Ajuste manual: " },
  { key: "strategic_support", label: "Suporte estratégico", prefix: "Suporte estratégico: " },
  { key: "admin_correction", label: "Correção administrativa", prefix: "Correção administrativa: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_CORRECT_CONSUMPTION_QUICK_REASONS = [
  { key: "operational_divergence", label: "Divergência operacional", prefix: "Divergência operacional: " },
  { key: "manual_correction", label: "Correção manual", prefix: "Correção manual: " },
  { key: "post_sync_adjustment", label: "Ajuste pós-sync", prefix: "Ajuste pós-sync: " },
  { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

export const SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID,
  SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID,
  SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID,
  SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID,
];

/**
 * @param {string | null | undefined} actionId
 */
export function isSubscriptionManagementOperationActionId(actionId) {
  return SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS.includes(String(actionId ?? ""));
}

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ currentState?: import("./subscriptionManagementModel").SubscriptionManagementStateViewModel | null }} subscriptionManagement
 */
export function extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement) {
  const state = subscriptionManagement?.currentState ?? null;
  return {
    currentPlan: String(metadata?.currentPlan ?? state?.currentPlan ?? "").trim(),
    subscriptionPrice: Number(metadata?.subscriptionPrice ?? state?.subscriptionPrice ?? 0),
    salesLimit: Number(metadata?.salesLimit ?? state?.salesLimit ?? 0),
    currentConsumption: Number(metadata?.currentConsumption ?? state?.currentConsumption ?? 0),
  };
}

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_OPERATION_CONFIG = {
  handler: executeFakeChangeSubscriptionPlan,
  quickReasons: SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_QUICK_REASONS,
  applySubscriptionManagementResult: true,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "subscription_plan_change_started",
    completed: "subscription_plan_change_completed",
    failed: "subscription_plan_change_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      currentPlan: metadata?.currentPlan ?? null,
      newPlan: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      currentPlan: data.previousPlan,
      newPlan: data.newPlan,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      currentPlan: metadata?.currentPlan ?? null,
      newPlan: null,
    }),
  },
  operationalLog: {
    event: "subscription_plan_changed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      currentPlan: data.previousPlan,
      newPlan: data.newPlan,
      previousValue: data.previousPlan,
      newValue: data.newPlan,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Plano alterado (simulado)",
      description: "Estado local atualizado — nenhuma assinatura real foi alterada.",
    },
    error: {
      title: "Falha ao alterar plano",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_EDIT_PRICE_OPERATION_CONFIG = {
  handler: executeFakeEditSubscriptionPrice,
  quickReasons: SUBSCRIPTION_MANAGEMENT_EDIT_PRICE_QUICK_REASONS,
  applySubscriptionManagementResult: true,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "subscription_price_edit_started",
    completed: "subscription_price_edit_completed",
    failed: "subscription_price_edit_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.subscriptionPrice ?? null,
      newValue: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      previousValue: data.previousPrice,
      newValue: data.newPrice,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.subscriptionPrice ?? null,
      newValue: null,
    }),
  },
  operationalLog: {
    event: "subscription_price_edited",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      previousValue: data.previousPrice,
      newValue: data.newPrice,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Valor editado (simulado)",
      description: "Estado local atualizado — nenhuma cobrança real foi alterada.",
    },
    error: {
      title: "Falha ao editar valor",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_ADJUST_LIMIT_OPERATION_CONFIG = {
  handler: executeFakeAdjustSalesLimit,
  quickReasons: SUBSCRIPTION_MANAGEMENT_ADJUST_LIMIT_QUICK_REASONS,
  applySubscriptionManagementResult: true,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "sales_limit_adjust_started",
    completed: "sales_limit_adjust_completed",
    failed: "sales_limit_adjust_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.salesLimit ?? null,
      newValue: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      previousValue: data.previousLimit,
      newValue: data.newLimit,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.salesLimit ?? null,
      newValue: null,
    }),
  },
  operationalLog: {
    event: "sales_limit_adjusted",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      previousValue: data.previousLimit,
      newValue: data.newLimit,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Limite ajustado (simulado)",
      description: "Estado local atualizado — nenhum limite real foi alterado.",
    },
    error: {
      title: "Falha ao ajustar limite",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_CORRECT_CONSUMPTION_OPERATION_CONFIG = {
  handler: executeFakeCorrectCycleConsumption,
  quickReasons: SUBSCRIPTION_MANAGEMENT_CORRECT_CONSUMPTION_QUICK_REASONS,
  applySubscriptionManagementResult: true,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "cycle_consumption_correct_started",
    completed: "cycle_consumption_correct_completed",
    failed: "cycle_consumption_correct_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.currentConsumption ?? null,
      newValue: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      previousValue: data.previousConsumption,
      newValue: data.newConsumption,
      remainingSales: data.remainingSales,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.currentConsumption ?? null,
      newValue: null,
    }),
  },
  operationalLog: {
    event: "cycle_consumption_corrected",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      previousValue: data.previousConsumption,
      newValue: data.newConsumption,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Consumo corrigido (simulado)",
      description: "Estado local atualizado — nenhum consumo real foi alterado.",
    },
    error: {
      title: "Falha ao corrigir consumo",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};
