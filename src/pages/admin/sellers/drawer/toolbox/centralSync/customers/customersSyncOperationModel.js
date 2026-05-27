import {
  SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID,
  executeFakeSearchCustomer,
} from "./sellerToolboxSearchCustomerOperation";
import {
  SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID,
  executeFakeReprocessCustomer360,
} from "./sellerToolboxReprocessCustomer360Operation";

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const CUSTOMERS_SYNC_REPROCESS_360_QUICK_REASONS = [
  { key: "incomplete_customer", label: "Cliente incompleto", prefix: "Cliente incompleto: " },
  { key: "rebuild_customer360", label: "Rebuild Cliente360", prefix: "Rebuild Cliente360: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "manual_review", label: "Conferência manual", prefix: "Conferência manual: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

export const CUSTOMERS_SYNC_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_SEARCH_CUSTOMER_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID,
];

export const CUSTOMERS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_REPROCESS_CUSTOMER_360_ACTION_ID,
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ customer?: import("./customersSyncModel").CustomersSyncViewModel | null }} customersSync
 */
export function extractCustomersSyncHandlerContext(metadata, customersSync) {
  const customer = customersSync?.customer ?? null;
  return {
    customerId: String(metadata?.customerId ?? customer?.customerId ?? "").trim(),
    email: String(metadata?.customerEmail ?? customer?.email ?? "").trim(),
    phone: String(metadata?.customerPhone ?? customer?.phone ?? "").trim(),
    totalOrders: customer?.totalOrders ?? metadata?.totalOrders ?? null,
  };
}

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const CUSTOMERS_SYNC_SEARCH_OPERATION_CONFIG = {
  handler: executeFakeSearchCustomer,
  requiresReason: false,
  applyCustomersSyncSearchResult: true,
  buildHandlerContext: ({ metadata }) => ({
    query: String(metadata?.query ?? "").trim(),
  }),
  devLog: {
    started: "customer_search_started",
    completed: "customer_search_completed",
    failed: "customer_search_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      query: metadata?.query ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      customerId: data.customer?.customerId ?? null,
      customerEmail: data.customer?.email ?? null,
      totalOrders: data.customer?.totalOrders ?? null,
      searchedAt: data.searchedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      query: metadata?.query ?? null,
    }),
  },
  operationalLog: {
    event: "customer_searched",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      customerId: data.customer?.customerId ?? metadata?.customerId ?? null,
      customerEmail: data.customer?.email ?? metadata?.customerEmail ?? null,
      customerPhone: data.customer?.phone ?? metadata?.customerPhone ?? null,
      sellerId: metadata?.sellerId ?? null,
      totalOrders: data.customer?.totalOrders ?? metadata?.totalOrders ?? null,
      reasonLength,
      timestamp: data.searchedAt,
    }),
  },
  feedback: {
    success: {
      title: "Cliente encontrado",
      description: "Resultado operacional carregado localmente — nenhuma consulta real foi feita.",
    },
    error: {
      title: "Falha na busca",
      description: "Não foi possível concluir a busca fake. Tente novamente.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const CUSTOMERS_SYNC_REPROCESS_360_OPERATION_CONFIG = {
  handler: executeFakeReprocessCustomer360,
  quickReasons: CUSTOMERS_SYNC_REPROCESS_360_QUICK_REASONS,
  applyCustomers360ReprocessResult: true,
  buildHandlerContext: ({ metadata, customersSync }) =>
    extractCustomersSyncHandlerContext(metadata, customersSync),
  devLog: {
    started: "customer_360_reprocess_started",
    completed: "customer_360_reprocess_completed",
    failed: "customer_360_reprocess_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      customerId: metadata?.customerId ?? null,
      customerEmail: metadata?.customerEmail ?? null,
      totalOrders: metadata?.totalOrders ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newStatus: data.newStatus,
      salesProcessed: data.salesProcessed,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      customerId: metadata?.customerId ?? null,
    }),
  },
  operationalLog: {
    event: "customer_360_reprocessed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      customerId: metadata?.customerId ?? null,
      customerEmail: metadata?.customerEmail ?? null,
      customerPhone: metadata?.customerPhone ?? null,
      sellerId: metadata?.sellerId ?? null,
      totalOrders: data.salesProcessed ?? metadata?.totalOrders ?? null,
      reasonLength,
      timestamp: data.customer360ReprocessedAt,
    }),
  },
  feedback: {
    success: {
      title: "Cliente360 reprocessado (simulado)",
      description: "Status atualizado localmente — nenhum rebuild real foi executado.",
    },
    error: {
      title: "Falha ao reprocessar Cliente360",
      description: "Não foi possível concluir o reprocessamento fake.",
    },
  },
};
