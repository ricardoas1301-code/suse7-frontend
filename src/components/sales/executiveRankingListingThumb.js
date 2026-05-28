// ======================================================================
// Thumbs do ranking executivo — resolver central (API + marketplace_listings).
// Schema: imagens em raw_json (GET /items ML); colunas thumbnail/pictures podem não existir.
// ======================================================================

import { supabase } from "../../supabaseClient";
import {
  extractListingImageFromRecord,
  pickTopRankingFallbackImageUrl,
  pickTopRankingImageUrl,
} from "./salesTopRankingUtils";

const CHUNK_SIZE = 120;

/** Selects do mais seguro ao mais completo (PostgREST 42703 = coluna inexistente). */
const MARKETPLACE_LISTINGS_SELECT_VARIANTS = [
  "id,external_listing_id,raw_json,marketplace,marketplace_account_id",
  "id,external_listing_id,pictures,raw_json,marketplace,marketplace_account_id",
  "id,external_listing_id,thumbnail,pictures,raw_json,marketplace,marketplace_account_id",
];

/** @param {unknown} error */
function isPostgrestMissingColumnError(error) {
  const msg = String(/** @type {{ message?: string }} */ (error)?.message ?? "").toLowerCase();
  return (
    String(/** @type {{ code?: string }} */ (error)?.code ?? "") === "42703" ||
    msg.includes("column") ||
    msg.includes("schema cache")
  );
}

/**
 * @param {string} userId
 * @param {"external_listing_id" | "id"} matchColumn
 * @param {string[]} ids
 */
async function fetchMarketplaceListingRows(userId, matchColumn, ids) {
  if (!ids.length) return { rows: [], selectUsed: null };

  /** @type {unknown} */
  let lastError = null;

  for (const select of MARKETPLACE_LISTINGS_SELECT_VARIANTS) {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(select)
      .eq("user_id", userId)
      .in(matchColumn, ids);

    if (!error) {
      return { rows: data || [], selectUsed: select };
    }

    lastError = error;
    if (!isPostgrestMissingColumnError(error)) {
      logRankingThumbDev({
        phase: matchColumn,
        message: /** @type {{ message?: string }} */ (error).message,
        select,
        rows_requested: ids.length,
      });
      return { rows: [], selectUsed: null };
    }
  }

  logRankingThumbDev({
    phase: matchColumn,
    message: lastError != null ? String(/** @type {{ message?: string }} */ (lastError).message) : "select_failed",
    rows_requested: ids.length,
    rows_found: 0,
  });
  return { rows: [], selectUsed: null };
}

/** @param {string} id */
function isLikelyExternalListingId(id) {
  const s = id != null ? String(id).trim() : "";
  if (!s) return false;
  if (/^(title:|line:|sku:|pid:)/i.test(s)) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return true;
  if (/^[A-Z]{2,6}\d{5,}$/i.test(s)) return true;
  return s.length >= 8 && !/\s/.test(s);
}

/** @param {string} id */
function isUuidLike(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(id).trim(),
  );
}

/**
 * @param {Record<string, unknown>} row
 */
export function collectRankingCatalogLookupKeys(row) {
  /** @type {string[]} */
  const keys = [];
  const add = (v) => {
    const t = v != null ? String(v).trim() : "";
    if (t && !keys.includes(t)) keys.push(t);
  };

  add(row.external_listing_id);
  add(row.listing_id);
  const nested =
    row.listing != null && typeof row.listing === "object"
      ? /** @type {Record<string, unknown>} */ (row.listing)
      : null;
  if (nested) {
    add(nested.external_listing_id);
    add(nested.listing_id);
  }

  return keys;
}

/**
 * @param {Record<string, unknown> | null | undefined} item
 * @param {{ logContext?: string }} [options]
 */
export function resolveExecutiveRankingListingImage(item, options = {}) {
  const fromApi = pickTopRankingImageUrl(item);
  if (fromApi) {
    if (import.meta.env.DEV && options.logContext) {
      logRankingThumbDev({
        context: options.logContext,
        listing_id: item?.listing_id ?? null,
        external_listing_id: item?.external_listing_id ?? null,
        match: true,
        source: "api_payload",
        url: fromApi,
      });
    }
    return { url: fromApi, source: "api_payload" };
  }
  return { url: "", source: "" };
}

/** @deprecated use resolveExecutiveRankingListingImage */
export function resolveExecutiveRankingThumbUrl(item) {
  return resolveExecutiveRankingListingImage(item).url;
}

/**
 * @param {Record<string, unknown>} catalogRow
 */
function catalogRowToImage(catalogRow) {
  const { url, source } = extractListingImageFromRecord(catalogRow);
  return { url, source: source ? `marketplace_listings.${source}` : "" };
}

/**
 * @param {Record<string, unknown>} payload
 */
function logRankingThumbDev(payload) {
  if (!import.meta.env.DEV) return;
  console.info("[S7 Ranking Thumb]", payload);
}

