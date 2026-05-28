// ======================================================================
// Thumbnail produto na lista de vendas — mesmo critério do catálogo
// (URLs https + product_images / product_image_links + raw ML).
// ======================================================================

import {
  pickFirstExternalImageUrlFromLinks,
  pickFirstGeneralLinkStoragePath,
  resolveProductImageSrc,
  resolveProductImageSrcSync,
  unwrapImageEntry,
} from "./productImageDisplayUrl.js";

/** @param {string} s */
function normalizeHttp(s) {
  const t = s != null && String(s).trim() !== "" ? String(s).trim() : "";
  if (!t) return "";
  if (t.startsWith("//")) return `https:${t}`;
  if (/^http:\/\//i.test(t) && /mercadolivre|mercadolibre|mlstatic|mlcdn/i.test(t)) {
    return `https://${t.slice(7)}`;
  }
  return t;
}

/** @param {unknown} pics */
function firstMlPictureUrl(pics) {
  if (!Array.isArray(pics) || pics.length === 0) return "";
  const p0 = pics[0];
  if (typeof p0 === "string" && p0.trim()) return normalizeHttp(p0.trim());
  if (p0 && typeof p0 === "object" && p0.secure_url) return normalizeHttp(String(p0.secure_url));
  if (p0 && typeof p0 === "object" && p0.url) return normalizeHttp(String(p0.url));
  return "";
}

/** @param {unknown} raw */
function extractFromItemRawJson(raw) {
  if (!raw || typeof raw !== "object") return "";
  const o = /** @type {Record<string, unknown>} */ (raw);
  const itemObj = o.item && typeof o.item === "object" ? /** @type {Record<string, unknown>} */ (o.item) : null;
  const th = itemObj?.thumbnail ?? o.thumbnail;
  if (typeof th === "string" && th.trim()) return normalizeHttp(th.trim());
  if (th && typeof th === "object" && th.secure_url) return normalizeHttp(String(th.secure_url));
  const pics = (itemObj && itemObj.pictures) || o.pictures;
  return firstMlPictureUrl(pics);
}

/**
 * @param {unknown} orderRaw
 * @param {string | null | undefined} externalOrderItemId
 */
function extractFromOrderItems(orderRaw, externalOrderItemId) {
  if (!orderRaw || typeof orderRaw !== "object" || !externalOrderItemId) return "";
  const want = String(externalOrderItemId).trim();
  if (!want) return "";
  const arr = /** @type {unknown[]} */ (orderRaw).order_items;
  if (!Array.isArray(arr)) return "";
  for (const line of arr) {
    if (!line || typeof line !== "object") continue;
    const lid =
      line.id != null
        ? String(line.id).trim()
        : line.order_item_id != null
          ? String(line.order_item_id).trim()
          : "";
    if (lid && lid === want) {
      return extractFromItemRawJson(line);
    }
  }
  return "";
}

/**
 * Resolve URL final para <img> na lista de vendas (pode ser assíncrona por storage_path).
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {Promise<string>}
 */
export async function resolveSalesRowProductThumbUrl(row) {
  if (!row || typeof row !== "object") return "";

  const flatKeys = ["product_image_url", "product_thumbnail_url", "listing_thumbnail_url", "thumbnail_url"];
  for (const k of flatKeys) {
    const v = row[k];
    const raw = v != null && String(v).trim() !== "" ? String(v).trim() : "";
    if (raw) {
      const n = normalizeHttp(raw);
      if (n) return n;
    }
  }

  const ext = pickFirstExternalImageUrlFromLinks(row.product_image_links ?? [], null);
  if (ext) return normalizeHttp(ext);

  const linkPath = pickFirstGeneralLinkStoragePath(row.product_image_links);
  if (linkPath) {
    const signed = await resolveProductImageSrc({ storage_path: linkPath });
    if (signed) return normalizeHttp(String(signed));
  }

  const pi = row.product_images;
  let first = null;
  if (Array.isArray(pi) && pi.length > 0) first = pi[0];
  else if (typeof pi === "string" && pi.trim()) {
    const s = pi.trim();
    if (s.startsWith("http")) {
      const n = normalizeHttp(s);
      if (n) return n;
    }
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) first = parsed[0];
      else if (parsed && typeof parsed === "object") first = parsed;
    } catch {
      /* ignore */
    }
  }
  if (first != null) {
    const un = unwrapImageEntry(first);
    const sync = resolveProductImageSrcSync(un);
    if (sync) return normalizeHttp(sync);
    const signed = await resolveProductImageSrc(un);
    if (signed) return normalizeHttp(String(signed));
  }

  const fromRaw = extractFromItemRawJson(row.raw_json);
  if (fromRaw) return fromRaw;

  const fromOrder = extractFromOrderItems(row.order_raw_json, row.external_order_item_id);
  if (fromOrder) return fromOrder;

  return "";
}

/**
 * Chave estável para efeito (evita re-fetch a cada render).
 * @param {Record<string, unknown> | null | undefined} row
 */
export function salesRowThumbCacheKey(row) {
  if (!row || typeof row !== "object") return "";
  return [
    row.item_id ?? row.sale_item_id ?? "",
    row.product_image_url ?? "",
    row.product_thumbnail_url ?? "",
    row.listing_thumbnail_url ?? "",
    row.thumbnail_url ?? "",
    typeof row.product_images === "string" ? row.product_images.slice(0, 120) : JSON.stringify(row.product_images ?? null),
    JSON.stringify(row.product_image_links ?? null),
  ].join("|");
}
