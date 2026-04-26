import { ATTENTION_REASON_SKU_PENDING_ML } from "../../../constants/listingAttention.js";
import { formatMarketplaceListingDisplayId } from "../../../utils/marketplaceListingId.js";
import { DASH } from "./catalogFormatters.js";

/** @param {string | null | undefined} status */
function mlStatusToUi(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return { statusKey: "active", statusLabel: "Ativo" };
  if (s === "paused") return { statusKey: "paused", statusLabel: "Pausado" };
  if (s === "closed") return { statusKey: "paused", statusLabel: "Encerrado" };
  if (s === "not_yet_active" || s === "inactive") return { statusKey: "paused", statusLabel: "Inativo" };
  return { statusKey: "active", statusLabel: status ? String(status) : "—" };
}

export function isAnunciosCatalogRowPending(row) {
  const ph =
    row.pricingContext != null && typeof row.pricingContext === "object"
      ? /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext).product_health
      : null;
  const st = ph?.product_health_status != null ? String(ph.product_health_status) : null;
  if (st === "MISSING_PRODUCT") return true;
  if (row.skuPending) return true;
  if (!row.productId) return true;
  if (row.isProductReady === true) return false;
  if (row.isProductReady === false) return true;
  if (row.isProductReady == null && st === "INCOMPLETE_PRODUCT") return true;
  return false;
}

/**
 * Ações de vínculo na linha (espelha health + campos já expostos na grid).
 * @param {{ attentionReason?: string | null; pricingContext?: Record<string, unknown> | null; productId?: string | null; isProductReady?: boolean | null }} row
 * @param {(r: typeof row) => void} [onInformSku]
 */
export function getListingProductLinkActions(row, onInformSku) {
  const isSkuPendingMl = row.attentionReason === ATTENTION_REASON_SKU_PENDING_ML;
  const phSt =
    row.pricingContext != null && typeof row.pricingContext === "object"
      ? /** @type {{ product_health?: { product_health_status?: string } }} */ (row.pricingContext).product_health
          ?.product_health_status
      : null;
  const healthSt = phSt != null ? String(phSt) : null;
  const hasInform = typeof onInformSku === "function";
  const pid = row.productId != null && String(row.productId).trim() !== "" ? String(row.productId).trim() : "";
  const incompletoCadastroMinimo =
    row.isProductReady === true
      ? false
      : typeof row.isProductReady === "boolean"
        ? row.isProductReady === false
        : healthSt === "INCOMPLETE_PRODUCT";
  return {
    isSkuPendingMl,
    healthSt,
    showInformSkuMl: hasInform && isSkuPendingMl,
    showVincular:
      hasInform &&
      !isSkuPendingMl &&
      (healthSt === "MISSING_PRODUCT" || !pid) &&
      healthSt !== "INCOMPLETE_PRODUCT",
    showCompletar: Boolean(pid) && incompletoCadastroMinimo,
  };
}

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

  const salesCount = g.sold_quantity != null ? Math.trunc(Number(g.sold_quantity)) || 0 : 0;
  const soldQtyMl =
    g.sold_quantity_ml_listing != null && Number.isFinite(Number(g.sold_quantity_ml_listing))
      ? Math.trunc(Number(g.sold_quantity_ml_listing))
      : null;
  const grossMissing = Boolean(g.gross_revenue_missing);
  const revenueNumeric =
    !grossMissing && g.gross_revenue_brl != null ? Number(g.gross_revenue_brl) : grossMissing ? 0 : Number(g.gross_revenue_brl) || 0;

  const qScore = g.health_listing_quality_score;
  const qScoreNum = qScore != null && Number.isFinite(Number(qScore)) ? Number(qScore) : null;
  const qStatus = g.health_listing_quality_status != null ? String(g.health_listing_quality_status) : null;
  const expStatus = g.health_experience_status != null ? String(g.health_experience_status) : null;

  const uiFlags = {};
  if ((healthNum != null && healthNum < 40) || /basic|bajo|baix/i.test(qStatus || "")) {
    uiFlags.needs_attention = true;
  }
  if (Boolean(g.needs_attention)) uiFlags.needs_attention = true;
  if (Boolean(g.sku_pending)) uiFlags.needs_attention = true;

  const attentionReason = g.attention_reason != null ? String(g.attention_reason) : null;

  const visitsAbsent = Boolean(g.visits_absent);
  const visitCountForFilter = visitsAbsent || g.visits == null ? 0 : Number(g.visits) || 0;

  const m = String(g.marketplace || "");
  const marketplaceSlug = m === "mercado_livre" ? "mercadolivre" : m || "mercadolivre";

  const galleryImageUrls = Array.isArray(g.gallery_image_urls)
    ? /** @type {string[]} */ (g.gallery_image_urls).filter((u) => typeof u === "string" && u.trim() !== "")
    : [];

  const coverDirect = g.cover_image_url ?? g.cover_thumbnail_url;
  const coverTrimmed =
    coverDirect != null && String(coverDirect).trim() !== "" ? String(coverDirect).trim() : null;
  const coverThumbnailUrl = coverTrimmed ?? (galleryImageUrls[0] != null ? String(galleryImageUrls[0]).trim() : null);

  return {
    id: String(g.id),
    sku: g.sku != null && String(g.sku).trim() !== "" ? String(g.sku).trim() : null,
    adCount: 0,
    adTitle: g.title ? String(g.title) : DASH,
    picturesCount: picN != null && Number.isFinite(picN) ? picN : null,
    variationsCount: varN != null && Number.isFinite(varN) ? varN : null,
    productName: DASH,
    marketplaceSlug,
    marketplaceRaw: m,
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
    grossRevenueBrl: g.gross_revenue_brl != null ? String(g.gross_revenue_brl) : null,
    profit: 0,
    marginPct: 0,
    statusKey,
    statusLabel,
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
    visitsText: g.visits != null ? String(g.visits) : null,
    netReceiveBrl:
      g.marketplace_payout_amount != null && String(g.marketplace_payout_amount).trim() !== ""
        ? String(g.marketplace_payout_amount)
        : null,
    marketplacePayoutSource:
      g.marketplace_payout_source != null && String(g.marketplace_payout_source).trim() !== ""
        ? String(g.marketplace_payout_source).trim()
        : "unresolved",
    /** Protocolo v1: payout e preço vêm dos campos explícitos; net_proceeds não é usado na UI. */
    netProceeds: null,
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
  };
}
