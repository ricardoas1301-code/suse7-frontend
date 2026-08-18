// ======================================================================
// Hidratação bulk + snapshot — qualidade do anúncio (paridade Resumo).
// Sem N+1: contrato GET /api/ml/listings.
// ======================================================================

import { resolveCanonicalListingQualityScore } from "./resolveCanonicalListingQualityScore.js";
import { toScorePercentCanonico } from "./resolveCanonicalListingRegistrationScore.js";

/**
 * @param {unknown} accountId
 * @param {unknown} listingId
 * @returns {string}
 */
export function buildListingQualityIdentityKey(accountId, listingId) {
  const account = accountId != null ? String(accountId).trim() : "";
  const listing = listingId != null ? String(listingId).trim() : "";
  if (!account || !listing) return "";
  return `${account}::${listing}`;
}

/**
 * Extrai score oficial de qualidade do payload bulk da grid.
 * Somente campos comprovados: health_listing_quality_score / listing_quality_score.
 *
 * @param {Record<string, unknown> | null | undefined} raw
 * @returns {number | null}
 */
export function parseListingQualityScoreFromGridPayload(raw) {
  if (raw == null || typeof raw !== "object") return null;

  for (const candidate of [
    raw.listing_quality_score_percent,
    raw.health_listing_quality_score,
    raw.listing_quality_score,
    raw.listingQualityScore,
  ]) {
    const normalized = toScorePercentCanonico(candidate);
    if (normalized != null) return normalized;
  }

  return null;
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function hydrateCatalogRowCanonicalListingQuality(row) {
  const listingQualityParsed =
    row.listingQualityScore != null
      ? toScorePercentCanonico(row.listingQualityScore)
      : parseListingQualityScoreFromGridPayload(row);

  const scoreCanonico = resolveCanonicalListingQualityScore({
    ...row,
    listingQualityScore: listingQualityParsed,
    listing_quality_score: listingQualityParsed,
    health_listing_quality_score: listingQualityParsed,
    listingQualityScorePercent: listingQualityParsed,
  });

  return {
    ...row,
    listingQualityScore: listingQualityParsed ?? row.listingQualityScore ?? null,
    listingQualityScorePercent: scoreCanonico,
    listing_quality_score: listingQualityParsed ?? row.listing_quality_score ?? null,
    health_listing_quality_score: listingQualityParsed ?? row.health_listing_quality_score ?? null,
  };
}

/** @deprecated Alias legado — usar hydrateCatalogRowCanonicalListingQuality */
export function hydrateCatalogRowCanonicalRegistrationQuality(row) {
  return hydrateCatalogRowCanonicalListingQuality(row);
}

/**
 * @param {Record<string, unknown>[]} rows
 * @returns {Map<string, number>}
 */
export function buildListingQualityScoreByIdentityMap(rows) {
  /** @type {Map<string, number>} */
  const map = new Map();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    if (row == null || typeof row !== "object") continue;
    const hydrated = hydrateCatalogRowCanonicalListingQuality(row);
    const key = buildListingQualityIdentityKey(
      hydrated.marketplaceAccountId ?? hydrated.marketplace_account_id,
      hydrated.id,
    );
    const score = resolveCanonicalListingQualityScore(hydrated);
    if (!key || score == null) continue;
    map.set(key, score);
  }

  return map;
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {Map<string, number>} qualityByIdentity
 * @returns {Record<string, unknown>[]}
 */
export function joinCatalogRowsWithQualityIdentityMap(rows, qualityByIdentity) {
  if (!Array.isArray(rows) || !(qualityByIdentity instanceof Map) || qualityByIdentity.size === 0) {
    return Array.isArray(rows) ? rows.map((row) => hydrateCatalogRowCanonicalListingQuality(row)) : [];
  }

  return rows.map((row) => {
    if (row == null || typeof row !== "object") return row;
    const hydrated = hydrateCatalogRowCanonicalListingQuality(row);
    const existing = resolveCanonicalListingQualityScore(hydrated);
    if (existing != null) return hydrated;

    const key = buildListingQualityIdentityKey(
      row.marketplaceAccountId ?? row.marketplace_account_id,
      row.id,
    );
    const fromMap = key ? qualityByIdentity.get(key) ?? null : null;
    if (fromMap == null) return hydrated;

    return hydrateCatalogRowCanonicalListingQuality({
      ...row,
      listingQualityScore: fromMap,
      listing_quality_score: fromMap,
      health_listing_quality_score: fromMap,
    });
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
export function buildListingQualityOpenSnapshot(row) {
  if (row == null || typeof row !== "object") return null;

  const accountId =
    row.marketplaceAccountId != null && String(row.marketplaceAccountId).trim() !== ""
      ? String(row.marketplaceAccountId).trim()
      : row.marketplace_account_id != null && String(row.marketplace_account_id).trim() !== ""
        ? String(row.marketplace_account_id).trim()
        : "";
  const listingId = row.id != null ? String(row.id).trim() : "";
  if (!listingId) return null;

  const score = resolveCanonicalListingQualityScore(hydrateCatalogRowCanonicalListingQuality(row));

  return {
    accountId,
    listingId,
    score,
    score_percent: score,
    source: "catalog_listing_quality_snapshot",
  };
}

/**
 * @param {{
 *   detailScore?: unknown;
 *   snapshotScore?: unknown;
 *   listingScore?: unknown;
 *   detailLoaded?: boolean;
 * }} input
 */
export function reconcileListingQualityScore(input) {
  const detailLoaded = input.detailLoaded === true;
  const detail = detailLoaded ? toScorePercentCanonico(input.detailScore) : null;
  const snapshot = toScorePercentCanonico(input.snapshotScore);
  const listing = toScorePercentCanonico(input.listingScore);

  if (detail != null) {
    return { score: detail, source: "mercado_livre_performance" };
  }
  if (snapshot != null) {
    return { score: snapshot, source: "catalog_listing_quality_snapshot" };
  }
  if (listing != null) {
    return { score: listing, source: "catalog_listing_quality_score" };
  }
  return { score: null, source: "unavailable" };
}
