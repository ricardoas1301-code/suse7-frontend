// ======================================================================
// Fallback frontend — espelha normalizeMercadoLivreShippingSummary (backend SSOT).
// Usado quando shipping_summary ainda não vier do detail API.
// ======================================================================

/** @type {Record<string, string>} */
const LOGISTIC_TYPE_LABELS = {
  fulfillment: "Full",
  xd_drop_off: "Mercado Envios",
  cross_docking: "Mercado Envios Coleta",
  drop_off: "Mercado Envios",
  self_service: "Flex",
};

/** @type {Record<string, string>} */
const MODE_LABELS = {
  me2: "Mercado Envios",
  me1: "Mercado Envios",
  custom: "Personalizado",
};

const FLEX_TAG_SIGNALS = new Set(["self_service_in", "self_service", "self_service_out", "flex"]);

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizarCodigo(value) {
  if (value == null) return null;
  const text = String(value).trim().toLowerCase();
  return text !== "" ? text : null;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function coletarTagsLista(value) {
  if (!Array.isArray(value)) return [];
  return value.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
}

/**
 * @param {unknown} value
 * @returns {boolean | null}
 */
function resolverBoolFrete(value) {
  if (value === true || value === false) return value;
  return null;
}

/**
 * @param {string | null} code
 */
function labelLogisticType(code) {
  if (!code) return "Não informado";
  return LOGISTIC_TYPE_LABELS[code] ?? "Não informado";
}

/**
 * @param {string | null} code
 */
function labelMode(code) {
  if (!code) return "Não informado";
  return MODE_LABELS[code] ?? "Não informado";
}

/**
 * @param {boolean | null} value
 * @returns {"Sim" | "Não" | "—"}
 */
function labelFreteGratis(value) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "—";
}

/**
 * @param {string | null} logisticTypeCode
 * @param {string[]} tagUniverse
 */
function detectarFlex(logisticTypeCode, tagUniverse) {
  if (logisticTypeCode === "self_service") return true;
  return tagUniverse.some((tag) => FLEX_TAG_SIGNALS.has(tag));
}

/**
 * @param {string | null} logisticTypeCode
 */
function detectarFull(logisticTypeCode) {
  return logisticTypeCode === "fulfillment";
}

/**
 * @param {boolean} isFull
 * @param {boolean} hasShippingData
 */
function labelServicoEntregaComposto(isFull, isFlex, hasShippingData) {
  if (!hasShippingData) return "Não informado";
  if (isFull && isFlex) return "Full / Flex";
  if (isFull) return "Full";
  if (isFlex) return "Padrão / Flex";
  return "Padrão";
}

/**
 * @param {boolean} isFlex
 * @param {boolean} hasShippingData
 */
function labelFlex(isFlex, hasShippingData) {
  if (!hasShippingData) return "—";
  return isFlex ? "Sim" : "Não";
}

