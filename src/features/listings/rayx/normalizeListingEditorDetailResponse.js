import { resolveCanonicalListingQualityScore } from "../domain/health/resolveCanonicalListingQualityScore.js";

/**
 * @param {unknown} value
 */
function textoOuNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text !== "" ? text : null;
}

/**
 * @param {unknown} value
 */
function numeroOuNull(value) {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string | null | undefined} raw
 */
function formatarStatusLabel(raw) {
  const text = textoOuNull(raw);
  if (!text) return "—";
  const s = text.toLowerCase();
  if (s === "active" || s === "ativo") return "Ativo";
  if (s === "paused" || s === "pausado") return "Pausado";
  if (s === "closed" || s === "finalizado") return "Finalizado";
  if (s === "under_review" || s === "em revisão" || s === "em revisao") return "Em revisão";
  if (s === "inactive" || s === "not_yet_active" || s === "inativo") return "Inativo";
  const humanized = text.replace(/_/g, " ");
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

/**
 * @param {Record<string, unknown> | null | undefined} listing
 */
function buildSummaryFallback(listing) {
  const statusRaw =
    textoOuNull(listing?.status) ??
    textoOuNull(listing?.statusKey) ??
    textoOuNull(listing?.status_label) ??
    "—";
  return {
    status_label: formatarStatusLabel(statusRaw),
    visits: null,
    visits_available: false,
    conversion_percent: null,
    sku_label: textoOuNull(listing?.sku),
    stock_label: textoOuNull(listing?.availableQuantity ?? listing?.stockQuantity),
    category_name: textoOuNull(listing?.categoryName),
    category_id: textoOuNull(listing?.categoryId),
    brand: textoOuNull(listing?.brand ?? listing?.brandName),
    universal_code: textoOuNull(listing?.gtin ?? listing?.ean ?? listing?.upc),
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} fallbackSummary
 */
function buildSafeSummary(fallbackSummary) {
  return {
    status_label: formatarStatusLabel(textoOuNull(fallbackSummary?.status_label) ?? textoOuNull(fallbackSummary?.status)),
    visits: numeroOuNull(fallbackSummary?.visits),
    visits_available: fallbackSummary?.visits_available === true,
    conversion_percent: numeroOuNull(fallbackSummary?.conversion_percent),
    sold_quantity: numeroOuNull(fallbackSummary?.sold_quantity),
    sku_label: textoOuNull(fallbackSummary?.sku_label),
    stock_label: textoOuNull(fallbackSummary?.stock_label),
    category_name: textoOuNull(fallbackSummary?.category_name),
    category_id: textoOuNull(fallbackSummary?.category_id),
    brand: textoOuNull(fallbackSummary?.brand),
    model: textoOuNull(fallbackSummary?.model),
    ean_gtin: textoOuNull(fallbackSummary?.ean_gtin ?? fallbackSummary?.universal_code),
    universal_code: textoOuNull(fallbackSummary?.universal_code ?? fallbackSummary?.ean_gtin),
    ncm: textoOuNull(fallbackSummary?.ncm),
  };
}

function buildSafeProductSummary(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  return {
    product_id: textoOuNull(base.product_id),
    variant_id: textoOuNull(base.variant_id),
    brand: textoOuNull(base.brand),
    model: textoOuNull(base.model),
    ean_gtin: textoOuNull(base.ean_gtin),
    ncm: textoOuNull(base.ncm),
  };
}

function buildSafeCostsSummary(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  return {
    product_cost_brl: textoOuNull(base.product_cost_brl),
    packaging_cost_brl: textoOuNull(base.packaging_cost_brl),
    operational_cost_brl: textoOuNull(base.operational_cost_brl),
  };
}

function buildSafeStockSummary(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  return {
    product_stock: numeroOuNull(base.product_stock),
    product_min_stock: numeroOuNull(base.product_min_stock),
    product_virtual_stock_enabled: base.product_virtual_stock_enabled === true,
    product_virtual_stock: numeroOuNull(base.product_virtual_stock ?? base.product_virtual_stock_value),
    product_virtual_stock_value: numeroOuNull(base.product_virtual_stock_value ?? base.product_virtual_stock),
    marketplace_listing_stock: numeroOuNull(base.marketplace_listing_stock ?? base.listing_stock),
    listing_stock: numeroOuNull(base.listing_stock ?? base.marketplace_listing_stock),
    listing_virtual_stock_override_enabled:
      base.listing_virtual_stock_override_enabled === true || base.listing_virtual_stock_enabled === true,
    listing_virtual_stock_enabled:
      base.listing_virtual_stock_override_enabled === true || base.listing_virtual_stock_enabled === true,
    listing_virtual_stock_value: numeroOuNull(base.listing_virtual_stock_value ?? base.listing_virtual_stock),
    listing_virtual_stock: numeroOuNull(base.listing_virtual_stock ?? base.listing_virtual_stock_value),
    effective_virtual_stock_source: textoOuNull(base.effective_virtual_stock_source),
    effective_virtual_stock_value: numeroOuNull(base.effective_virtual_stock_value),
    listing_sync_status: textoOuNull(base.listing_sync_status),
  };
}

function buildPictureStableKey(pic) {
  const pictureId = textoOuNull(pic?.picture_id) ?? textoOuNull(pic?.id);
  if (pictureId) return `id:${pictureId}`;
  const url = textoOuNull(pic?.url) ?? textoOuNull(pic?.secure_url);
  if (url) return `url:${url}`;
  return null;
}

function buildSafeDescriptionSummary(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const effectiveSourceRaw = textoOuNull(base.effective_source) ?? "none";
  const effectiveSource = ["local_override", "marketplace_default", "none"].includes(effectiveSourceRaw)
    ? effectiveSourceRaw
    : "none";
  const effectiveDescription =
    base.effective_description != null ? String(base.effective_description) : "";

  return {
    marketplace_description: textoOuNull(base.marketplace_description),
    local_description: textoOuNull(base.local_description),
    effective_description: effectiveDescription,
    effective_source: effectiveSource,
  };
}

function buildSafeMeasureBlock(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  return {
    width_cm: numeroOuNull(base.width_cm),
    height_cm: numeroOuNull(base.height_cm),
    length_cm: numeroOuNull(base.length_cm),
    weight_kg: numeroOuNull(base.weight_kg),
  };
}

function buildSafeMeasurementsSummary(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const effectiveSourceRaw = textoOuNull(base.effective_source) ?? "none";
  const effectiveSource = [
    "local_override",
    "marketplace_default",
    "product_fallback",
    "mixed",
    "none",
  ].includes(effectiveSourceRaw)
    ? effectiveSourceRaw
    : "none";

  return {
    shipping: buildSafeMeasureBlock(base.shipping),
    product_mounted: buildSafeMeasureBlock(base.product_mounted),
    effective_source: effectiveSource,
  };
}

function buildSafeImagesSummary(fallback) {
  const base = fallback && typeof fallback === "object" ? fallback : {};
  const policyBase =
    base.images_policy && typeof base.images_policy === "object" ? base.images_policy : {};
  const pictures = Array.isArray(base.pictures)
    ? base.pictures
        .map((pic, index) => {
          if (!pic || typeof pic !== "object") return null;
          const row = /** @type {Record<string, unknown>} */ (pic);
          const url = textoOuNull(row.url) ?? textoOuNull(row.secure_url);
          if (!url) return null;
          const normalized = {
            picture_id: textoOuNull(row.picture_id) ?? textoOuNull(row.id),
            url,
            position: numeroOuNull(row.position) ?? index,
          };
          return {
            ...normalized,
            stable_key: textoOuNull(row.stable_key) ?? buildPictureStableKey(normalized),
          };
        })
        .filter(Boolean)
    : [];

  return {
    category_id: textoOuNull(base.category_id),
    category_name: textoOuNull(base.category_name),
    max_pictures_per_item: numeroOuNull(base.max_pictures_per_item),
    max_pictures_per_item_var: numeroOuNull(base.max_pictures_per_item_var),
    pictures_count: pictures.length,
    pictures,
    ordered_picture_keys: Array.isArray(base.ordered_picture_keys)
      ? base.ordered_picture_keys.map((key) => textoOuNull(key)).filter(Boolean)
      : pictures.map((pic) => pic.stable_key).filter(Boolean),
    primary_picture_id: textoOuNull(base.primary_picture_id),
    primary_picture_url: textoOuNull(base.primary_picture_url),
    effective_primary_picture_id: textoOuNull(base.effective_primary_picture_id),
    effective_primary_picture_url: textoOuNull(base.effective_primary_picture_url),
    effective_primary_picture_key: textoOuNull(base.effective_primary_picture_key),
    effective_primary_source: textoOuNull(base.effective_primary_source) ?? "none",
    images_policy: {
      maxPictures: numeroOuNull(policyBase.maxPictures ?? base.max_pictures_per_item),
      maxPicturesPerItem: numeroOuNull(policyBase.maxPicturesPerItem ?? base.max_pictures_per_item),
      maxPicturesPerVariation: numeroOuNull(
        policyBase.maxPicturesPerVariation ?? base.max_pictures_per_item_var,
      ),
      source: textoOuNull(policyBase.source),
      confidence: textoOuNull(policyBase.confidence) ?? "none",
      marketplace: textoOuNull(policyBase.marketplace),
      hasVariations: policyBase.hasVariations === true,
    },
  };
}


function buildSafeQuality() {
  return {
    display_value: "—",
    score_percent: null,
    level_label: "Sem calcular",
    objectives_label: "Ainda não há dados suficientes",
    tone: "neutral",
    source: "unavailable",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} currentListing
 */
function buildQualityFallbackFromListing(currentListing) {
  const scorePercent = resolveCanonicalListingQualityScore(currentListing);
  if (scorePercent == null) return buildSafeQuality();
  return {
    score_percent: scorePercent,
    display_value: `${scorePercent}%`,
    level_label: "Qualidade do anúncio",
    objectives_label: "Objetivos do cadastro",
    tone: scorePercent >= 100 ? "success" : scorePercent >= 85 ? "info" : scorePercent >= 60 ? "warning" : "danger",
    source: "catalog_health_snapshot",
  };
}

function buildSafePurchaseExperience() {
  return {
    display_value: "—",
    score_percent: null,
    label: "Ainda não podemos calculá-la",
    description: null,
    tone: "neutral",
    source: "unavailable",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} root
 * @param {Record<string, unknown> | null | undefined} detail
 */
function buildSafeMarketplaceEditUrl(root, detail) {
  const candidates = [
    root?.marketplace_edit_url,
    root?.external_edit_url,
    detail?.marketplace_edit_url,
    detail?.external_edit_url,
  ];
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const text = String(candidate).trim();
    if (/^https?:\/\//i.test(text)) return text;
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} currentListing
 */
export function buildListingDetailFallbackFromRow(currentListing) {
  return {
    partial: true,
    summary: buildSafeSummary(buildSummaryFallback(currentListing)),
    quality: buildQualityFallbackFromListing(currentListing),
    purchase_experience: buildSafePurchaseExperience(),
    product_summary: buildSafeProductSummary(null),
    costs_summary: buildSafeCostsSummary(null),
    stock_summary: buildSafeStockSummary(null),
    images_summary: buildSafeImagesSummary(null),
    description_summary: buildSafeDescriptionSummary(null),
    measurements_summary: buildSafeMeasurementsSummary(null),
    marketplace_edit_url: null,
    external_edit_url: null,
    warnings: [],
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} response
 * @param {Record<string, unknown> | null | undefined} currentListing
 */
export function normalizeListingEditorDetailResponse(response, currentListing) {
  const root = response && typeof response === "object" ? response : {};
  const detail =
    root.detail && typeof root.detail === "object" && !Array.isArray(root.detail) ? root.detail : {};
  const fallback = buildListingDetailFallbackFromRow(currentListing);

  const summaryRaw =
    (root.summary && typeof root.summary === "object" ? root.summary : null) ??
    (detail.summary && typeof detail.summary === "object" ? detail.summary : null) ??
    fallback.summary;

  const qualityRaw =
    (root.quality && typeof root.quality === "object" ? root.quality : null) ??
    (detail.quality && typeof detail.quality === "object" ? detail.quality : null) ??
    fallback.quality;

  const purchaseExperienceRaw =
    (root.purchase_experience && typeof root.purchase_experience === "object"
      ? root.purchase_experience
      : null) ??
    (detail.purchase_experience && typeof detail.purchase_experience === "object"
      ? detail.purchase_experience
      : null) ??
    fallback.purchase_experience;

  const productSummaryRaw =
    (root.product_summary && typeof root.product_summary === "object" ? root.product_summary : null) ??
    (detail.product_summary && typeof detail.product_summary === "object" ? detail.product_summary : null);

  const costsSummaryRaw =
    (root.costs_summary && typeof root.costs_summary === "object" ? root.costs_summary : null) ??
    (detail.costs_summary && typeof detail.costs_summary === "object" ? detail.costs_summary : null);

  const stockSummaryRaw =
    (root.stock_summary && typeof root.stock_summary === "object" ? root.stock_summary : null) ??
    (detail.stock_summary && typeof detail.stock_summary === "object" ? detail.stock_summary : null);

  const imagesSummaryRaw =
    (root.images_summary && typeof root.images_summary === "object" ? root.images_summary : null) ??
    (detail.images_summary && typeof detail.images_summary === "object" ? detail.images_summary : null);

  const descriptionSummaryRaw =
    (root.description_summary && typeof root.description_summary === "object"
      ? root.description_summary
      : null) ??
    (detail.description_summary && typeof detail.description_summary === "object"
      ? detail.description_summary
      : null);

  const measurementsSummaryRaw =
    (root.measurements_summary && typeof root.measurements_summary === "object"
      ? root.measurements_summary
      : null) ??
    (detail.measurements_summary && typeof detail.measurements_summary === "object"
      ? detail.measurements_summary
      : null);

  const marketplaceEditUrl = buildSafeMarketplaceEditUrl(
    root && typeof root === "object" ? root : null,
    detail && typeof detail === "object" ? detail : null,
  );

  return {
    ...fallback,
    ...detail,
    summary: buildSafeSummary(summaryRaw),
    quality: qualityRaw != null ? { ...buildSafeQuality(), ...qualityRaw } : buildSafeQuality(),
    purchase_experience:
      purchaseExperienceRaw != null
        ? { ...buildSafePurchaseExperience(), ...purchaseExperienceRaw }
        : buildSafePurchaseExperience(),
    product_summary: buildSafeProductSummary(productSummaryRaw),
    costs_summary: buildSafeCostsSummary(costsSummaryRaw),
    stock_summary: buildSafeStockSummary(stockSummaryRaw),
    images_summary: buildSafeImagesSummary(imagesSummaryRaw),
    description_summary: buildSafeDescriptionSummary(descriptionSummaryRaw),
    measurements_summary: buildSafeMeasurementsSummary(measurementsSummaryRaw),
    marketplace_edit_url: marketplaceEditUrl,
    external_edit_url: marketplaceEditUrl,
    warnings: Array.isArray(root.warnings)
      ? root.warnings
      : Array.isArray(detail.warnings)
        ? detail.warnings
        : fallback.warnings,
  };
}

