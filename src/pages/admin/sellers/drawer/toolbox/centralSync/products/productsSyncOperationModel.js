import {
  SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID,
  executeFakeSearchProduct,
} from "./sellerToolboxSearchProductOperation";
import {
  SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID,
  executeFakeReprocessProductListingLink,
} from "./sellerToolboxReprocessProductListingLinkOperation";

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const PRODUCTS_SYNC_REPROCESS_LINK_QUICK_REASONS = [
  { key: "sku_listing_divergence", label: "Divergência SKU ↔ anúncio", prefix: "Divergência SKU ↔ anúncio: " },
  { key: "link_rebuild", label: "Rebuild de vínculo", prefix: "Rebuild de vínculo: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "manual_review", label: "Conferência manual", prefix: "Conferência manual: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

export const PRODUCTS_SYNC_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_SEARCH_PRODUCT_ACTION_ID,
  SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID,
];

export const PRODUCTS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_REPROCESS_PRODUCT_LISTING_LINK_ACTION_ID,
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ product?: import("./productsSyncModel").ProductsSyncViewModel | null }} productsSync
 */
export function extractProductsSyncHandlerContext(metadata, productsSync) {
  const product = productsSync?.product ?? null;
  return {
    productId: String(metadata?.productId ?? product?.productId ?? "").trim(),
    sku: String(metadata?.sku ?? product?.sku ?? "").trim(),
    linkedListingsCount: product?.linkedListingsCount ?? metadata?.linkedListingsCount ?? null,
    previousLinkStatus: product?.listingLinkStatus ?? metadata?.previousLinkStatus ?? null,
  };
}

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const PRODUCTS_SYNC_SEARCH_OPERATION_CONFIG = {
  handler: executeFakeSearchProduct,
  requiresReason: false,
  applyProductsSyncSearchResult: true,
  buildHandlerContext: ({ metadata }) => ({
    query: String(metadata?.query ?? "").trim(),
  }),
  devLog: {
    started: "product_search_started",
    completed: "product_search_completed",
    failed: "product_search_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      sku: metadata?.query ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      productId: data.product?.productId ?? null,
      sku: data.product?.sku ?? null,
      linkedListingsCount: data.product?.linkedListingsCount ?? null,
      searchedAt: data.searchedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      sku: metadata?.query ?? null,
    }),
  },
  operationalLog: {
    event: "product_searched",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      productId: data.product?.productId ?? metadata?.productId ?? null,
      sku: data.product?.sku ?? metadata?.query ?? null,
      sellerId: metadata?.sellerId ?? null,
      linkedListingsCount: data.product?.linkedListingsCount ?? null,
      reasonLength,
      timestamp: data.searchedAt,
    }),
  },
  feedback: {
    success: {
      title: "Produto encontrado",
      description: "Resultado operacional carregado localmente — nenhuma consulta real foi feita.",
    },
    error: {
      title: "Falha na busca",
      description: "Não foi possível concluir a busca fake. Tente novamente.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const PRODUCTS_SYNC_REPROCESS_LINK_OPERATION_CONFIG = {
  handler: executeFakeReprocessProductListingLink,
  quickReasons: PRODUCTS_SYNC_REPROCESS_LINK_QUICK_REASONS,
  applyProductsListingLinkReprocessResult: true,
  buildHandlerContext: ({ metadata, productsSync }) =>
    extractProductsSyncHandlerContext(metadata, productsSync),
  devLog: {
    started: "product_listing_link_reprocess_started",
    completed: "product_listing_link_reprocess_completed",
    failed: "product_listing_link_reprocess_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      productId: metadata?.productId ?? null,
      sku: metadata?.sku ?? null,
      linkedListingsCount: metadata?.linkedListingsCount ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newLinkStatus: data.newLinkStatus,
      linkedListingsProcessed: data.linkedListingsProcessed,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      sku: metadata?.sku ?? null,
    }),
  },
  operationalLog: {
    event: "product_listing_link_reprocessed",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      productId: metadata?.productId ?? null,
      sku: metadata?.sku ?? null,
      sellerId: metadata?.sellerId ?? null,
      linkedListingsCount: data.linkedListingsProcessed ?? metadata?.linkedListingsCount ?? null,
      reasonLength,
      timestamp: data.reprocessedAt,
    }),
  },
  feedback: {
    success: {
      title: "Vínculos reprocessados (simulado)",
      description: "Status de vínculo atualizado localmente — nenhum rebuild real foi executado.",
    },
    error: {
      title: "Falha ao reprocessar vínculos",
      description: "Não foi possível concluir o reprocessamento fake.",
    },
  },
};