export function buildEmptyMercadoLivreShippingSummary() {
  return {
    marketplace: "mercadolivre",
    mode_code: null,
    mode_label: "Não informado",
    logistic_type_code: null,
    logistic_type_label: "Não informado",
    free_shipping: null,
    free_shipping_label: "—",
    has_flex: null,
    flex_label: "—",
    is_full: null,
    is_flex: null,
    delivery_service_label: "Não informado",
    delivery_program_label: "Não informado",
    source_confidence: "unknown",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} rawListingOrShipping
 */
export function normalizeMercadoLivreShippingSummary(rawListingOrShipping) {
  const root =
    rawListingOrShipping && typeof rawListingOrShipping === "object" && !Array.isArray(rawListingOrShipping)
      ? rawListingOrShipping
      : null;

  const shippingFromRoot =
    root?.shipping && typeof root.shipping === "object" && !Array.isArray(root.shipping) ? root.shipping : null;

  const shippingDirect =
    root &&
    (Object.prototype.hasOwnProperty.call(root, "mode") ||
      Object.prototype.hasOwnProperty.call(root, "logistic_type") ||
      Object.prototype.hasOwnProperty.call(root, "free_shipping"))
      ? root
      : null;

  const shipping = shippingFromRoot ?? shippingDirect;

  if (!shipping) {
    return buildEmptyMercadoLivreShippingSummary();
  }

  const modeCode = normalizarCodigo(shipping.mode ?? shipping.shipping_mode);
  const logisticTypeCode = normalizarCodigo(shipping.logistic_type);
  const freeShipping = resolverBoolFrete(shipping.free_shipping);
  const shippingTags = coletarTagsLista(shipping.tags);
  const itemTags = shippingFromRoot && root ? coletarTagsLista(root.tags) : [];
  const tagUniverse = [...new Set([...shippingTags, ...itemTags])];

  const hasShippingData =
    modeCode != null || logisticTypeCode != null || freeShipping != null || tagUniverse.length > 0;

  const isFull = detectarFull(logisticTypeCode);
  const isFlex = detectarFlex(logisticTypeCode, tagUniverse);
  const deliveryServiceLabel = labelServicoEntregaComposto(isFull, isFlex, hasShippingData);

  return {
    marketplace: "mercadolivre",
    mode_code: modeCode,
    mode_label: labelMode(modeCode),
    logistic_type_code: logisticTypeCode,
    logistic_type_label: labelLogisticType(logisticTypeCode),
    free_shipping: freeShipping,
    free_shipping_label: labelFreteGratis(freeShipping),
    has_flex: hasShippingData ? isFlex : null,
    flex_label: labelFlex(isFlex, hasShippingData),
    is_full: hasShippingData ? isFull : null,
    is_flex: hasShippingData ? isFlex : null,
    delivery_service_label: deliveryServiceLabel,
    delivery_program_label: deliveryServiceLabel,
    source_confidence: hasShippingData ? "raw_ml_shipping" : "unknown",
  };
}

/**
 * Resolve shipping_summary a partir do bloco logistics do editor detail.
 * @param {Record<string, unknown> | null | undefined} logisticsPayload
 */
export function resolverShippingSummaryLogistica(logisticsPayload) {
  const base =
    logisticsPayload && typeof logisticsPayload === "object" && !Array.isArray(logisticsPayload)
      ? logisticsPayload
      : null;

  const fromApi =
    base?.shipping_summary && typeof base.shipping_summary === "object" && !Array.isArray(base.shipping_summary)
      ? base.shipping_summary
      : base?.mode_label != null ||
          base?.logistic_type_label != null ||
          base?.free_shipping_label != null ||
          base?.delivery_service_label != null ||
          base?.flex_label != null
        ? base
        : null;

  if (fromApi) {
    return {
      marketplace: "mercadolivre",
      mode_code: fromApi.mode_code ?? null,
      mode_label: fromApi.mode_label ?? "Não informado",
      logistic_type_code: fromApi.logistic_type_code ?? null,
      logistic_type_label: fromApi.logistic_type_label ?? "Não informado",
      free_shipping: fromApi.free_shipping ?? null,
      free_shipping_label: fromApi.free_shipping_label ?? "—",
      has_flex: fromApi.has_flex ?? fromApi.is_flex ?? null,
      flex_label:
        fromApi.flex_label ??
        (fromApi.has_flex === true || fromApi.is_flex === true
          ? "Sim"
          : fromApi.has_flex === false || fromApi.is_flex === false
            ? "Não"
            : "—"),
      is_full: fromApi.is_full ?? null,
      is_flex: fromApi.is_flex ?? fromApi.has_flex ?? null,
      delivery_service_label:
        fromApi.delivery_service_label ??
        labelServicoEntregaComposto(fromApi.is_full === true, (fromApi.has_flex ?? fromApi.is_flex) === true, fromApi.is_full != null || fromApi.has_flex != null || fromApi.is_flex != null),
      delivery_program_label:
        fromApi.delivery_service_label ??
        labelServicoEntregaComposto(fromApi.is_full === true, (fromApi.has_flex ?? fromApi.is_flex) === true, fromApi.is_full != null || fromApi.has_flex != null || fromApi.is_flex != null),
      source_confidence: fromApi.source_confidence ?? "raw_ml_shipping",
    };
  }

  return normalizeMercadoLivreShippingSummary({
    mode: base?.shipping_mode,
    logistic_type: base?.logistic_type,
    free_shipping: base?.free_shipping,
    tags: base?.tags,
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} mediaPayload
 */
export function resolverMediaSummary(mediaPayload) {
  const base =
    mediaPayload && typeof mediaPayload === "object" && !Array.isArray(mediaPayload)
      ? mediaPayload
      : null;
  const countRaw = base?.clips_count;
  const count = Number.isFinite(Number(countRaw)) && Number(countRaw) >= 0 ? Math.trunc(Number(countRaw)) : 0;
  return {
    clips_count: count,
    clips_label: base?.clips_label != null && String(base.clips_label).trim() !== "" ? String(base.clips_label) : String(count),
    has_clips: base?.has_clips === true || count > 0,
    video_id_present: base?.video_id_present === true,
    source: base?.source ?? (count > 0 ? "item_video_id" : "item_without_video"),
    source_confidence: base?.source_confidence ?? "fallback",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} pricePayload
 */
export function resolverPriceSummary(pricePayload) {
  const base =
    pricePayload && typeof pricePayload === "object" && !Array.isArray(pricePayload)
      ? pricePayload
      : null;
  return {
    sale_price_brl: base?.sale_price_brl != null ? String(base.sale_price_brl) : null,
    sale_price_label:
      base?.sale_price_label != null && String(base.sale_price_label).trim() !== ""
        ? String(base.sale_price_label).trim()
        : "—",
    source: base?.source ?? "unknown",
    source_confidence: base?.source_confidence ?? "unknown",
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} wholesalePayload
 */
export function resolverWholesaleSummary(wholesalePayload) {
  const base =
    wholesalePayload && typeof wholesalePayload === "object" && !Array.isArray(wholesalePayload)
      ? wholesalePayload
      : null;
  const label =
    base?.label != null && String(base.label).trim() !== ""
      ? String(base.label).trim()
      : base?.unit_price_label != null && String(base.unit_price_label).trim() !== ""
        ? String(base.unit_price_label).trim()
        : "Não vende no atacado";

  return {
    enabled: base?.enabled === true,
    min_quantity: base?.min_quantity != null ? String(base.min_quantity) : null,
    unit_price_brl: base?.unit_price_brl != null ? String(base.unit_price_brl) : null,
    unit_price_label: label,
    tiers_count: Number.isFinite(Number(base?.tiers_count)) ? Math.trunc(Number(base.tiers_count)) : 0,
    label,
    source: base?.source ?? (base?.enabled === true ? "item_prices_show_all" : "item_without_quantity_price"),
    source_confidence: base?.source_confidence ?? "unknown",
    debug_reason: base?.debug_reason ?? null,
  };
}
