// ======================================================================
// Utilitários visuais — rankings executivos (sem agregação financeira no FE).
// ======================================================================

import { formatBrlFromApiString } from "../../features/listings/utils/catalogFormatters";

export const DEFAULT_LISTING_TITLE = "Anúncio sem título";

/** Campos aninhados em `item.listing` (prioridade do contrato visual). */
const LISTING_NESTED_IMAGE_KEYS = [
  "image_url",
  "thumbnail",
  "thumbnail_url",
  "picture_url",
  "image",
];

const RANKING_PRIMARY_IMAGE_KEYS = [
  "image_url",
  "thumbnail_url",
  "product_thumbnail_url",
  "listing_thumbnail_url",
  "listing_image_url",
  "listing_image",
  "cover_image_url",
  "marketplace_thumbnail_url",
  "product_image_url",
  "thumbnail_snapshot",
  "picture_url",
];

const RANKING_FALLBACK_IMAGE_KEYS = [
  "fallback_image",
  "fallback_image_url",
  "fallback_thumbnail_url",
];

/** @param {string} raw */
function normalizeRankingImageUrl(raw) {
  const t = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "";
  if (!t) return "";
  if (t.startsWith("//")) return `https:${t}`;
  if (/^http:\/\//i.test(t) && /mercadolivre|mercadolibre|mlstatic|mlcdn/i.test(t)) {
    return `https://${t.slice(7)}`;
  }
  if (!/^https?:\/\//i.test(t)) return "";
  return t;
}

/** @param {unknown} value */
function normalizeRankingImageFromUnknown(value) {
  if (value == null) return "";
  if (typeof value === "string") return normalizeRankingImageUrl(value);
  if (typeof value === "object") {
    const o = /** @type {Record<string, unknown>} */ (value);
    return normalizeRankingImageUrl(
      String(o.secure_url ?? o.url ?? o.source ?? o.public_url ?? o.src ?? "").trim(),
    );
  }
  return "";
}

/** @param {unknown} pics */
function firstPictureUrlFromArray(pics) {
  let arr = pics;
  if (typeof pics === "string" && pics.trim()) {
    try {
      arr = JSON.parse(pics);
    } catch {
      if (pics.trim().startsWith("http")) return normalizeRankingImageUrl(pics.trim());
      return "";
    }
  }
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const p0 = arr[0];
  if (typeof p0 === "string") return normalizeRankingImageUrl(p0);
  if (p0 && typeof p0 === "object") {
    const o = /** @type {Record<string, unknown>} */ (p0);
    return normalizeRankingImageUrl(
      String(o.secure_url ?? o.url ?? o.source ?? o.public_url ?? "").trim(),
    );
  }
  return "";
}

/**
 * Extrai URL de imagem de registro marketplace_listings / raw_json (multi-marketplace).
 * @param {Record<string, unknown> | null | undefined} record
 * @returns {{ url: string; source: string }}
 */
export function extractListingImageFromRecord(record) {
  if (!record || typeof record !== "object") return { url: "", source: "" };

  const rawJson =
    record.raw_json != null && typeof record.raw_json === "object"
      ? /** @type {Record<string, unknown>} */ (record.raw_json)
      : null;
  if (rawJson) {
    const nested = extractListingImageFromRecord(rawJson);
    if (nested.url) return { url: nested.url, source: `raw_json.${nested.source}` };
    const catalog =
      rawJson.catalog_product != null && typeof rawJson.catalog_product === "object"
        ? /** @type {Record<string, unknown>} */ (rawJson.catalog_product)
        : null;
    if (catalog) {
      const fromCatalog = extractListingImageFromRecord(catalog);
      if (fromCatalog.url) {
        return { url: fromCatalog.url, source: `raw_json.catalog_product.${fromCatalog.source}` };
      }
    }
  }

  const directKeys = [
    ["secure_thumbnail", record.secure_thumbnail],
    ["thumbnail", record.thumbnail],
    ["picture", record.picture],
    ["pictures", record.pictures],
    ["picture_url", record.picture_url],
    ["image_url", record.image_url],
    ["secure_thumbnail_url", record.secure_thumbnail_url],
    ["permalink_thumbnail", record.permalink_thumbnail],
    ...LISTING_NESTED_IMAGE_KEYS.map((k) => [k, record[k]]),
  ];

  for (const [source, raw] of directKeys) {
    if (raw == null) continue;
    if (source === "pictures") {
      const fromPics = firstPictureUrlFromArray(raw);
      if (fromPics) return { url: fromPics, source: "pictures" };
      continue;
    }
    const url = normalizeRankingImageFromUnknown(raw);
    if (url) return { url, source };
  }

  return { url: "", source: "" };
}

/** @param {Record<string, unknown> | null | undefined} listing */
export function pickTopRankingImageFromListingObject(listing) {
  return extractListingImageFromRecord(listing).url;
}

/**
 * Linha `marketplace_listings` (Supabase) — mesma prioridade da listagem /vendas.
 * @param {Record<string, unknown> | null | undefined} row
 */
export function pickMarketplaceListingRowImageUrl(row) {
  return pickTopRankingImageFromListingObject(row);
}

/** @param {Record<string, unknown> | null | undefined} item */
export function pickTopRankingImageUrl(item) {
  if (!item || typeof item !== "object") return "";

  const nestedListing =
    item.listing != null && typeof item.listing === "object"
      ? /** @type {Record<string, unknown>} */ (item.listing)
      : null;
  const fromNested = pickTopRankingImageFromListingObject(nestedListing);
  if (fromNested) return fromNested;

  for (const key of RANKING_PRIMARY_IMAGE_KEYS) {
    const raw = item[key];
    if (raw == null) continue;
    const url = normalizeRankingImageUrl(String(raw).trim());
    if (url) return url;
  }

  const fromPictures = firstPictureUrlFromArray(item.pictures);
  if (fromPictures) return fromPictures;

  return "";
}

/** @param {Record<string, unknown> | null | undefined} item */
export function pickTopRankingFallbackImageUrl(item) {
  if (!item || typeof item !== "object") return "";
  for (const key of RANKING_FALLBACK_IMAGE_KEYS) {
    const raw = item[key];
    if (raw == null) continue;
    const url = normalizeRankingImageUrl(String(raw).trim());
    if (url) return url;
  }
  return "";
}

/** @param {Record<string, unknown> | null | undefined} item */
export function rankingItemAsThumbRecord(item) {
  if (!item || typeof item !== "object") return {};
  const imageUrl = pickTopRankingImageUrl(item);
  const fallbackUrl = pickTopRankingFallbackImageUrl(item);
  const nestedListing =
    item.listing != null && typeof item.listing === "object"
      ? /** @type {Record<string, unknown>} */ (item.listing)
      : null;
  const listingThumb = nestedListing ? pickTopRankingImageFromListingObject(nestedListing) : "";
  return {
    ...item,
    ...(nestedListing ? { listing: nestedListing } : {}),
    image_url: imageUrl || item.image_url || listingThumb || null,
    fallback_image_url: fallbackUrl || item.fallback_image_url,
    product_thumbnail_url: item.product_thumbnail_url ?? imageUrl ?? null,
    listing_thumbnail_url: item.listing_thumbnail_url ?? imageUrl ?? null,
    listing_image_url: item.listing_image_url ?? imageUrl ?? null,
    listing_image: item.listing_image ?? imageUrl ?? null,
    cover_image_url: item.cover_image_url ?? imageUrl ?? null,
    marketplace_thumbnail_url: item.marketplace_thumbnail_url ?? imageUrl ?? null,
    product_image_url: item.product_image_url ?? imageUrl ?? null,
    thumbnail_url: item.thumbnail_url ?? listingThumb ?? imageUrl ?? null,
    thumbnail: item.thumbnail ?? nestedListing?.thumbnail ?? listingThumb ?? null,
    picture_url: item.picture_url ?? imageUrl ?? null,
    thumbnail_snapshot: item.thumbnail_snapshot ?? imageUrl ?? null,
    listing_id: item.listing_id ?? null,
    marketplace: item.marketplace ?? null,
    marketplace_account_id: item.marketplace_account_id ?? null,
  };
}

/** @param {Record<string, unknown> | null | undefined} item */
export function topRankingThumbCacheKey(item) {
  if (!item || typeof item !== "object") return "";
  const nested =
    item.listing != null && typeof item.listing === "object"
      ? pickTopRankingImageFromListingObject(/** @type {Record<string, unknown>} */ (item.listing))
      : "";
  return [
    item.listing_id ?? item.rank ?? "",
    pickTopRankingImageUrl(item),
    nested,
    pickTopRankingFallbackImageUrl(item),
    item.title ?? "",
  ].join("|");
}

/** @param {Record<string, unknown>} item */
export function pickListingTitle(item) {
  const t = item.title != null ? String(item.title).trim() : "";
  return t !== "" ? t : DEFAULT_LISTING_TITLE;
}

const LISTING_ID_KEYS = ["listing_id", "external_listing_id"];
const SKU_KEYS = ["sku", "sku_snapshot", "normalized_sku"];

/** @param {Record<string, unknown> | null | undefined} source */
function pickFirstNonEmptyString(source, keys) {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    const raw = source[key];
    if (raw == null) continue;
    const t = String(raw).trim();
    if (t !== "") return t;
  }
  return "";
}

