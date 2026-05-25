// =============================================================================
// Dev Center S_4.7.3 / S_4.8.1 / S_4.8.2 — cache in-memory do detailContract (drawer global)
//
// LGPD: armazena apenas o JSON já mascarado retornado pela API admin global.
// Cross-seller: chave prefixada admin_global — não mistura domínio seller.
// Sem localStorage/sessionStorage. TTL 90s, max 8 entradas FIFO.
// =============================================================================

import { isDetailContractSyncStale } from "../../components/devCenter/ops/opsPresentation.js";

/** Escopo explícito — evita colisão se outro cache usar o mesmo id em contexto diferente. */
export const DEV_CENTER_DETAIL_CACHE_SCOPE = "admin_global";

/** TTL curto — mesmo cliente reaberto dentro da janela evita refetch. */
export const DEV_CENTER_DETAIL_CACHE_TTL_MS = 90_000;

/** Memória leve — entradas mais antigas evictadas (FIFO). */
export const DEV_CENTER_DETAIL_CACHE_MAX_ENTRIES = 8;

/** @typedef {{ contract: Record<string, unknown>; fetchedAt: number }} DetailCacheEntry */

/** @type {Map<string, DetailCacheEntry>} */
const store = new Map();

export { isDetailContractSyncStale };

/** @param {string} id */
export function buildDevCenterGlobalDetailCacheKey(id) {
  return `${DEV_CENTER_DETAIL_CACHE_SCOPE}:${String(id)}`;
}

/** @param {DetailCacheEntry} entry @param {number} [now] */
export function isDetailCacheEntryFresh(entry, now = Date.now()) {
  return now - entry.fetchedAt <= DEV_CENTER_DETAIL_CACHE_TTL_MS;
}

/** @param {string} id */
export function getDevCenterGlobalDetailCache(id) {
  return store.get(buildDevCenterGlobalDetailCacheKey(id)) ?? null;
}

/** @param {string} id @param {Record<string, unknown>} contract */
export function setDevCenterGlobalDetailCache(id, contract) {
  store.set(buildDevCenterGlobalDetailCacheKey(id), { contract, fetchedAt: Date.now() });
  while (store.size > DEV_CENTER_DETAIL_CACHE_MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest == null) break;
    store.delete(oldest);
  }
}

/**
 * @param {string} id
 * @param {DetailCacheEntry | null | undefined} cached
 * @returns {{ fetch: boolean; reason: "miss" | "hit" | "ttl_expired" | "sync_stale" }}
 */
export function resolveDevCenterDetailFetch(id, cached) {
  if (!id) return { fetch: false, reason: "miss" };
  if (!cached) return { fetch: true, reason: "miss" };
  if (!isDetailCacheEntryFresh(cached)) return { fetch: true, reason: "ttl_expired" };
  if (isDetailContractSyncStale(cached.contract)) return { fetch: true, reason: "sync_stale" };
  return { fetch: false, reason: "hit" };
}
