import {
  SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID,
  executeFakeSearchSale,
} from "./sellerToolboxSearchSaleOperation";
import {
  SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID,
  executeFakeReimportSale,
} from "./sellerToolboxReimportSaleOperation";
import {
  SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID,
  executeFakeRecalculateSaleFinancial,
} from "./sellerToolboxRecalculateSaleFinancialOperation";
import {
  SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID,
  executeFakeReprocessSaleCustomer,
} from "./sellerToolboxReprocessSaleCustomerOperation";

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SALES_SYNC_REIMPORT_SALE_QUICK_REASONS = [
  { key: "inconsistent_sale", label: "Venda inconsistente", prefix: "Venda inconsistente: " },
  { key: "manual_reimport", label: "Reimportação manual", prefix: "Reimportação manual: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SALES_SYNC_RECALCULATE_FINANCIAL_QUICK_REASONS = [
  { key: "financial_divergence", label: "Divergência financeira", prefix: "Divergência financeira: " },
  { key: "manual_reprocess", label: "Reprocessamento manual", prefix: "Reprocessamento manual: " },
  { key: "post_sync_adjustment", label: "Ajuste pós-sync", prefix: "Ajuste pós-sync: " },
  { key: "operational_review", label: "Conferência operacional", prefix: "Conferência operacional: " },
  { key: "internal_validation", label: "Validação interna", prefix: "Validação interna: " },
];

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const SALES_SYNC_REPROCESS_CUSTOMER_QUICK_REASONS = [
  { key: "incomplete_customer", label: "Cliente incompleto", prefix: "Cliente incompleto: " },
  { key: "rebuild_customer360", label: "Rebuild Cliente360", prefix: "Rebuild Cliente360: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "manual_review", label: "Conferência manual", prefix: "Conferência manual: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

export const SALES_SYNC_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_SEARCH_SALE_ACTION_ID,
  SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID,
];

export const SALES_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_REIMPORT_SALE_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_SALE_FINANCIAL_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_SALE_CUSTOMER_ACTION_ID,
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ sale?: import("./salesSyncModel").SalesSyncViewModel | null }} salesSync
 */
export function extractSalesSyncHandlerContext(metadata, salesSync) {
  const sale = salesSync?.sale ?? null;
  return {
    saleId: String(metadata?.saleId ?? sale?.saleId ?? "").trim(),
    marketplace: String(metadata?.marketplace ?? sale?.marketplace ?? "").trim(),
    previousNetAmount: sale?.netAmount ?? metadata?.previousNetAmount ?? null,
  };
}

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SALES_SYNC_SEARCH_SALE_OPERATION_CONFIG = {
  handler: executeFakeSearchSale,
  requiresReason: false,
  applySalesSyncSearchResult: true,
  buildHandlerContext: ({ metadata }) => ({
    saleId: String(metadata?.saleId ?? "").trim(),
  }),
  devLog: {
    started: "sale_search_started",
    completed: "sale_search_completed",
    failed: "sale_search_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      saleId: data.sale?.saleId ?? null,
      marketplace: data.sale?.marketplace ?? null,
      searchedAt: data.searchedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
    }),
  },
  operationalLog: {
    event: "sale_searched",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      saleId: data.sale?.saleId ?? metadata?.saleId ?? null,
      marketplace: data.sale?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.searchedAt,
    }),
  },
  feedback: {
    success: {
      title: "Venda encontrada",
      description: "Resultado operacional carregado localmente — nenhuma consulta real foi feita.",
    },
    error: {
      title: "Falha na busca",
      description: "Não foi possível concluir a busca fake. Tente novamente.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SALES_SYNC_REIMPORT_SALE_OPERATION_CONFIG = {
  handler: executeFakeReimportSale,
  quickReasons: SALES_SYNC_REIMPORT_SALE_QUICK_REASONS,
  applySalesReimportResult: true,
  buildHandlerContext: ({ metadata, salesSync }) =>
    extractSalesSyncHandlerContext(metadata, salesSync),
  devLog: {
    started: "sale_reimport_started",
    completed: "sale_reimport_completed",
    failed: "sale_reimport_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      saleId: data.saleId ?? null,
      reimportedAt: data.reimportedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
    }),
  },
  operationalLog: {
    event: "sale_reimported",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      saleId: metadata?.saleId ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.reimportedAt,
    }),
  },
  feedback: {
    success: {
      title: "Venda reimportada (simulado)",
      description: "Reimportação fake concluída — nenhum dado real foi alterado.",
    },
    error: {
      title: "Falha ao reimportar venda",
      description: "Não foi possível concluir a reimportação fake.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SALES_SYNC_RECALCULATE_FINANCIAL_OPERATION_CONFIG = {
  handler: executeFakeRecalculateSaleFinancial,
  quickReasons: SALES_SYNC_RECALCULATE_FINANCIAL_QUICK_REASONS,
  applySalesFinancialRecalculateResult: true,
  buildHandlerContext: ({ metadata, salesSync }) =>
    extractSalesSyncHandlerContext(metadata, salesSync),
  devLog: {
    started: "sale_financial_recalculate_started",
    completed: "sale_financial_recalculate_completed",
    failed: "sale_financial_recalculate_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newNetAmount: data.newNetAmount,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
    }),
  },
  operationalLog: {
    event: "sale_financial_recalculated",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      saleId: metadata?.saleId ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.recalculatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Financeiro recalculado (simulado)",
      description: "Valores atualizados localmente — nenhum recálculo real foi executado.",
    },
    error: {
      title: "Falha ao recalcular financeiro",
      description: "Não foi possível concluir o recálculo fake.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const SALES_SYNC_REPROCESS_CUSTOMER_OPERATION_CONFIG = {
  handler: executeFakeReprocessSaleCustomer,
  quickReasons: SALES_SYNC_REPROCESS_CUSTOMER_QUICK_REASONS,
  applySalesCustomerReprocessResult: true,
  buildHandlerContext: ({ metadata, salesSync }) =>
    extractSalesSyncHandlerContext(metadata, salesSync),
  devLog: {
    started: "sale_customer_reprocess_started",
    completed: "sale_customer_reprocess_completed",
    failed: "sale_customer_reprocess_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      customerStatus: data.customerStatus,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      saleId: metadata?.saleId ?? null,
    }),
  },
  operationalLog: {
    event: "sale_customer_reprocessed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      saleId: metadata?.saleId ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.customerReprocessedAt,
    }),
  },
  feedback: {
    success: {
      title: "Cliente reprocessado (simulado)",
      description: "Status do cliente atualizado localmente — nenhum rebuild real foi executado.",
    },
    error: {
      title: "Falha ao reprocessar cliente",
      description: "Não foi possível concluir o reprocessamento fake.",
    },
  },
};
