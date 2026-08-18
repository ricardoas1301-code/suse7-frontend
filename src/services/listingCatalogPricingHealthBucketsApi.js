// ======================================================================
// GET /api/ml/listings/catalog-pricing-health-buckets — buckets SSOT por anúncio
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";
import { ensureAuthSessionBootstrapped, getAuthBootstrapAccessToken } from "../auth/authBootstrapService";

const CACHE_TTL_MS = 45_000;

/** @type {{ key: string; expiresAt: number; value: any } | null} */
let healthBucketsCacheEntry = null;
/** @type {{ key: string; promise: Promise<any> } | null} */
let healthBucketsInflightEntry = null;

/** Limpa cache client-side (pós-save de custos / refresh explícito). */
export function invalidateListingCatalogPricingHealthBucketsCache() {
  healthBucketsCacheEntry = null;
  healthBucketsInflightEntry = null;
}

function cloneBucketsResult(result) {
  return {
    ...result,
    byMarketplaceListingId: { ...(result?.byMarketplaceListingId ?? {}) },
    byExternalListingId: { ...(result?.byExternalListingId ?? {}) },
  };
}

/**
 * @param {{ refresh?: boolean }} [options]
 * @returns {Promise<{
 *   ok: boolean;
 *   byMarketplaceListingId: Record<string, Record<string, unknown>>;
 *   byExternalListingId: Record<string, Record<string, unknown>>;
 *   error?: string;
 *   status: number;
 * }>}
 */
export async function fetchListingCatalogPricingHealthBuckets(options = {}) {
  const forceRefresh = options.refresh === true;
  const base = buildApiUrl("/api/ml/listings/catalog-pricing-health-buckets");
  if (!base) {
    return {
      ok: false,
      byMarketplaceListingId: {},
      byExternalListingId: {},
      error: "Configure VITE_API_BASE_URL.",
      status: 0,
    };
  }

  await ensureAuthSessionBootstrapped();
  const tokenPreview = getAuthBootstrapAccessToken();
  const requestKey = `${base}::${Boolean(tokenPreview)}::${tokenPreview ? String(tokenPreview).slice(0, 16) : ""}::${forceRefresh ? "refresh" : "cached"}`;

  if (!forceRefresh && healthBucketsCacheEntry && healthBucketsCacheEntry.key === requestKey) {
    const cacheRemaining = healthBucketsCacheEntry.expiresAt - Date.now();
    if (cacheRemaining > 0) {
      return cloneBucketsResult(healthBucketsCacheEntry.value);
    }
  }

  if (healthBucketsInflightEntry && healthBucketsInflightEntry.key === requestKey) {
    const joined = await healthBucketsInflightEntry.promise;
    return cloneBucketsResult(joined);
  }

  const runFetch = async () => {
    const url = forceRefresh ? `${base}${base.includes("?") ? "&" : "?"}refresh=1` : base;
    const res = await apiFetch(url, { method: "GET", timeoutMs: 120_000 });
    if (!res.ok) {
      return {
        ok: false,
        byMarketplaceListingId: {},
        byExternalListingId: {},
        error: res.error ?? "Não foi possível carregar buckets de saúde da precificação.",
        status: res.status,
      };
    }

    const data = res.data != null && typeof res.data === "object" ? res.data : null;
    if (data?.ok !== true) {
      return {
        ok: false,
        byMarketplaceListingId: {},
        byExternalListingId: {},
        error: "Resposta inválida dos buckets de saúde da precificação.",
        status: res.status,
      };
    }

    const byMarketplaceListingId =
      data.by_marketplace_listing_id != null && typeof data.by_marketplace_listing_id === "object"
        ? /** @type {Record<string, Record<string, unknown>>} */ (data.by_marketplace_listing_id)
        : {};
    const byExternalListingId =
      data.by_external_listing_id != null && typeof data.by_external_listing_id === "object"
        ? /** @type {Record<string, Record<string, unknown>>} */ (data.by_external_listing_id)
        : {};

    return {
      ok: true,
      byMarketplaceListingId,
      byExternalListingId,
      status: res.status,
    };
  };

  const runPromise = runFetch();
  healthBucketsInflightEntry = { key: requestKey, promise: runPromise };
  try {
    const result = await runPromise;
    if (result.ok) {
      healthBucketsCacheEntry = {
        key: requestKey,
        expiresAt: Date.now() + CACHE_TTL_MS,
        value: cloneBucketsResult(result),
      };
    }
    return result;
  } finally {
    if (healthBucketsInflightEntry?.promise === runPromise) {
      healthBucketsInflightEntry = null;
    }
  }
}

/**
 * @param {Record<string, unknown>} row
 * @param {{
 *   byMarketplaceListingId: Record<string, Record<string, unknown>>;
 *   byExternalListingId: Record<string, Record<string, unknown>>;
 * }} maps
 */
export function mergeListingCatalogPricingHealthBucketsRow(row, maps) {
  const base = row && typeof row === "object" ? { ...row } : {};
  const listingId = base.id != null ? String(base.id).trim() : "";
  const externalId =
    base.externalId != null && String(base.externalId).trim() !== ""
      ? String(base.externalId).trim()
      : base.external_listing_id != null
        ? String(base.external_listing_id).trim()
        : "";

  const buckets =
    (listingId && maps.byMarketplaceListingId[listingId]) ||
    (externalId && maps.byExternalListingId[externalId]) ||
    null;

  if (buckets && typeof buckets === "object") {
    base.catalog_pricing_health_buckets = { ...buckets };
  }

  return base;
}