/**
 * @param {string} userId
 * @param {Record<string, unknown>[]} rows
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchExecutiveRankingThumbMap(userId, rows) {
  if (!userId || !Array.isArray(rows) || rows.length === 0) return {};

  /** @type {Set<string>} */
  const externalKeys = new Set();
  /** @type {Set<string>} */
  const uuidKeys = new Set();

  for (const row of rows) {
    for (const key of collectRankingCatalogLookupKeys(row)) {
      if (isUuidLike(key)) uuidKeys.add(key);
      else if (isLikelyExternalListingId(key)) externalKeys.add(key);
    }
  }

  /** @type {Record<string, string>} */
  const map = {};
  /** @type {Record<string, { source: string }>} */
  const sourceByKey = {};

  const ingestCatalogRow = (catalogRow) => {
    if (!catalogRow || typeof catalogRow !== "object") return;
    const { url, source } = catalogRowToImage(catalogRow);
    if (!url) return;

    const ext =
      catalogRow.external_listing_id != null ? String(catalogRow.external_listing_id).trim() : "";
    const id = catalogRow.id != null ? String(catalogRow.id).trim() : "";

    if (ext) {
      map[ext] = url;
      sourceByKey[ext] = { source };
    }
    if (id) {
      map[id] = url;
      sourceByKey[id] = { source };
    }
  };

  const externalList = [...externalKeys];
  for (let i = 0; i < externalList.length; i += CHUNK_SIZE) {
    const chunk = externalList.slice(i, i + CHUNK_SIZE);
    const { rows: catalogRows, selectUsed } = await fetchMarketplaceListingRows(
      userId,
      "external_listing_id",
      chunk,
    );

    logRankingThumbDev({
      phase: "external_listing_id",
      select: selectUsed,
      rows_requested: chunk.length,
      rows_found: catalogRows.length,
    });

    for (const row of catalogRows) {
      ingestCatalogRow(row);
    }
  }

  const uuidList = [...uuidKeys].filter((id) => !map[id]);
  for (let i = 0; i < uuidList.length; i += CHUNK_SIZE) {
    const chunk = uuidList.slice(i, i + CHUNK_SIZE);
    const { rows: catalogRows, selectUsed } = await fetchMarketplaceListingRows(userId, "id", chunk);

    logRankingThumbDev({
      phase: "id",
      select: selectUsed,
      rows_requested: chunk.length,
      rows_found: catalogRows.length,
    });

    for (const row of catalogRows) {
      ingestCatalogRow(row);
    }
  }

  if (import.meta.env.DEV) {
    for (const row of rows) {
      const listingId = row?.listing_id != null ? String(row.listing_id).trim() : "";
      const extId = row?.external_listing_id != null ? String(row.external_listing_id).trim() : "";
      const resolved =
        (extId && map[extId]) ||
        (listingId && map[listingId]) ||
        "";
      const usedKey = extId && map[extId] ? extId : listingId && map[listingId] ? listingId : "";
      const meta = usedKey ? sourceByKey[usedKey] : null;

      logRankingThumbDev({
        listing_id: listingId || null,
        external_listing_id: extId || null,
        catalog_lookup_keys: collectRankingCatalogLookupKeys(row),
        match: Boolean(resolved),
        source: meta?.source ?? null,
        url: resolved || null,
      });
    }
  }

  return map;
}

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, string>} thumbMap
 */
export function mergeExecutiveRankingRowThumb(row, thumbMap) {
  if (!row || typeof row !== "object") return row;

  const fromApi = resolveExecutiveRankingListingImage(row).url;
  let thumb = fromApi;
  let mergeSource = fromApi ? "api_payload" : "";

  if (!thumb) {
    for (const key of collectRankingCatalogLookupKeys(row)) {
      const hit = key ? thumbMap[key] : "";
      if (hit) {
        thumb = hit;
        mergeSource = "marketplace_listings";
        break;
      }
    }
  }

  if (!thumb) return row;

  if (import.meta.env.DEV) {
    logRankingThumbDev({
      phase: "merge",
      listing_id: row.listing_id ?? null,
      external_listing_id: row.external_listing_id ?? null,
      match: true,
      source: mergeSource,
      url: thumb,
    });
  }

  return {
    ...row,
    image_url: thumb,
    listing_thumbnail_url: row.listing_thumbnail_url ?? thumb,
    product_thumbnail_url: row.product_thumbnail_url ?? thumb,
    thumbnail_url: row.thumbnail_url ?? thumb,
    listing:
      row.listing != null && typeof row.listing === "object"
        ? {
            .../** @type {Record<string, unknown>} */ (row.listing),
            image_url: thumb,
            thumbnail: /** @type {Record<string, unknown>} */ (row.listing).thumbnail ?? thumb,
            thumbnail_url: /** @type {Record<string, unknown>} */ (row.listing).thumbnail_url ?? thumb,
          }
        : {
            image_url: thumb,
            thumbnail: thumb,
            thumbnail_url: thumb,
          },
  };
}

export { pickTopRankingFallbackImageUrl };
