import { ATTENTION_REASON_SKU_PENDING_ML } from "../../../constants/listingAttention.js";
import { formatMarketplaceListingDisplayId } from "../../../utils/marketplaceListingId.js";
import { DASH } from "./catalogFormatters.js";
export {
  getListingProductLinkActions,
  isAnunciosCatalogRowPending,
  shouldShowCadastrarCustosListaRow,
} from "./listingProductLinkActions.js";

/** @param {string | null | undefined} status */
function mlStatusToUi(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return { statusKey: "active", statusLabel: "Ativo" };
  if (s === "paused") return { statusKey: "paused", statusLabel: "Pausado" };
  if (s === "closed") return { statusKey: "paused", statusLabel: "Encerrado" };
  if (s === "not_yet_active" || s === "inactive") return { statusKey: "paused", statusLabel: "Inativo" };
  return { statusKey: "active", statusLabel: status ? String(status) : "—" };
}

function pickString(...values) {
  for (const value of values) {
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return null;
}

function pickInt(...values) {
  for (const value of values) {
    if (value != null && Number.isFinite(Number(value))) return Math.trunc(Number(value));
  }
  return null;
}

import {
  hydrateCatalogRowCanonicalListingQuality,
  parseListingQualityScoreFromGridPayload,
} from "../domain/health/listingQualityHydration.js";

/** Payload consolidado GET /api/ml/listings (grid). */
/** @param {Record<string, unknown>} g */
export function mapGridApiToCatalogRow(g) {
  const { statusKey, statusLabel } = mlStatusToUi(/** @type {string} */ (g.status));
  const healthNum = g.health_percent != null ? Number(g.health_percent) : null;

  let healthBand = "unknown";
  let healthLabel = "Sem histórico";
  if (healthNum != null && Number.isFinite(healthNum)) {
    healthLabel = "Saúde ML";
    if (healthNum >= 70) healthBand = "healthy";
    else if (healthNum >= 40) healthBand = "warn";
    else healthBand = "loss";
  }

  const picN = g.pictures_count != null ? Number(g.pictures_count) : null;
  const varN = g.variations_count != null ? Number(g.variations_count) : null;

  const legacyMetrics =
    g.legacy_imported_orders_metrics != null && typeof g.legacy_imported_orders_metrics === "object"
      ? /** @type {{ qty_sold_total?: unknown; gross_revenue_brl?: unknown }} */ (g.legacy_imported_orders_metrics)
      : null;
  const salesCount = pickInt(
    g.qty_sold_total,
    legacyMetrics?.qty_sold_total,
    g.sold_quantity
  );
  const soldQtyMl =
    g.sold_quantity_ml_listing != null && Number.isFinite(Number(g.sold_quantity_ml_listing))
      ? Math.trunc(Number(g.sold_quantity_ml_listing))
      : null;
  const grossMissing = Boolean(g.gross_revenue_missing);
  const grossSalesRaw = pickString(
    g.gross_sales_brl,
    g.gross_revenue_brl,
    legacyMetrics?.gross_revenue_brl
  );
  const revenueNumeric =
    !grossMissing && grossSalesRaw != null ? Number(grossSalesRaw) : grossMissing ? 0 : Number(grossSalesRaw) || 0;

  const qScoreNum = parseListingQualityScoreFromGridPayload(g);
  const qStatus = g.health_listing_quality_status != null ? String(g.health_listing_quality_status) : null;
  const expStatus = g.health_experience_status != null ? String(g.health_experience_status) : null;

  const uiFlags = {};
  if ((healthNum != null && healthNum < 40) || /basic|bajo|baix/i.test(qStatus || "")) {
    uiFlags.needs_attention = true;
  }
  if (g.needs_attention) uiFlags.needs_attention = true;
  if (g.sku_pending) uiFlags.needs_attention = true;
  if (g.sku_dependency_pending) uiFlags.needs_attention = true;

  const attentionReason = g.attention_reason != null ? String(g.attention_reason) : null;
  const skuDependencyReason =
    g.sku_dependency_reason === "ml_missing_sku" ||
    g.sku_dependency_reason === "product_link_missing"
      ? String(g.sku_dependency_reason)
      : null;

  const visitsRaw = pickString(
    g.visits,
    g.visits_count,
    g.total_visits,
    g.listing_visits,
    g.metrics != null && typeof g.metrics === "object"
      ? /** @type {Record<string, unknown>} */ (g.metrics).visits
      : null
  );
  const visitsAbsent = Boolean(g.visits_absent) && visitsRaw == null;
  const visitCountForFilter = visitsAbsent || visitsRaw == null ? 0 : Number(visitsRaw) || 0;

  const m = String(g.marketplace || "");
  const marketplaceSlug = m === "mercado_livre" ? "mercadolivre" : m || "mercadolivre";

  const marketplaceAccountId =
    g.marketplace_account_id != null && String(g.marketplace_account_id).trim() !== ""
      ? String(g.marketplace_account_id).trim()
      : null;
  const accountAlias =
    g.account_alias != null && String(g.account_alias).trim() !== ""
      ? String(g.account_alias).trim()
      : g.ml_account_alias != null && String(g.ml_account_alias).trim() !== ""
        ? String(g.ml_account_alias).trim()
        : null;
  const accountLogoUrl =
    g.account_logo_url != null && String(g.account_logo_url).trim() !== ""
      ? String(g.account_logo_url).trim()
      : g.marketplace_account_logo_url != null && String(g.marketplace_account_logo_url).trim() !== ""
        ? String(g.marketplace_account_logo_url).trim()
        : null;
  const accountAvatarUrl =
    g.account_avatar_url != null && String(g.account_avatar_url).trim() !== ""
      ? String(g.account_avatar_url).trim()
      : null;
  const profileImageUrl =
    g.profile_image != null && String(g.profile_image).trim() !== ""
      ? String(g.profile_image).trim()
      : null;
  const sellerLogoUrl =
    g.seller_logo_url != null && String(g.seller_logo_url).trim() !== ""
      ? String(g.seller_logo_url).trim()
      : null;
  const storeLogoUrl =
    g.store_logo != null && String(g.store_logo).trim() !== ""
      ? String(g.store_logo).trim()
      : null;
  const companyLogoUrl =
    g.company_logo_url != null && String(g.company_logo_url).trim() !== ""
      ? String(g.company_logo_url).trim()
      : null;
  const sellerCompanyLogoUrl =
    g.seller_company_logo_url != null && String(g.seller_company_logo_url).trim() !== ""
      ? String(g.seller_company_logo_url).trim()
      : null;
  const marketplaceLabelDisplay =
    g.marketplace_label != null && String(g.marketplace_label).trim() !== ""
      ? String(g.marketplace_label).trim()
      : null;

  const sellerCompanyId =
    g.seller_company_id != null && String(g.seller_company_id).trim() !== ""
      ? String(g.seller_company_id).trim()
      : null;
  const companyName =
    g.company_name != null && String(g.company_name).trim() !== "" ? String(g.company_name).trim() : null;
  const companyDocumentMasked =
    g.company_document_masked != null && String(g.company_document_masked).trim() !== ""
      ? String(g.company_document_masked).trim()
      : null;

  const galleryImageUrls = Array.isArray(g.gallery_image_urls)
    ? /** @type {string[]} */ (g.gallery_image_urls).filter((u) => typeof u === "string" && u.trim() !== "")
    : [];

  const coverDirect = g.cover_image_url ?? g.cover_thumbnail_url;
  const coverTrimmed =
    coverDirect != null && String(coverDirect).trim() !== "" ? String(coverDirect).trim() : null;
  const coverThumbnailUrl = coverTrimmed ?? (galleryImageUrls[0] != null ? String(galleryImageUrls[0]).trim() : null);

  const catalogRow = {
    id: String(g.id),
    sku: g.sku != null && String(g.sku).trim() !== "" ? String(g.sku).trim() : null,
    adCount: 0,
    adTitle: g.title ? String(g.title) : DASH,
    picturesCount: picN != null && Number.isFinite(picN) ? picN : null,
    variationsCount: varN != null && Number.isFinite(varN) ? varN : null,
    productName: DASH,
    marketplaceSlug,
    marketplaceRaw: m,
    marketplaceLabelDisplay,
    marketplaceAccountId,
    accountAlias,
    accountLogoUrl,
    account_logo_url: accountLogoUrl,
    marketplace_account_logo_url:
      g.marketplace_account_logo_url != null && String(g.marketplace_account_logo_url).trim() !== ""
        ? String(g.marketplace_account_logo_url).trim()
        : null,
    account_avatar_url: accountAvatarUrl,
    profile_image: profileImageUrl,
    seller_logo_url: sellerLogoUrl,
    store_logo: storeLogoUrl,
    company_logo_url: companyLogoUrl,
    seller_company_logo_url: sellerCompanyLogoUrl,
    sellerCompanyId,
    companyName,
    companyDocumentMasked,
    productCost: 0,
    /**
     * Preço efetivo (margem/filtros internos): `effective_sale_price_brl`; se ausente na API,
     * usa `listing_price_brl` (anúncio sem promo — mesmo valor). Sem `price_brl` legado.
     */
    price: (() => {
      const effRaw = g.effective_sale_price_brl;
      if (effRaw != null && String(effRaw).trim() !== "") {
        const n = Number(effRaw);
        return Number.isFinite(n) ? n : null;
      }
      const listRaw = g.listing_price_brl;
      if (listRaw != null && String(listRaw).trim() !== "") {
        const n = Number(listRaw);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    })(),
    salesCount,
    soldQuantityMlListing: soldQtyMl,
    revenue: revenueNumeric,
    grossRevenueMissing: grossMissing,
    grossRevenueBrl: grossSalesRaw,
    grossSalesBrl: grossSalesRaw,
    contributionProfitBrl: pickString(g.contribution_profit_brl, g.net_profit_brl),
    netProfitBrl: pickString(g.net_profit_brl, g.contribution_profit_brl),
    contributionMarginPercent: pickString(g.contribution_margin_percent),
    averageTicketBrl: pickString(g.average_ticket_brl),
    youReceiveBrl: pickString(g.you_receive_brl, g.net_received_brl, g.net_revenue_total_brl, legacyMetrics?.net_revenue_total_brl),
    profit: 0,
    marginPct: 0,
    statusKey,
    statusLabel,
    listingStatusRaw: g.status != null ? String(g.status) : null,
    availableQuantity: pickInt(g.available_quantity),
    needsAttention: Boolean(g.needs_attention),
    healthBand,
    healthLabel,
    healthPercent: healthNum != null && Number.isFinite(healthNum) ? Math.round(healthNum) : null,
    externalId: g.external_listing_id ? String(g.external_listing_id) : "",
    listingNumber: g.external_listing_id ? String(g.external_listing_id) : DASH,
    listingNumberDisplay:
      g.external_listing_id != null && String(g.external_listing_id).trim() !== ""
        ? formatMarketplaceListingDisplayId(m, String(g.external_listing_id))
        : DASH,
    listingPermalink:
      g.permalink != null && String(g.permalink).trim() !== ""
        ? String(g.permalink).trim()
        : null,
    coverThumbnailUrl,
    visitCount: visitCountForFilter,
    visitsAbsent,
    visitsText: visitsRaw,
    netReceiveBrl:
      g.marketplace_payout_amount != null && String(g.marketplace_payout_amount).trim() !== ""
        ? String(g.marketplace_payout_amount)
        : null,
    marketplacePayoutSource:
      g.marketplace_payout_source != null && String(g.marketplace_payout_source).trim() !== ""
        ? String(g.marketplace_payout_source).trim()
        : "unresolved",
    /** Protocolo v1: payout e preço vêm dos campos explícitos; net_proceeds auxiliar para breakdown unitário. */
    netProceeds:
      g.net_proceeds != null && typeof g.net_proceeds === "object"
        ? /** @type {Record<string, unknown>} */ (g.net_proceeds)
        : null,
    commissionPercent: g.commission_percent != null ? String(g.commission_percent) : null,
    commissionAmountBrl: g.commission_amount_brl != null ? String(g.commission_amount_brl) : null,
    shippingCostBrl: g.shipping_cost_brl != null ? String(g.shipping_cost_brl) : null,
    shippingCostAmountBrl:
      g.shipping_cost_amount_brl != null && String(g.shipping_cost_amount_brl).trim() !== ""
        ? String(g.shipping_cost_amount_brl).trim()
        : null,
    shippingCostAmount:
      g.shipping_cost_amount != null && String(g.shipping_cost_amount).trim() !== ""
        ? String(g.shipping_cost_amount).trim()
        : null,
    shippingCostContext: (() => {
      const raw =
        g.ml_shipping_cost_context != null && String(g.ml_shipping_cost_context).trim() !== ""
          ? String(g.ml_shipping_cost_context).trim()
          : g.shipping_cost_context != null && String(g.shipping_cost_context).trim() !== ""
            ? String(g.shipping_cost_context).trim()
            : "";
      const s = raw.toLowerCase();
      if (s === "free_for_buyer" || s === "buyer_pays") return s;
      return null;
    })(),
    shippingCostLabel:
      g.shipping_cost_label != null && String(g.shipping_cost_label).trim() !== ""
        ? String(g.shipping_cost_label).trim()
        : null,
    shippingCostSource:
      g.shipping_cost_source != null && String(g.shipping_cost_source).trim() !== ""
        ? String(g.shipping_cost_source).trim()
        : null,
    promotionActive: g.promotion_active === true,
    promotionPriceBrl:
      g.promotion_active === true
        ? g.promotion_sale_price_brl != null && String(g.promotion_sale_price_brl).trim() !== ""
          ? String(g.promotion_sale_price_brl).trim()
          : g.promotional_price_brl != null
            ? String(g.promotional_price_brl)
            : null
        : null,
    effectiveSalePriceBrl:
      g.effective_sale_price_brl != null && String(g.effective_sale_price_brl).trim() !== ""
        ? String(g.effective_sale_price_brl).trim()
        : null,
    /**
     * Padrão oficial v13: `listing_sale_price_brl` (valor de venda base); fallback legado `listing_price_brl`.
     */
    listingSalePriceBrl:
      g.listing_sale_price_brl != null && String(g.listing_sale_price_brl).trim() !== ""
        ? String(g.listing_sale_price_brl).trim()
        : g.listing_price_brl != null && String(g.listing_price_brl).trim() !== ""
          ? String(g.listing_price_brl).trim()
          : g.list_or_original_price_brl != null && String(g.list_or_original_price_brl).trim() !== ""
            ? String(g.list_or_original_price_brl).trim()
            : null,
    promotionSalePriceBrl:
      g.promotion_sale_price_brl != null && String(g.promotion_sale_price_brl).trim() !== ""
        ? String(g.promotion_sale_price_brl).trim()
        : g.promotional_price_brl != null && String(g.promotional_price_brl).trim() !== ""
          ? String(g.promotional_price_brl).trim()
          : null,
    listingGridPriceEvidence:
      g.listing_grid_price_evidence != null && String(g.listing_grid_price_evidence).trim() !== ""
        ? String(g.listing_grid_price_evidence).trim()
        : null,
    /** Preço de catálogo — espelho de listingSalePriceBrl para compat. */
    listingPriceBrl:
      g.listing_sale_price_brl != null && String(g.listing_sale_price_brl).trim() !== ""
        ? String(g.listing_sale_price_brl).trim()
        : g.listing_price_brl != null && String(g.listing_price_brl).trim() !== ""
          ? String(g.listing_price_brl).trim()
          : g.list_or_original_price_brl != null && String(g.list_or_original_price_brl).trim() !== ""
            ? String(g.list_or_original_price_brl).trim()
            : null,
    listOrOriginalPriceBrl:
      g.listing_sale_price_brl != null && String(g.listing_sale_price_brl).trim() !== ""
        ? String(g.listing_sale_price_brl).trim()
        : g.listing_price_brl != null && String(g.listing_price_brl).trim() !== ""
          ? String(g.listing_price_brl).trim()
          : g.list_or_original_price_brl != null && String(g.list_or_original_price_brl).trim() !== ""
            ? String(g.list_or_original_price_brl).trim()
            : null,
    listingTypeLabel: g.listing_type_label != null ? String(g.listing_type_label) : null,
    listingTypeId: g.listing_type_id != null ? String(g.listing_type_id).trim() : null,
    listing_type_id: g.listing_type_id != null ? String(g.listing_type_id).trim() : null,
    wholesaleMinQuantity:
      g.wholesale_min_quantity != null && Number.isFinite(Number(g.wholesale_min_quantity))
        ? Math.trunc(Number(g.wholesale_min_quantity))
        : null,
    wholesalePriceBrl:
      g.wholesale_price_brl != null && String(g.wholesale_price_brl).trim() !== ""
        ? String(g.wholesale_price_brl).trim()
        : null,
    shippingLogisticType: g.health_shipping_logistic_type != null ? String(g.health_shipping_logistic_type) : null,
    listingTypeTooltip: g.listing_type_tooltip != null ? String(g.listing_type_tooltip) : null,
    listingQualityScore: qScoreNum,
    listingQualityStatus: qStatus,
    experienceStatus: expStatus,
    uiFlags,
    financialAnalysisBlocked: Boolean(g.financial_analysis_blocked),
    productCatalogCompleteness:
      g.product_catalog_completeness != null ? String(g.product_catalog_completeness) : null,
    financialAnalysisHint:
      g.financial_analysis_hint != null && String(g.financial_analysis_hint).trim() !== ""
        ? String(g.financial_analysis_hint).trim()
        : null,
    attentionReason,
    skuDependencyPending:
      typeof g.sku_dependency_pending === "boolean"
        ? g.sku_dependency_pending
        : undefined,
    skuDependencyReason,
    skuPending:
      attentionReason === ATTENTION_REASON_SKU_PENDING_ML || Boolean(g.sku_pending),
    /** URLs HTTP da tabela `marketplace_listing_pictures` (diagnóstico; ex.: /anuncios-2). */
    galleryImageUrls,
    /** @type {"marketplace_listing_pictures" | "raw_json.pictures" | "none" | null} */
    galleryImageSource:
      g.gallery_image_source === "marketplace_listing_pictures" ||
      g.gallery_image_source === "raw_json.pictures" ||
      g.gallery_image_source === "none"
        ? g.gallery_image_source
        : null,
    pricingContext:
      g.pricing_context != null && typeof g.pricing_context === "object"
        ? /** @type {Record<string, unknown>} */ (g.pricing_context)
        : null,
    pricingCurrentState:
      g.pricing_current_state != null && typeof g.pricing_current_state === "object"
        ? /** @type {Record<string, unknown>} */ (g.pricing_current_state)
        : null,
    productId:
      g.product_id != null && String(g.product_id).trim() !== "" ? String(g.product_id).trim() : null,
    isProductReady: typeof g.is_product_ready === "boolean" ? g.is_product_ready : null,
    missingProductFields: Array.isArray(g.missing_fields)
      ? g.missing_fields.map((x) => String(x))
      : [],
    productCompletenessScore:
      g.product_completeness_score != null && Number.isFinite(Number(g.product_completeness_score))
        ? Math.round(Number(g.product_completeness_score))
        : null,
    /** SSOT desempenho acumulado — GET /api/ml/listings (backend). */
    accumulated_performance:
      g.accumulated_performance != null && typeof g.accumulated_performance === "object"
        ? /** @type {Record<string, unknown>} */ (g.accumulated_performance)
        : null,
    /** View-model GET /api/ml/listings (Suse7 DB); não recalcular no front. */
    product_card_metrics:
      g.product_card_metrics != null && typeof g.product_card_metrics === "object"
        ? /** @type {Record<string, unknown>} */ (g.product_card_metrics)
        : null,
    mlAccountAlias:
      g.ml_account_alias != null && String(g.ml_account_alias).trim() !== ""
        ? String(g.ml_account_alias).trim()
        : null,
    /** Contagens opcionais da grid (read-model futuro); fallback no resolver da lista. */
    promotionsCount: pickInt(g.active_promotions_count, g.promotions_count),
    activePromotionsCount: pickInt(g.active_promotions_count),
    competitorsCount: pickInt(g.competitors_count, g.monitored_competitors_count),
    monitoredCompetitorsCount: pickInt(g.monitored_competitors_count),
    competitorsAboveCount: pickInt(g.competitors_above_count),
    competitorsBelowCount: pickInt(g.competitors_below_count),
    competitionListSource:
      g.competition_list_source != null && String(g.competition_list_source).trim() !== ""
        ? String(g.competition_list_source).trim()
        : null,
    health_listing_quality_score: g.health_listing_quality_score ?? null,
    listing_quality_score: g.listing_quality_score ?? g.health_listing_quality_score ?? null,
    listing_quality_score_percent: g.listing_quality_score_percent ?? null,
    listing_quality_source:
      g.listing_quality_source != null ? String(g.listing_quality_source) : null,
    listing_quality_fetched_at:
      g.listing_quality_fetched_at != null ? String(g.listing_quality_fetched_at) : null,
    listing_quality_sync_status:
      g.listing_quality_sync_status != null ? String(g.listing_quality_sync_status) : null,
  };

  return hydrateCatalogRowCanonicalListingQuality(catalogRow);
}
