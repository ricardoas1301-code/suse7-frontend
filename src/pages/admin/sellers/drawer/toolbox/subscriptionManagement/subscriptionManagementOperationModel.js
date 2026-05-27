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
import {
  SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID,
  executeFakeChangeBillingCycle,
} from "./sellerToolboxChangeBillingCycleOperation";
import {
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID,
  executeFakeManageSubscriptionStatus,
} from "./sellerToolboxManageSubscriptionStatusOperation";
import {
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID,
  executeFakeManageSubscriptionBenefits,
} from "./sellerToolboxManageSubscriptionBenefitsOperation";

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

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_CHANGE_BILLING_CYCLE_QUICK_REASONS = [
  { key: "commercial_migration", label: "Migração comercial", prefix: "Migração comercial: " },
  { key: "admin_adjustment", label: "Ajuste administrativo", prefix: "Ajuste administrativo: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
  { key: "operational_correction", label: "Correção operacional", prefix: "Correção operacional: " },
  { key: "annual_upgrade", label: "Upgrade anual", prefix: "Upgrade anual: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_MANAGE_STATUS_QUICK_REASONS = [
  { key: "admin_suspension", label: "Suspensão administrativa", prefix: "Suspensão administrativa: " },
  { key: "manual_reactivation", label: "Reativação manual", prefix: "Reativação manual: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "premium_support", label: "Suporte premium", prefix: "Suporte premium: " },
  { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
];

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SUBSCRIPTION_MANAGEMENT_MANAGE_BENEFITS_QUICK_REASONS = [
  { key: "manual_release", label: "Liberação manual", prefix: "Liberação manual: " },
  { key: "promotional_benefit", label: "Benefício promocional", prefix: "Benefício promocional: " },
  { key: "commercial_adjustment", label: "Ajuste comercial", prefix: "Ajuste comercial: " },
  { key: "operational_correction", label: "Correção operacional", prefix: "Correção operacional: " },
  { key: "strategic_support", label: "Suporte estratégico", prefix: "Suporte estratégico: " },
];

export const SUBSCRIPTION_MANAGEMENT_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID,
  SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID,
  SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID,
  SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID,
  SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID,
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID,
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID,
];

/** @type {{ requiresAdministrativeReason: true; requiresMandatoryPreview: true; applySubscriptionManagementResult: true }} */
export const SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS = {
  requiresAdministrativeReason: true,
  requiresMandatoryPreview: true,
  applySubscriptionManagementResult: true,
};

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
    billingCycle: String(metadata?.billingCycle ?? state?.billingCycle ?? "monthly").trim(),
    subscriptionStatus: String(metadata?.subscriptionStatus ?? state?.subscriptionStatus ?? "active").trim(),
    benefits: Array.isArray(metadata?.benefits)
      ? metadata.benefits.map((key) => String(key))
      : Array.isArray(state?.benefits)
        ? [...state.benefits]
        : [],
  };
}

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_OPERATION_CONFIG = {
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeChangeSubscriptionPlan,
  quickReasons: SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_QUICK_REASONS,
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
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeEditSubscriptionPrice,
  quickReasons: SUBSCRIPTION_MANAGEMENT_EDIT_PRICE_QUICK_REASONS,
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
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeAdjustSalesLimit,
  quickReasons: SUBSCRIPTION_MANAGEMENT_ADJUST_LIMIT_QUICK_REASONS,
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
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeCorrectCycleConsumption,
  quickReasons: SUBSCRIPTION_MANAGEMENT_CORRECT_CONSUMPTION_QUICK_REASONS,
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

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_CHANGE_BILLING_CYCLE_OPERATION_CONFIG = {
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeChangeBillingCycle,
  quickReasons: SUBSCRIPTION_MANAGEMENT_CHANGE_BILLING_CYCLE_QUICK_REASONS,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "billing_cycle_change_started",
    completed: "billing_cycle_change_completed",
    failed: "billing_cycle_change_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.billingCycle ?? null,
      newValue: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      previousValue: data.previousBillingCycle,
      newValue: data.newBillingCycle,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.billingCycle ?? null,
      newValue: null,
    }),
  },
  operationalLog: {
    event: "billing_cycle_changed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      previousValue: data.previousBillingCycle,
      newValue: data.newBillingCycle,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Ciclo alterado (simulado)",
      description: "Estado local atualizado — nenhum billing real foi alterado.",
    },
    error: {
      title: "Falha ao alterar ciclo",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_MANAGE_STATUS_OPERATION_CONFIG = {
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeManageSubscriptionStatus,
  quickReasons: SUBSCRIPTION_MANAGEMENT_MANAGE_STATUS_QUICK_REASONS,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "subscription_status_manage_started",
    completed: "subscription_status_manage_completed",
    failed: "subscription_status_manage_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.subscriptionStatus ?? null,
      newValue: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      previousValue: data.previousStatus,
      newValue: data.newStatus,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      previousValue: metadata?.subscriptionStatus ?? null,
      newValue: null,
    }),
  },
  operationalLog: {
    event: "subscription_status_managed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      previousValue: data.previousStatus,
      newValue: data.newStatus,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Status atualizado (simulado)",
      description: "Estado local atualizado — nenhuma assinatura real foi alterada.",
    },
    error: {
      title: "Falha ao alterar status",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};

/** @type {import("../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SUBSCRIPTION_MANAGEMENT_MANAGE_BENEFITS_OPERATION_CONFIG = {
  ...SUBSCRIPTION_MANAGEMENT_AUDIT_OPERATION_FLAGS,
  handler: executeFakeManageSubscriptionBenefits,
  quickReasons: SUBSCRIPTION_MANAGEMENT_MANAGE_BENEFITS_QUICK_REASONS,
  buildHandlerContext: ({ metadata, subscriptionManagement }) =>
    extractSubscriptionManagementHandlerContext(metadata, subscriptionManagement),
  devLog: {
    started: "subscription_benefits_manage_started",
    completed: "subscription_benefits_manage_completed",
    failed: "subscription_benefits_manage_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      benefitsCount: Array.isArray(metadata?.benefits) ? metadata.benefits.length : null,
      previousValue: null,
      newValue: null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      benefitsCount: Array.isArray(data.newBenefits) ? data.newBenefits.length : null,
      previousValue: data.benefitKey,
      newValue: data.action,
      timestamp: data.changedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      benefitsCount: Array.isArray(metadata?.benefits) ? metadata.benefits.length : null,
      previousValue: null,
      newValue: null,
    }),
  },
  operationalLog: {
    event: "subscription_benefits_managed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      sellerId: metadata?.sellerId ?? null,
      actionId,
      previousValue: data.benefitKey,
      newValue: data.action,
      benefitsCount: Array.isArray(data.newBenefits) ? data.newBenefits.length : null,
      reasonLength,
      timestamp: data.changedAt,
    }),
  },
  feedback: {
    success: {
      title: "Benefícios atualizados (simulado)",
      description: "Estado local atualizado — nenhum entitlement real foi alterado.",
    },
    error: {
      title: "Falha ao gerenciar benefícios",
      description: "Não foi possível concluir a simulação. Nenhum dado real foi alterado.",
    },
  },
};
