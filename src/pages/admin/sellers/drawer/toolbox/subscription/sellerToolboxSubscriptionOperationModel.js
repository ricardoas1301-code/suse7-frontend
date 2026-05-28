import { SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID } from "./sellerToolboxAddExtraDaysOperation";
import { SELLER_TOOLBOX_ADD_SUBSCRIPTION_SALES_ACTION_ID } from "./sellerToolboxAddExtraSalesOperation";
import { SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID } from "./sellerToolboxEnableTrialOperation";
import { SELLER_TOOLBOX_END_TRIAL_ACTION_ID } from "./sellerToolboxEndTrialOperation";
import { SELLER_TOOLBOX_RESET_CONSUMPTION_ACTION_ID } from "./sellerToolboxResetConsumptionOperation";
import { SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID } from "./sellerToolboxRecalculateConsumptionOperation";
import { createRealSubscriptionOperationHandler } from "./sellerToolboxSubscriptionApiOperations";
import { DEV_CENTER_CATEGORIAS_RELOAD } from "../../../../../../components/devCenter/operational/devCenterOperationalReloadModel";
import {
  SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID,
} from "../featureFlags/sellerToolboxEnableFeatureFlagOperation";
import {
  SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID,
} from "../featureFlags/sellerToolboxDisableFeatureFlagOperation";
import {
  SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_OPERATION_CONFIG,
  SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_OPERATION_CONFIG,
} from "../featureFlags/sellerToolboxFeatureFlagOperationModel";
import {
  SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID,
} from "../cacheRefresh/sellerToolboxRefreshSellerOperation";
import {
  SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID,
} from "../cacheRefresh/sellerToolboxClearOperationalCacheOperation";
import {
  SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID,
} from "../cacheRefresh/sellerToolboxReloadPanelDataOperation";
import {
  SELLER_TOOLBOX_REFRESH_SELLER_OPERATION_CONFIG,
  SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_OPERATION_CONFIG,
  SELLER_TOOLBOX_RELOAD_PANEL_DATA_OPERATION_CONFIG,
} from "../cacheRefresh/sellerToolboxCacheRefreshOperationModel";
import {
  SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID,
} from "../centralSync/sales/sellerToolboxSearchSaleOperation";
import {
  SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID,
} from "../centralSync/sales/sellerToolboxReimportSaleOperation";
import {
  SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID,
} from "../centralSync/sales/sellerToolboxRecalculateSaleFinancialOperation";
import {
  SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID,
} from "../centralSync/sales/sellerToolboxReprocessSaleCustomerOperation";
import {
  SALES_SYNC_SEARCH_SALE_OPERATION_CONFIG,
  SALES_SYNC_REIMPORT_SALE_OPERATION_CONFIG,
  SALES_SYNC_RECALCULATE_FINANCIAL_OPERATION_CONFIG,
  SALES_SYNC_REPROCESS_CUSTOMER_OPERATION_CONFIG,
} from "../centralSync/sales/salesSyncOperationModel";
import {
  SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID,
} from "../centralSync/listings/sellerToolboxSearchListingOperation";
import {
  SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID,
} from "../centralSync/listings/sellerToolboxReimportListingOperation";
import {
  SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID,
} from "../centralSync/listings/sellerToolboxRecalculateListingHealthOperation";
import {
  LISTINGS_SYNC_SEARCH_OPERATION_CONFIG,
  LISTINGS_SYNC_REIMPORT_OPERATION_CONFIG,
  LISTINGS_SYNC_RECALCULATE_HEALTH_OPERATION_CONFIG,
} from "../centralSync/listings/listingsSyncOperationModel";
import {
  SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID,
} from "../centralSync/products/sellerToolboxSearchProductOperation";
import {
  SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID,
} from "../centralSync/products/sellerToolboxReprocessProductListingLinkOperation";
import {
  PRODUCTS_SYNC_SEARCH_OPERATION_CONFIG,
  PRODUCTS_SYNC_REPROCESS_LINK_OPERATION_CONFIG,
} from "../centralSync/products/productsSyncOperationModel";
import {
  SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID,
} from "../centralSync/customers/sellerToolboxSearchCustomerOperation";
import {
  SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID,
} from "../centralSync/customers/sellerToolboxReprocessCustomer360Operation";
import {
  CUSTOMERS_SYNC_SEARCH_OPERATION_CONFIG,
  CUSTOMERS_SYNC_REPROCESS_360_OPERATION_CONFIG,
} from "../centralSync/customers/customersSyncOperationModel";
import {
  SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
} from "../centralSync/accounts/sellerToolboxSearchMarketplaceAccountOperation";
import {
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
} from "../centralSync/accounts/sellerToolboxValidateMarketplaceTokenOperation";
import {
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
} from "../centralSync/accounts/sellerToolboxForceMarketplaceSyncOperation";
import {
  ACCOUNTS_SYNC_SEARCH_OPERATION_CONFIG,
} from "../centralSync/accounts/accountsSyncOperationModel";
import {
  INTEGRATION_VALIDATE_TOKEN_OPERATION_CONFIG,
  INTEGRATION_FORCE_SYNC_OPERATION_CONFIG,
  INTEGRATION_REIMPORT_ACCOUNT_OPERATION_CONFIG,
  INTEGRATION_INVALIDATE_CACHE_OPERATION_CONFIG,
  INTEGRATION_REFRESH_HEALTH_OPERATION_CONFIG,
} from "../integrations/sellerToolboxIntegrationOperationModel";
import { SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID } from "../integrations/sellerToolboxReimportMarketplaceAccountOperation";
import { SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID } from "../integrations/sellerToolboxInvalidateIntegrationCacheOperation";
import { SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID } from "../integrations/sellerToolboxRefreshIntegrationHealthOperation";
import {
  SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxChangePlanOperation";
import {
  SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxEditSubscriptionPriceOperation";
import {
  SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxAdjustSalesLimitOperation";
import {
  SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxCorrectCycleConsumptionOperation";
import {
  SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxChangeBillingCycleOperation";
import {
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxManageSubscriptionStatusOperation";
import {
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID,
} from "../subscriptionManagement/sellerToolboxManageSubscriptionBenefitsOperation";
import {
  SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_OPERATION_CONFIG,
  SUBSCRIPTION_MANAGEMENT_EDIT_PRICE_OPERATION_CONFIG,
  SUBSCRIPTION_MANAGEMENT_ADJUST_LIMIT_OPERATION_CONFIG,
  SUBSCRIPTION_MANAGEMENT_CORRECT_CONSUMPTION_OPERATION_CONFIG,
  SUBSCRIPTION_MANAGEMENT_CHANGE_BILLING_CYCLE_OPERATION_CONFIG,
  SUBSCRIPTION_MANAGEMENT_MANAGE_STATUS_OPERATION_CONFIG,
  SUBSCRIPTION_MANAGEMENT_MANAGE_BENEFITS_OPERATION_CONFIG,
} from "../subscriptionManagement/subscriptionManagementOperationModel";

export const SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_QUICK_REASON_KEYS = new Set([
  "operational_fix",
  "seller_request",
  "internal_test",
  "other",
]);

/** @type {string[]} */
export const SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES = [
  DEV_CENTER_CATEGORIAS_RELOAD.ASSINATURA,
  DEV_CENTER_CATEGORIAS_RELOAD.RESUMO_SELLER,
];

/** @type {Set<string>} */
export const SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_ACTION_IDS = new Set([
  SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID,
  SELLER_TOOLBOX_ADD_SUBSCRIPTION_SALES_ACTION_ID,
  SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID,
  SELLER_TOOLBOX_END_TRIAL_ACTION_ID,
  SELLER_TOOLBOX_RESET_CONSUMPTION_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID,
  SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID,
  SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID,
  SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID,
  SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID,
  SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID,
  SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID,
  SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID,
  SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID,
  SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID,
  SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID,
  SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID,
  SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID,
  SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID,
  SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID,
  SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID,
  SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID,
  SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID,
  SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID,
  SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID,
  SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID,
  SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID,
  SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID,
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID,
  SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID,
]);

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   prefix: string;
 * }} SellerToolboxOperationQuickReason
 */

/** @type {SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_ENABLE_TRIAL_QUICK_REASONS = [
  {
    key: "commercial_recovery",
    label: "Recuperação comercial",
    prefix: "Recuperação comercial: ",
  },
  {
    key: "new_onboarding",
    label: "Novo onboarding",
    prefix: "Novo onboarding: ",
  },
  {
    key: "operational_adjustment",
    label: "Ajuste operacional",
    prefix: "Ajuste operacional: ",
  },
  {
    key: "internal_approval",
    label: "Aprovação interna",
    prefix: "Aprovação interna: ",
  },
];

/** @type {SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_END_TRIAL_QUICK_REASONS = [
  {
    key: "admin_closure",
    label: "Encerramento administrativo",
    prefix: "Encerramento administrativo: ",
  },
  {
    key: "requested_closure",
    label: "Encerramento solicitado",
    prefix: "Encerramento solicitado: ",
  },
  {
    key: "test_completed",
    label: "Teste concluído",
    prefix: "Teste concluído: ",
  },
  {
    key: "operational_adjustment",
    label: "Ajuste operacional",
    prefix: "Ajuste operacional: ",
  },
];

/** @type {SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_RESET_CONSUMPTION_QUICK_REASONS = [
  {
    key: "operational_fix",
    label: "Correção operacional",
    prefix: "Correção operacional: ",
  },
  {
    key: "admin_adjustment",
    label: "Ajuste administrativo",
    prefix: "Ajuste administrativo: ",
  },
  {
    key: "cycle_restart",
    label: "Reinício de ciclo",
    prefix: "Reinício de ciclo: ",
  },
  {
    key: "dev_environment",
    label: "Ambiente DEV",
    prefix: "Ambiente DEV: ",
  },
  {
    key: "internal_validation",
    label: "Validação interna",
    prefix: "Validação interna: ",
  },
];

/** @type {SellerToolboxOperationQuickReason[]} */
export const SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_QUICK_REASONS = [
  {
    key: "cycle_reprocess",
    label: "Reprocessamento do ciclo",
    prefix: "Reprocessamento do ciclo: ",
  },
  {
    key: "operational_review",
    label: "Conferência operacional",
    prefix: "Conferência operacional: ",
  },
  {
    key: "perceived_divergence",
    label: "Divergência percebida",
    prefix: "Divergência percebida: ",
  },
  {
    key: "internal_validation",
    label: "Validação interna",
    prefix: "Validação interna: ",
  },
  {
    key: "post_sync_adjustment",
    label: "Ajuste pós-sincronização",
    prefix: "Ajuste pós-sincronização: ",
  },
];

/**
 * @typedef {{
 *   title: string;
 *   description: string;
 * }} SellerToolboxSubscriptionOperationFeedbackCopy
 */

/**
 * @typedef {{
 *   handler: (context: import("./sellerToolboxAddExtraDaysOperation").SellerToolboxSubscriptionOperationContext) => Promise<Record<string, unknown>>;
 *   quickReasons?: SellerToolboxOperationQuickReason[];
 *   applyConsumptionResult?: boolean;
 *   applyFeatureFlagResult?: boolean;
 *   applyCacheRefreshResult?: boolean;
 *   applyCacheClearResult?: boolean;
 *   applyCacheReloadResult?: boolean;
 *   applySalesSyncSearchResult?: boolean;
 *   applySalesReimportResult?: boolean;
 *   applySalesFinancialRecalculateResult?: boolean;
 *   applySalesCustomerReprocessResult?: boolean;
 *   applyListingsSyncSearchResult?: boolean;
 *   applyListingsReimportResult?: boolean;
 *   applyListingsHealthRecalculateResult?: boolean;
 *   applyProductsSyncSearchResult?: boolean;
 *   applyProductsListingLinkReprocessResult?: boolean;
 *   applyCustomersSyncSearchResult?: boolean;
 *   applyCustomers360ReprocessResult?: boolean;
 *   applyAccountsSyncSearchResult?: boolean;
 *   applyAccountsTokenValidationResult?: boolean;
 *   applyAccountsForceSyncResult?: boolean;
 *   applySubscriptionManagementResult?: boolean;
 *   recarregarCategoriasOperacionais?: string[];
 *   recarregarPorPaineisDoResultado?: boolean;
 *   requiresAdministrativeReason?: boolean;
 *   requiresMandatoryPreview?: boolean;
 *   requiresReason?: boolean;
 *   buildHandlerContext?: (input: {
 *     consumption: import("./sellerToolboxConsumptionModel").SellerConsumptionViewModel | null;
 *     subscriptionManagement?: {
 *       currentState?: import("../subscriptionManagement/subscriptionManagementModel").SubscriptionManagementStateViewModel | null;
 *     } | null;
 *     cacheRefresh?: {
 *       lastRefreshedAt?: string | null;
 *       refreshedScopes?: string[];
 *       lastClearedAt?: string | null;
 *       clearedScopes?: string[];
 *       lastReloadedAt?: string | null;
 *       reloadedPanels?: string[];
 *     } | null;
 *     salesSync?: { sale?: import("../centralSync/sales/salesSyncModel").SalesSyncViewModel | null } | null;
 *     listingsSync?: { listing?: import("../centralSync/listings/listingsSyncModel").ListingsSyncViewModel | null } | null;
 *     productsSync?: { product?: import("../centralSync/products/productsSyncModel").ProductsSyncViewModel | null } | null;
 *     customersSync?: { customer?: import("../centralSync/customers/customersSyncModel").CustomersSyncViewModel | null } | null;
 *     accountsSync?: { account?: import("../centralSync/accounts/accountsSyncModel").AccountsSyncViewModel | null } | null;
 *     metadata?: Record<string, unknown> | null;
 *   }) => Record<string, unknown>;
 *   devLog: {
 *     started: string;
 *     completed: string;
 *     failed: string | null;
 *     buildStartedPayload: (sellerId: string, metadata?: Record<string, unknown>) => Record<string, unknown>;
 *     buildCompletedPayload: (sellerId: string, data: Record<string, unknown>) => Record<string, unknown>;
 *     buildFailedPayload: (sellerId: string, metadata?: Record<string, unknown>) => Record<string, unknown>;
 *   };
 *   operationalLog: {
 *     event: string;
 *     buildMetadata: (
 *       data: Record<string, unknown>,
 *       reasonLength: number,
 *       actionId: string,
 *       metadata?: Record<string, unknown> | null,
 *     ) => Record<string, unknown>;
 *   };
 *   feedback: {
 *     success: SellerToolboxSubscriptionOperationFeedbackCopy;
 *     error: SellerToolboxSubscriptionOperationFeedbackCopy;
 *   };
 * }} SellerToolboxSubscriptionOperationConfig
 */

/** @type {Record<string, SellerToolboxSubscriptionOperationConfig>} */
export const SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_REGISTRY = {
  [SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID]: {
    handler: createRealSubscriptionOperationHandler(SELLER_TOOLBOX_ADD_SUBSCRIPTION_DAYS_ACTION_ID),
    recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES,
    devLog: {
      started: "subscription_add_days_started",
      completed: "subscription_add_days_completed",
      failed: null,
      buildStartedPayload: (sellerId) => ({ sellerId, daysAdded: null }),
      buildCompletedPayload: (sellerId, data) => ({
        sellerId,
        daysAdded: data.addedDays,
      }),
      buildFailedPayload: (sellerId) => ({ sellerId, daysAdded: null }),
    },
    operationalLog: {
      event: "subscription_add_days",
      buildMetadata: (data, reasonLength, actionId) => ({
        actionId,
        daysAdded: data.addedDays,
        reasonLength,
      }),
    },
    feedback: {
      success: {
        title: "Dias extras adicionados",
        description: "Assinatura atualizada e painéis recarregados sem perder contexto.",
      },
      error: {
        title: "Falha ao adicionar dias",
        description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
      },
    },
  },
  [SELLER_TOOLBOX_ADD_SUBSCRIPTION_SALES_ACTION_ID]: {
    handler: createRealSubscriptionOperationHandler(SELLER_TOOLBOX_ADD_SUBSCRIPTION_SALES_ACTION_ID),
    recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES,
    devLog: {
      started: "subscription_add_sales_started",
      completed: "subscription_add_sales_completed",
      failed: "subscription_add_sales_failed",
      buildStartedPayload: (sellerId) => ({ sellerId, salesAdded: null }),
      buildCompletedPayload: (sellerId, data) => ({
        sellerId,
        salesAdded: data.addedSales,
      }),
      buildFailedPayload: (sellerId) => ({ sellerId, salesAdded: null }),
    },
    operationalLog: {
      event: "subscription_add_sales",
      buildMetadata: (data, reasonLength, actionId) => ({
        actionId,
        salesAdded: data.addedSales,
        reasonLength,
      }),
    },
    feedback: {
      success: {
        title: "Vendas extras adicionadas",
        description: "Bônus operacional persistido e painéis recarregados.",
      },
      error: {
        title: "Falha ao adicionar vendas extras",
        description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
      },
    },
  },
  [SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID]: {
    handler: createRealSubscriptionOperationHandler(SELLER_TOOLBOX_ENABLE_TRIAL_ACTION_ID),
    quickReasons: SELLER_TOOLBOX_ENABLE_TRIAL_QUICK_REASONS,
    recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES,
    devLog: {
      started: "trial_enable_started",
      completed: "trial_enable_completed",
      failed: "trial_enable_failed",
      buildStartedPayload: (sellerId) => ({ sellerId, trialStatus: null }),
      buildCompletedPayload: (sellerId, data) => ({
        sellerId,
        trialStatus: data.trialStatus,
      }),
      buildFailedPayload: (sellerId) => ({ sellerId, trialStatus: null }),
    },
    operationalLog: {
      event: "trial_enabled",
      buildMetadata: (data, reasonLength, actionId) => ({
        actionId,
        reasonLength,
        trialStatus: data.trialStatus,
      }),
    },
    feedback: {
      success: {
        title: "Trial liberado",
        description: "Período de trial persistido no backend e painéis atualizados.",
      },
      error: {
        title: "Falha ao liberar trial",
        description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
      },
    },
  },
  [SELLER_TOOLBOX_END_TRIAL_ACTION_ID]: {
    handler: createRealSubscriptionOperationHandler(SELLER_TOOLBOX_END_TRIAL_ACTION_ID),
    quickReasons: SELLER_TOOLBOX_END_TRIAL_QUICK_REASONS,
    recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES,
    devLog: {
      started: "trial_end_started",
      completed: "trial_end_completed",
      failed: "trial_end_failed",
      buildStartedPayload: (sellerId) => ({ sellerId, trialStatus: null }),
      buildCompletedPayload: (sellerId, data) => ({
        sellerId,
        trialStatus: data.trialStatus,
      }),
      buildFailedPayload: (sellerId) => ({ sellerId, trialStatus: null }),
    },
    operationalLog: {
      event: "trial_ended",
      buildMetadata: (data, reasonLength, actionId) => ({
        actionId,
        reasonLength,
        trialStatus: data.trialStatus,
      }),
    },
    feedback: {
      success: {
        title: "Trial encerrado",
        description: "Encerramento persistido no backend e painéis atualizados.",
      },
      error: {
        title: "Falha ao encerrar trial",
        description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
      },
    },
  },
  [SELLER_TOOLBOX_RESET_CONSUMPTION_ACTION_ID]: {
    handler: createRealSubscriptionOperationHandler(SELLER_TOOLBOX_RESET_CONSUMPTION_ACTION_ID),
    quickReasons: SELLER_TOOLBOX_RESET_CONSUMPTION_QUICK_REASONS,
    recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES,
    devLog: {
      started: "consumption_reset_started",
      completed: "consumption_reset_completed",
      failed: "consumption_reset_failed",
      buildStartedPayload: (sellerId) => ({ sellerId, previousConsumed: null, newConsumed: null }),
      buildCompletedPayload: (sellerId, data) => ({
        sellerId,
        previousConsumed: data.previousConsumed,
        newConsumed: data.newConsumed,
      }),
      buildFailedPayload: (sellerId) => ({ sellerId, previousConsumed: null, newConsumed: null }),
    },
    operationalLog: {
      event: "consumption_reset",
      buildMetadata: (data, reasonLength, actionId) => ({
        actionId,
        reasonLength,
        previousConsumed: data.previousConsumed,
        newConsumed: data.newConsumed,
      }),
    },
    feedback: {
      success: {
        title: "Consumo resetado",
        description: "Consumo do ciclo zerado no backend e painéis recarregados.",
      },
      error: {
        title: "Falha ao resetar consumo",
        description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
      },
    },
  },
  [SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID]: {
    handler: createRealSubscriptionOperationHandler(SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_ACTION_ID),
    quickReasons: SELLER_TOOLBOX_RECALCULATE_CONSUMPTION_QUICK_REASONS,
    recarregarCategoriasOperacionais: SELLER_TOOLBOX_REAL_SUBSCRIPTION_RELOAD_CATEGORIES,
    devLog: {
      started: "consumption_recalculate_started",
      completed: "consumption_recalculate_completed",
      failed: "consumption_recalculate_failed",
      buildStartedPayload: (sellerId) => ({ sellerId, previousConsumed: null, newConsumed: null }),
      buildCompletedPayload: (sellerId, data) => ({
        sellerId,
        previousConsumed: data.previousConsumed,
        newConsumed: data.newConsumed,
      }),
      buildFailedPayload: (sellerId) => ({ sellerId, previousConsumed: null, newConsumed: null }),
    },
    operationalLog: {
      event: "consumption_recalculated",
      buildMetadata: (data, reasonLength, actionId) => ({
        actionId,
        reasonLength,
        previousConsumed: data.previousConsumed,
        newConsumed: data.newConsumed,
        monthlyLimit: data.monthlyLimit,
        recalculatedAt: data.recalculatedAt,
      }),
    },
    feedback: {
      success: {
        title: "Consumo recalculado",
        description: "Consumo reprocessado no backend e painéis recarregados.",
      },
      error: {
        title: "Falha ao recalcular consumo",
        description: "Não foi possível concluir a operação. Nenhuma alteração foi persistida.",
      },
    },
  },
  [SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_ACTION_ID]: SELLER_TOOLBOX_ENABLE_FEATURE_FLAG_OPERATION_CONFIG,
  [SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_ACTION_ID]: SELLER_TOOLBOX_DISABLE_FEATURE_FLAG_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REFRESH_SELLER_ACTION_ID]: SELLER_TOOLBOX_REFRESH_SELLER_OPERATION_CONFIG,
  [SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_ACTION_ID]:
    SELLER_TOOLBOX_CLEAR_OPERATIONAL_CACHE_OPERATION_CONFIG,
  [SELLER_TOOLBOX_RELOAD_PANEL_DATA_ACTION_ID]: SELLER_TOOLBOX_RELOAD_PANEL_DATA_OPERATION_CONFIG,
  [SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID]: SALES_SYNC_SEARCH_SALE_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID]: SALES_SYNC_REIMPORT_SALE_OPERATION_CONFIG,
  [SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID]: SALES_SYNC_RECALCULATE_FINANCIAL_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID]: SALES_SYNC_REPROCESS_CUSTOMER_OPERATION_CONFIG,
  [SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID]: LISTINGS_SYNC_SEARCH_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID]: LISTINGS_SYNC_REIMPORT_OPERATION_CONFIG,
  [SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID]: LISTINGS_SYNC_RECALCULATE_HEALTH_OPERATION_CONFIG,
  [SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID]: PRODUCTS_SYNC_SEARCH_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID]: PRODUCTS_SYNC_REPROCESS_LINK_OPERATION_CONFIG,
  [SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID]: CUSTOMERS_SYNC_SEARCH_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID]: CUSTOMERS_SYNC_REPROCESS_360_OPERATION_CONFIG,
  [SELLER_TOOLBOX_SEARCH_MARKETPLACE_ACCOUNT_ACTION_ID]: ACCOUNTS_SYNC_SEARCH_OPERATION_CONFIG,
  [SELLER_TOOLBOX_VALIDATE_MARKETPLACE_TOKEN_ACTION_ID]: INTEGRATION_VALIDATE_TOKEN_OPERATION_CONFIG,
  [SELLER_TOOLBOX_FORCE_MARKETPLACE_SYNC_ACTION_ID]: INTEGRATION_FORCE_SYNC_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REIMPORT_MARKETPLACE_ACCOUNT_ACTION_ID]: INTEGRATION_REIMPORT_ACCOUNT_OPERATION_CONFIG,
  [SELLER_TOOLBOX_INVALIDATE_INTEGRATION_CACHE_ACTION_ID]: INTEGRATION_INVALIDATE_CACHE_OPERATION_CONFIG,
  [SELLER_TOOLBOX_REFRESH_INTEGRATION_HEALTH_ACTION_ID]: INTEGRATION_REFRESH_HEALTH_OPERATION_CONFIG,
  [SELLER_TOOLBOX_CHANGE_SUBSCRIPTION_PLAN_ACTION_ID]: SUBSCRIPTION_MANAGEMENT_CHANGE_PLAN_OPERATION_CONFIG,
  [SELLER_TOOLBOX_EDIT_SUBSCRIPTION_PRICE_ACTION_ID]: SUBSCRIPTION_MANAGEMENT_EDIT_PRICE_OPERATION_CONFIG,
  [SELLER_TOOLBOX_ADJUST_SALES_LIMIT_ACTION_ID]: SUBSCRIPTION_MANAGEMENT_ADJUST_LIMIT_OPERATION_CONFIG,
  [SELLER_TOOLBOX_CORRECT_CYCLE_CONSUMPTION_ACTION_ID]:
    SUBSCRIPTION_MANAGEMENT_CORRECT_CONSUMPTION_OPERATION_CONFIG,
  [SELLER_TOOLBOX_CHANGE_BILLING_CYCLE_ACTION_ID]:
    SUBSCRIPTION_MANAGEMENT_CHANGE_BILLING_CYCLE_OPERATION_CONFIG,
  [SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_STATUS_ACTION_ID]:
    SUBSCRIPTION_MANAGEMENT_MANAGE_STATUS_OPERATION_CONFIG,
  [SELLER_TOOLBOX_MANAGE_SUBSCRIPTION_BENEFITS_ACTION_ID]:
    SUBSCRIPTION_MANAGEMENT_MANAGE_BENEFITS_OPERATION_CONFIG,
};

/**
 * @param {string | null | undefined} actionId
 */
export function isSellerToolboxSubscriptionOperationActionId(actionId) {
  return SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_ACTION_IDS.has(String(actionId ?? ""));
}

/**
 * @param {string | null | undefined} actionId
 * @returns {SellerToolboxSubscriptionOperationConfig | null}
 */
export function getSellerToolboxSubscriptionOperationConfig(actionId) {
  const normalizedActionId = String(actionId ?? "").trim();
  if (!normalizedActionId) return null;
  return SELLER_TOOLBOX_SUBSCRIPTION_OPERATION_REGISTRY[normalizedActionId] ?? null;
}

/**
 * @param {string | null | undefined} actionId
 * @returns {SellerToolboxOperationQuickReason[]}
 */
export function getSellerToolboxSubscriptionOperationQuickReasons(actionId) {
  const config = getSellerToolboxSubscriptionOperationConfig(actionId);
  if (config?.quickReasons?.length) return config.quickReasons;
  return [];
}
