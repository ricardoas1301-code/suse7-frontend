// ======================================================
// Campos operacionais do Raio-x — leitura de payloads já expostos.
// ======================================================

/**
 * @param {unknown} source
 */
function asObject(source) {
  if (!source || typeof source !== "object") return null;
  return /** @type {Record<string, unknown>} */ (source);
}

/**
 * @param {unknown} raw
 */
function pickTrim(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

/**
 * @param {unknown} raw
 */
function formatLogisticsModality(raw) {
  const s = pickTrim(raw);
  if (!s) return null;
  const key = s.toLowerCase().replace(/\s+/g, "_");
  if (key === "full" || key === "fulfillment" || key.includes("fulfillment")) return "FULL";
  if (key === "flex" || key === "cross_docking" || key === "xd_drop_off" || key.includes("cross_docking")) {
    return "FLEX";
  }
  if (/^full$/i.test(s)) return "FULL";
  if (/^flex$/i.test(s)) return "FLEX";
  return null;
}

/**
 * @param {Record<string, unknown> | null} orderRaw
 * @param {string | null | undefined} externalOrderItemId
 */
function findOrderItemLine(orderRaw, externalOrderItemId) {
  if (!orderRaw) return null;
  const want = externalOrderItemId != null ? String(externalOrderItemId).trim() : "";
  const items = orderRaw.order_items;
  if (!Array.isArray(items)) return null;
  for (const line of items) {
    if (!line || typeof line !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (line);
    const lid =
      pickTrim(row.id) ??
      pickTrim(row.order_item_id) ??
      pickTrim(row.external_order_item_id) ??
      pickTrim(row.item_id);
    if (want && lid && lid === want) return row;
  }
  return want === "" && items.length === 1 && items[0] && typeof items[0] === "object"
    ? /** @type {Record<string, unknown>} */ (items[0])
    : null;
}

/**
 * @param {unknown} tags
 */
function tagListIncludesAds(tags) {
  if (!Array.isArray(tags)) return false;
  return tags.some((tag) => {
    const t = String(tag ?? "").trim().toLowerCase();
    return (
      t === "advertising" ||
      t === "ads" ||
      t === "product_ad" ||
      t.includes("publicidade") ||
      t.includes("advertis")
    );
  });
}

/**
 * @param {Record<string, unknown> | null} orderRaw
 * @param {Record<string, unknown> | null} itemRaw
 * @param {Record<string, unknown> | null} lineRaw
 */
function detectAdsSale(orderRaw, itemRaw, lineRaw) {
  if (tagListIncludesAds(orderRaw?.tags)) return true;
  if (tagListIncludesAds(orderRaw?.internal_tags)) return true;
  if (tagListIncludesAds(itemRaw?.tags)) return true;
  if (tagListIncludesAds(lineRaw?.tags)) return true;

  const channel = pickTrim(orderRaw?.channel);
  if (channel && /advertis|publicidade|product_ad/i.test(channel)) return true;

  const context = asObject(orderRaw?.context);
  const flows = context?.flows;
  if (Array.isArray(flows)) {
    for (const flow of flows) {
      const f = String(flow ?? "").trim().toLowerCase();
      if (f.includes("advertis") || f.includes("publicidade")) return true;
    }
  }

  return orderRaw?.advertising === true || lineRaw?.advertising === true || itemRaw?.advertising === true;
}

/**
 * @param {unknown} buyingMode
 */
function formatBuyingModeLabel(buyingMode) {
  const mode = pickTrim(buyingMode)?.toLowerCase();
  if (!mode) return null;
  if (mode === "buy_it_now") return "Compra imediata";
  if (mode === "auction") return "Leilão";
  return null;
}

/**
 * @param {unknown} listingTypeId
 */
function formatListingTypeLabel(listingTypeId) {
  const id = pickTrim(listingTypeId)?.toLowerCase();
  if (!id) return null;
  if (id.includes("gold_pro")) return "Premium";
  if (id.includes("gold_special")) return "Clássico";
  if (id.includes("gold")) return "Ouro";
  if (id.includes("free")) return "Grátis";
  return null;
}

/**
 * @param {Record<string, unknown> | null} general
 * @param {Record<string, unknown> | null} product
 */
function resolveSaleTypeLabel(general, product, orderRaw, itemRaw, lineRaw) {
  const fromApi = pickTrim(general?.sale_type_label);
  if (fromApi) return fromApi;

  const buyingMode =
    lineRaw?.buying_mode ??
    itemRaw?.buying_mode ??
    orderRaw?.buying_mode ??
    asObject(lineRaw?.item)?.buying_mode;
  const buyingLabel = formatBuyingModeLabel(buyingMode);
  if (buyingLabel) return buyingLabel;

  const listingType =
    lineRaw?.listing_type_id ??
    asObject(lineRaw?.item)?.listing_type_id ??
    itemRaw?.listing_type_id;
  return formatListingTypeLabel(listingType);
}

/**
 * @param {Record<string, unknown> | null} general
 * @param {Record<string, unknown> | null} orderRaw
 * @param {Record<string, unknown> | null} itemRaw
 * @param {Record<string, unknown> | null} lineRaw
 */
function resolveLogisticsModalityLabel(general, orderRaw, itemRaw, lineRaw) {
  const fromApi = pickTrim(general?.logistics_modality_label);
  if (fromApi) return fromApi;

  const s7 =
    orderRaw?._s7_delivery && typeof orderRaw._s7_delivery === "object"
      ? /** @type {Record<string, unknown>} */ (orderRaw._s7_delivery)
      : null;
  const shipping =
    orderRaw?.shipping && typeof orderRaw.shipping === "object"
      ? /** @type {Record<string, unknown>} */ (orderRaw.shipping)
      : null;
  const lineShipping =
    lineRaw?.shipping && typeof lineRaw.shipping === "object"
      ? /** @type {Record<string, unknown>} */ (lineRaw.shipping)
      : null;

  const candidates = [
    s7?.logistics_type,
    s7?.logistics_label,
    shipping?.logistic_type,
    lineShipping?.logistic_type,
    itemRaw?.logistic_type,
    lineRaw?.logistic_type,
    pickTrim(general?.delivery_label),
  ];

  for (const candidate of candidates) {
    const modality = formatLogisticsModality(candidate);
    if (modality) return modality;
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} general
 * @param {Record<string, unknown> | null | undefined} product
 * @returns {{ label: string; value: string }[]}
 */
export function collectSaleRayxOperationalLines(general, product) {
  const g = general && typeof general === "object" ? general : {};
  const p = product && typeof product === "object" ? product : {};
  const orderRaw = asObject(p.order_raw_json);
  const itemRaw = asObject(p.raw_json);
  const lineRaw = findOrderItemLine(orderRaw, p.external_order_item_id);

  /** @type {{ label: string; value: string }[]} */
  const lines = [];

  const adsFromApi = g.ads_sale === true || pickTrim(g.ads_sale_label) != null;
  const adsDetected = adsFromApi || detectAdsSale(orderRaw, itemRaw, lineRaw);

  const saleType = resolveSaleTypeLabel(g, p, orderRaw, itemRaw, lineRaw);
  if (saleType) {
    lines.push({ label: "Tipo de venda", value: saleType });
  }

  const logistics = resolveLogisticsModalityLabel(g, orderRaw, itemRaw, lineRaw);
  if (logistics) {
    lines.push({ label: "Logística", value: logistics });
  }

  if (adsDetected) {
    const adsValue = pickTrim(g.ads_sale_label) ?? "Venda por publicidade";
    lines.push({ label: "Venda por publicidade", value: adsValue });
  }

  return lines;
}
