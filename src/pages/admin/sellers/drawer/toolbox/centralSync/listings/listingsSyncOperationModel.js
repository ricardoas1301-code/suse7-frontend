import {
  SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID,
  executeFakeSearchListing,
} from "./sellerToolboxSearchListingOperation";
import {
  SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID,
  executeFakeReimportListing,
} from "./sellerToolboxReimportListingOperation";
import {
  SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID,
  executeFakeRecalculateListingHealth,
} from "./sellerToolboxRecalculateListingHealthOperation";

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const LISTINGS_SYNC_REIMPORT_QUICK_REASONS = [
  { key: "inconsistent_listing", label: "Anúncio inconsistente", prefix: "Anúncio inconsistente: " },
  { key: "manual_reimport", label: "Reimportação manual", prefix: "Reimportação manual: " },
  { key: "operational_adjustment", label: "Ajuste operacional", prefix: "Ajuste operacional: " },
  { key: "internal_review", label: "Conferência interna", prefix: "Conferência interna: " },
  { key: "seller_support", label: "Suporte ao seller", prefix: "Suporte ao seller: " },
];

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxOperationQuickReason[]} */
export const LISTINGS_SYNC_RECALCULATE_HEALTH_QUICK_REASONS = [
  { key: "health_divergence", label: "Divergência na saúde do anúncio", prefix: "Divergência na saúde do anúncio: " },
  { key: "manual_reprocess", label: "Reprocessamento manual", prefix: "Reprocessamento manual: " },
  { key: "post_sync_adjustment", label: "Ajuste pós-sync", prefix: "Ajuste pós-sync: " },
  { key: "operational_review", label: "Conferência operacional", prefix: "Conferência operacional: " },
  { key: "internal_validation", label: "Validação interna", prefix: "Validação interna: " },
];

export const LISTINGS_SYNC_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_SEARCH_LISTING_ACTION_ID,
  SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID,
];

export const LISTINGS_SYNC_CONTEXTUAL_OPERATION_ACTION_IDS = [
  SELLER_TOOLBOX_REIMPORT_LISTING_ACTION_ID,
  SELLER_TOOLBOX_RECALCULATE_LISTING_HEALTH_ACTION_ID,
];

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 * @param {{ listing?: import("./listingsSyncModel").ListingsSyncViewModel | null }} listingsSync
 */
export function extractListingsSyncHandlerContext(metadata, listingsSync) {
  const listing = listingsSync?.listing ?? null;
  return {
    listingId: String(metadata?.listingId ?? listing?.listingId ?? "").trim(),
    sku: String(metadata?.sku ?? listing?.sku ?? "").trim(),
    marketplace: String(metadata?.marketplace ?? listing?.marketplace ?? "").trim(),
    previousHealthScore: listing?.healthScore ?? metadata?.previousHealthScore ?? null,
  };
}

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const LISTINGS_SYNC_SEARCH_OPERATION_CONFIG = {
  handler: executeFakeSearchListing,
  requiresReason: false,
  applyListingsSyncSearchResult: true,
  buildHandlerContext: ({ metadata }) => ({
    query: String(metadata?.query ?? "").trim(),
  }),
  devLog: {
    started: "listing_search_started",
    completed: "listing_search_completed",
    failed: "listing_search_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      listingId: metadata?.listingId ?? null,
      sku: metadata?.sku ?? null,
      query: metadata?.query ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      listingId: data.listing?.listingId ?? null,
      sku: data.listing?.sku ?? null,
      marketplace: data.listing?.marketplace ?? null,
      searchedAt: data.searchedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      query: metadata?.query ?? null,
    }),
  },
  operationalLog: {
    event: "listing_searched",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      listingId: data.listing?.listingId ?? metadata?.listingId ?? null,
      sku: data.listing?.sku ?? metadata?.sku ?? null,
      marketplace: data.listing?.marketplace ?? metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.searchedAt,
    }),
  },
  feedback: {
    success: {
      title: "Anúncio encontrado",
      description: "Resultado operacional carregado localmente — nenhuma consulta real foi feita.",
    },
    error: {
      title: "Falha na busca",
      description: "Não foi possível concluir a busca fake. Tente novamente.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const LISTINGS_SYNC_REIMPORT_OPERATION_CONFIG = {
  handler: executeFakeReimportListing,
  quickReasons: LISTINGS_SYNC_REIMPORT_QUICK_REASONS,
  applyListingsReimportResult: true,
  buildHandlerContext: ({ metadata, listingsSync }) =>
    extractListingsSyncHandlerContext(metadata, listingsSync),
  devLog: {
    started: "listing_reimport_started",
    completed: "listing_reimport_completed",
    failed: "listing_reimport_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      listingId: metadata?.listingId ?? null,
      sku: metadata?.sku ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      reimportedAt: data.reimportedAt,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      listingId: metadata?.listingId ?? null,
    }),
  },
  operationalLog: {
    event: "listing_reimported",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      listingId: metadata?.listingId ?? null,
      sku: metadata?.sku ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.reimportedAt,
    }),
  },
  feedback: {
    success: {
      title: "Anúncio reimportado (simulado)",
      description: "Reimportação fake concluída — nenhum dado real foi alterado.",
    },
    error: {
      title: "Falha ao reimportar anúncio",
      description: "Não foi possível concluir a reimportação fake.",
    },
  },
};

/** @type {import("../../subscription/sellerToolboxSubscriptionOperationModel").SellerToolboxSubscriptionOperationConfig} */
export const LISTINGS_SYNC_RECALCULATE_HEALTH_OPERATION_CONFIG = {
  handler: executeFakeRecalculateListingHealth,
  quickReasons: LISTINGS_SYNC_RECALCULATE_HEALTH_QUICK_REASONS,
  applyListingsHealthRecalculateResult: true,
  buildHandlerContext: ({ metadata, listingsSync }) =>
    extractListingsSyncHandlerContext(metadata, listingsSync),
  devLog: {
    started: "listing_health_recalculate_started",
    completed: "listing_health_recalculate_completed",
    failed: "listing_health_recalculate_failed",
    buildStartedPayload: (sellerId, metadata) => ({
      sellerId,
      listingId: metadata?.listingId ?? null,
      sku: metadata?.sku ?? null,
      marketplace: metadata?.marketplace ?? null,
    }),
    buildCompletedPayload: (sellerId, data) => ({
      sellerId,
      newHealthScore: data.newHealthScore,
    }),
    buildFailedPayload: (sellerId, metadata) => ({
      sellerId,
      listingId: metadata?.listingId ?? null,
    }),
  },
  operationalLog: {
    event: "listing_health_recalculated",
    buildMetadata: (data, reasonLength, actionId, metadata) => ({
      actionId,
      listingId: metadata?.listingId ?? null,
      sku: metadata?.sku ?? null,
      marketplace: metadata?.marketplace ?? null,
      sellerId: metadata?.sellerId ?? null,
      reasonLength,
      timestamp: data.recalculatedAt,
    }),
  },
  feedback: {
    success: {
      title: "Saúde recalculada (simulado)",
      description: "Score atualizado localmente — nenhum recálculo real foi executado.",
    },
    error: {
      title: "Falha ao recalcular saúde",
      description: "Não foi possível concluir o recálculo fake.",
    },
  },
};
