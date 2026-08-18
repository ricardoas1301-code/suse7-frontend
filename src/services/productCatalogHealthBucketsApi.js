// ======================================================================
// GET /api/products/catalog-health-buckets — buckets SSOT por produto
// ======================================================================

import { apiFetch, buildApiUrl } from "../config/api";
import { ensureAuthSessionBootstrapped, getAuthBootstrapAccessToken } from "../auth/authBootstrapService";

const CACHE_TTL_MS = 45_000;

/** @type {{ key: string; expiresAt: number; value: any } | null} */
let healthBucketsCacheEntry = null;
/** @type {{ key: string; promise: Promise<any> } | null} */
let healthBucketsInflightEntry = null;

function cloneHealthBucketsResult(result) {
  return {
    ...result,
    byProductId: { ...(result?.byProductId ?? {}) },
  };
}

/**
 * @returns {Promise<{
 *   ok: boolean;
 *   byProductId: Record<string, Record<string, unknown>>;
 *   error?: string;
 *   status: number;
 * }>}
 */
export async function fetchProductCatalogHealthBuckets() {
  const base = buildApiUrl("/api/products/catalog-health-buckets");
  if (!base) {
    return {
      ok: false,
      byProductId: {},
      error: "Configure VITE_API_BASE_URL.",
      status: 0,
    };
  }

  await ensureAuthSessionBootstrapped();
  const tokenPreview = getAuthBootstrapAccessToken();
  const requestKey = `${base}::${Boolean(tokenPreview)}::${tokenPreview ? String(tokenPreview).slice(0, 16) : ""}`;

  if (healthBucketsCacheEntry && healthBucketsCacheEntry.key === requestKey) {
    const cacheRemaining = healthBucketsCacheEntry.expiresAt - Date.now();
    if (cacheRemaining > 0) {
      return cloneHealthBucketsResult(healthBucketsCacheEntry.value);
    }
  }

  if (healthBucketsInflightEntry && healthBucketsInflightEntry.key === requestKey) {
    const joined = await healthBucketsInflightEntry.promise;
    return cloneHealthBucketsResult(joined);
  }

  const runFetch = async () => {
    const res = await apiFetch(base, { method: "GET", timeoutMs: 90_000 });
    if (!res.ok) {
      return {
        ok: false,
        byProductId: {},
        error: res.error ?? "Não foi possível carregar buckets de saúde do catálogo.",
        status: res.status,
      };
    }

    const data = res.data != null && typeof res.data === "object" ? res.data : null;
    if (data?.ok !== true) {
      return {
        ok: false,
        byProductId: {},
        error: "Resposta inválida dos buckets de saúde.",
        status: res.status,
      };
    }

    const byProductId =
      data.by_product_id != null && typeof data.by_product_id === "object"
        ? /** @type {Record<string, Record<string, unknown>>} */ (data.by_product_id)
        : {};

    return {
      ok: true,
      byProductId,
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
        value: cloneHealthBucketsResult(result),
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
 * @param {Record<string, unknown>} product
 * @param {Record<string, Record<string, unknown>>} byProductId
 */
export function mergeProductCatalogHealthBucketsRow(product, byProductId) {
  const base = product && typeof product === "object" ? { ...product } : {};
  const pid = base.id != null ? String(base.id).trim() : "";
  if (!pid) return base;

  const buckets = byProductId[pid];
  if (buckets && typeof buckets === "object") {
    base.catalog_health_buckets = { ...buckets };
  }

  return base;
}