/** Nº do anúncio (listing_id / external_listing_id). */
/** @param {Record<string, unknown> | null | undefined} item */
export function pickTopRankingListingId(item) {
  if (!item || typeof item !== "object") return "";
  const nested =
    item.listing != null && typeof item.listing === "object"
      ? /** @type {Record<string, unknown>} */ (item.listing)
      : null;
  return pickFirstNonEmptyString(item, LISTING_ID_KEYS) || pickFirstNonEmptyString(nested, LISTING_ID_KEYS);
}

/** SKU do anúncio, quando disponível no item do ranking. */
/** @param {Record<string, unknown> | null | undefined} item */
export function pickTopRankingSku(item) {
  if (!item || typeof item !== "object") return "";
  const nested =
    item.listing != null && typeof item.listing === "object"
      ? /** @type {Record<string, unknown>} */ (item.listing)
      : null;
  return pickFirstNonEmptyString(item, SKU_KEYS) || pickFirstNonEmptyString(nested, SKU_KEYS);
}

/**
 * Coleção de anúncios vinculados ao produto (contrato rankings.products).
 * @param {Record<string, unknown> | null | undefined} item
 * @returns {string[]}
 */
export function normalizeLinkedListingIds(item) {
  const raw = item?.linked_listing_ids;
  if (!Array.isArray(raw)) return [];
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const v of raw) {
    const id = v != null ? String(v).trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Metadados do popover da lista lateral (somente leitura / cópia).
 * @param {Record<string, unknown> | null | undefined} item
 */
export function getTopRankingListingPopoverMeta(item) {
  const fullTitle = pickListingTitle(item);
  const linkedListingIds = normalizeLinkedListingIds(item);
  const marketplace =
    item?.marketplace != null && String(item.marketplace).trim() !== ""
      ? String(item.marketplace).trim()
      : "mercado_livre";

  let listingId = pickTopRankingListingId(item);
  if (!listingId && linkedListingIds.length === 1) {
    listingId = linkedListingIds[0];
  }

  const sku = pickTopRankingSku(item);
  const isMultiListing = linkedListingIds.length > 1;

  if (isMultiListing) {
    const displayIds = linkedListingIds.map((id) => formatListingIdForPopoverDisplay(id, marketplace));
    return {
      fullTitle,
      listingId: "",
      sku,
      listingIdDisplay: String(linkedListingIds.length),
      linkedListingIds,
      linkedListingIdsDisplay: displayIds.join(", "),
      isMultiListing: true,
      listingMetaLabel: "Anúncios vinculados:",
      skuDisplay: sku || "não informado",
      canCopyListingId: false,
      canCopySku: sku !== "",
    };
  }

  const listingIdDisplay = formatListingIdForPopoverDisplay(listingId, marketplace);
  return {
    fullTitle,
    listingId,
    sku,
    listingIdDisplay,
    linkedListingIds: listingId ? [listingId] : linkedListingIds,
    linkedListingIdsDisplay: "",
    isMultiListing: false,
    listingMetaLabel: "Anúncio:",
    skuDisplay: sku || "não informado",
    canCopyListingId: listingId !== "",
    canCopySku: sku !== "",
  };
}

/**
 * @param {string} listingId
 * @param {string} marketplace
 */
function formatListingIdForPopoverDisplay(listingId, marketplace) {
  const raw = listingId != null ? String(listingId).trim() : "";
  if (!raw) return "não informado";
  const m = String(marketplace || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const isMl = m === "mercado_livre" || m === "mercadolivre";
  if (!isMl) return raw;
  if (/^MLB\d+$/i.test(raw)) return `MLB${raw.replace(/^MLB/i, "")}`;
  if (/^\d+$/.test(raw)) return `MLB${raw}`;
  return raw;
}

/**
 * Nome resumido: até 2 palavras + reticências quando houver mais.
 * @param {string} title
 */
export function shortenListingTitleToTwoWords(title) {
  const t = title != null ? String(title).trim() : "";
  if (t === "") return DEFAULT_LISTING_TITLE;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return t;
  return `${words[0]} ${words[1]}...`;
}

/**
 * Converte ISO (YYYY-MM-DD) para padrão BR com hífen (DD-MM-YYYY).
 * @param {unknown} iso
 */
function formatIsoToBrDashed(iso) {
  const s = iso != null ? String(iso).trim() : "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * @param {Record<string, unknown> | null | undefined} period
 */
export function formatExecutivePeriodLabel(period) {
  const preset =
    period?.preset != null && String(period.preset).trim() !== ""
      ? String(period.preset).trim().toLowerCase()
      : "60d";
  if (preset === "60d") return "60 dias";
  if (preset === "30d") return "30 dias";
  if (preset === "7d") return "7 dias";
  if (preset === "today") return "Hoje";
  if (preset === "month") return "Mês atual";
  if (preset === "custom") {
    const start = formatIsoToBrDashed(period?.start_date);
    const end = formatIsoToBrDashed(period?.end_date);
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    return "Período customizado";
  }
  return "60 dias";
}

/**
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
/**
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
export function getTopRankingListMetricHeader(metric) {
  if (metric === "quantity") return "Vendas";
  if (metric === "gross_revenue") return "Faturamento";
  return "Lucro";
}

/**
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
/** @param {Record<string, unknown>} item */
function parseRankingQuantitySold(item) {
  const n =
    typeof item.quantity_sold === "number"
      ? item.quantity_sold
      : Number.parseInt(String(item.quantity_sold ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** @param {Record<string, unknown>} item */
export function formatRankingQuantityNumber(item) {
  return parseRankingQuantitySold(item).toLocaleString("pt-BR");
}

/** Label só a palavra — nunca truncar no layout (linha própria). */
/** @param {Record<string, unknown>} item */
export function formatRankingQuantityLabelWord(item) {
  const n = parseRankingQuantitySold(item);
  if (n === 1) return "venda";
  return "vendas";
}

/** @param {Record<string, unknown>} item */
export function formatRankingQuantityPhrase(item) {
  const n = parseRankingQuantitySold(item);
  if (n <= 0) return "0 vendas";
  if (n === 1) return "1 venda";
  return `${n.toLocaleString("pt-BR")} vendas`;
}

/** @param {Record<string, unknown>} item */
export function formatRankingGrossBrl(item) {
  return formatBrlFromApiString(
    item.gross_sales_brl != null ? String(item.gross_sales_brl) : null,
  );
}

/** @param {Record<string, unknown>} item */
export function formatRankingProfitBrl(item) {
  const profitRaw =
    item.profit_brl != null
      ? String(item.profit_brl)
      : item.contribution_profit_brl != null
        ? String(item.contribution_profit_brl)
        : null;
  return formatBrlFromApiString(profitRaw);
}

/**
 * Linha monetária do ranking — faturamento ou lucro conforme o card.
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
export function formatRankingValueLine(item, metric) {
  if (metric === "net_profit") {
    return formatRankingProfitBrl(item);
  }
  return formatRankingGrossBrl(item);
}

/**
 * Pódio — 2 linhas: vendas | valor (mesmo padrão da lista).
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
export function getTopRankingPodiumDisplay(item, metric) {
  return {
    salesLine: formatRankingQuantityPhrase(item),
    valueLine: formatRankingValueLine(item, metric),
  };
}

/**
 * Lista 4–10 — vendas — valor em reais (ordem fixa em todos os cards).
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
export function getTopRankingListMetricLine(item, metric) {
  return `${formatRankingQuantityPhrase(item)} — ${formatRankingValueLine(item, metric)}`;
}

/**
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
export function formatTopRankingMetricLabel(item, metric) {
  return getTopRankingListMetricLine(item, metric);
}

/**
 * Posição exibida no Top 10 — deriva do índice no array ordenado (contrato visual).
 * @param {{ arrayIndex: number; fallbackRank?: unknown; metricKey?: string }} params
 */
export function resolveTopRankingDisplayRank({ arrayIndex, fallbackRank, metricKey = "ranking" }) {
  const fromIndex =
    Number.isFinite(arrayIndex) && arrayIndex >= 0 && arrayIndex < 10 ? arrayIndex + 1 : null;
  const parsed = Number.parseInt(String(fallbackRank ?? ""), 10);
  const fromPayload = Number.isFinite(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;

  if (fromIndex != null && fromPayload != null && fromPayload !== fromIndex) {
    if (import.meta.env?.DEV) {
      console.warn(
        `[top10-rank] rank inconsistente em ${metricKey}: payload=${fromPayload}, esperado=${fromIndex}`,
      );
    }
  }

  return fromIndex ?? fromPayload ?? (Number.isFinite(arrayIndex) ? arrayIndex + 1 : 0);
}

/**
 * @param {number} rank
 */
export function isTopRankingDisplayRankValid(rank) {
  return Number.isFinite(rank) && rank >= 1 && rank <= 10;
}

/**
 * @param {number} rank
 * @param {Record<string, unknown>} item
 * @param {"quantity" | "gross_revenue" | "net_profit"} metric
 */
export function formatTopRankingTooltipBody(rank, item, metric) {
  const title = pickListingTitle(item);
  const podium = getTopRankingPodiumDisplay(item, metric);
  return [`#${rank}`, title, podium.salesLine, podium.valueLine].join("\n");
}
