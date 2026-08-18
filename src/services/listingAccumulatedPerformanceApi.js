// ======================================================================
// Bootstrap SSOT — desempenho acumulado do PI (anúncio + produto).
// ======================================================================

import { buildApiUrl, apiFetch } from "../config/api";
import {
  ensureAuthSessionBootstrapped,
  getAuthBootstrapAccessToken,
} from "../auth/authBootstrapService";
import {
  ACCUMULATED_BOOTSTRAP_CACHE_VERSION,
  buildAccumulatedPerformanceBootstrapCacheKey,
  buildAccumulatedPerformanceBootstrapContext,
  describeAccumulatedScopeRejection,
  isAtomicCompleteAccumulatedScope,
  mergeAccumulatedPerformanceSnapshot,
  resolveCanonicalProductIdFromListingRow,
  rowHasCompleteAccumulatedPerformance,
  rowNeedsProductAccumulatedBootstrap,
} from "./listingAccumulatedPerformanceContract.js";

export {
  ACCUMULATED_BOOTSTRAP_CACHE_VERSION,
  buildAccumulatedPerformanceBootstrapCacheKey,
  buildAccumulatedPerformanceBootstrapContext,
  describeAccumulatedScopeRejection,
  isAtomicCompleteAccumulatedScope,
  mergeAccumulatedPerformanceSnapshot,
  resolveCanonicalProductIdFromListingRow,
  rowHasCompleteAccumulatedPerformance,
  rowNeedsProductAccumulatedBootstrap,
};

/** @type {Map<string, Promise<Record<string, unknown> | null>>} */
const inflightByKey = new Map();
/** @type {Map<string, { expiresAt: number; payload: Record<string, unknown>; complete: boolean }>} */
const cacheByKey = new Map();

const CACHE_TTL_COMPLETE_MS = 45_000;
const CACHE_TTL_ERROR_MS = 5_000;
const BOOTSTRAP_TIMEOUT_MS = 120_000;

/**
 * @param {Record<string, unknown>} ctx
 * @returns {Promise<{
 *   accumulated_performance: Record<string, unknown>;
 *   cache_hit: boolean;
 *   cache_miss: boolean;
 *   inflight_hit: boolean;
 *   cache_key: string;
 *   http_status: number | null;
 * } | null>}
 */
export async function fetchListingAccumulatedPerformanceBootstrap(ctx) {
  const bootstrapCtx = {
    internalListingId: ctx.internalListingId != null ? String(ctx.internalListingId).trim() : "",
    externalListingId: ctx.externalListingId != null ? String(ctx.externalListingId).trim() : "",
    marketplace: ctx.marketplace != null ? String(ctx.marketplace).trim() : "",
    marketplaceAccountId:
      ctx.marketplaceAccountId != null ? String(ctx.marketplaceAccountId).trim() : "",
    productId: ctx.productId != null ? String(ctx.productId).trim() : "",
    sku: ctx.sku != null ? String(ctx.sku).trim() : "",
  };

  const cacheKey = buildAccumulatedPerformanceBootstrapCacheKey(bootstrapCtx);
  const cached = cacheByKey.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() && cached.complete) {
    return {
      accumulated_performance: cached.payload,
      cache_hit: true,
      cache_miss: false,
      inflight_hit: false,
      cache_key: cacheKey,
      http_status: 200,
    };
  }

  const inflight = inflightByKey.get(cacheKey);
  if (inflight) {
    const payload = await inflight;
    return payload
      ? {
          accumulated_performance: payload,
          cache_hit: true,
          cache_miss: false,
          inflight_hit: true,
          cache_key: cacheKey,
          http_status: 200,
        }
      : null;
  }

  const url = buildApiUrl("/api/ml/listings/accumulated-performance");
  if (!url || !bootstrapCtx.externalListingId) return null;

  const params = new URLSearchParams({ external_listing_id: bootstrapCtx.externalListingId });
  if (bootstrapCtx.marketplace) params.set("marketplace", bootstrapCtx.marketplace);
  if (bootstrapCtx.marketplaceAccountId) {
    params.set("marketplace_account_id", bootstrapCtx.marketplaceAccountId);
  }
  if (bootstrapCtx.productId) params.set("product_id", bootstrapCtx.productId);
  if (bootstrapCtx.internalListingId) params.set("listing_id", bootstrapCtx.internalListingId);

  const requestUrl = `${url}?${params.toString()}`;

  const promise = (async () => {
    await ensureAuthSessionBootstrapped();
    const token = getAuthBootstrapAccessToken();
    if (!token) return null;

    const res = await apiFetch(requestUrl, {
      method: "GET",
      timeoutMs: BOOTSTRAP_TIMEOUT_MS,
    });
    if (!res.ok) {
      cacheByKey.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_ERROR_MS,
        payload: /** @type {Record<string, unknown>} */ ({}),
        complete: false,
      });
      return null;
    }
    const ap = res.data?.accumulated_performance;
    if (ap == null || typeof ap !== "object") return null;
    return /** @type {Record<string, unknown>} */ (ap);
  })();

  inflightByKey.set(cacheKey, promise);
  try {
    const payload = await promise;
    if (payload && isAtomicCompleteAccumulatedScope(payload.product)) {
      cacheByKey.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_COMPLETE_MS,
        payload,
        complete: true,
      });
      return {
        accumulated_performance: payload,
        cache_hit: false,
        cache_miss: true,
        inflight_hit: false,
        cache_key: cacheKey,
        http_status: 200,
      };
    }
    if (payload) {
      cacheByKey.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_ERROR_MS,
        payload,
        complete: false,
      });
    }
    return payload
      ? {
          accumulated_performance: payload,
          cache_hit: false,
          cache_miss: true,
          inflight_hit: false,
          cache_key: cacheKey,
          http_status: 200,
        }
      : null;
  } finally {
    inflightByKey.delete(cacheKey);
  }
}

/**
 * @param {Record<string, unknown>} diag
 */
export function logPiProductAccumulatedBootstrapDev(diag) {
  if (import.meta.env.PROD) return;
  console.info("[S7_PI_PRODUCT_ACCUMULATED_BOOTSTRAP]", diag);
}
