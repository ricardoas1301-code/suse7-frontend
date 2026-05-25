// =============================================================================

// Dev Center S_4.7.3 / S_4.8.1 / S_4.8.2 / S_4.8.3 — cache detailContract (drawer global)

//

// LGPD: JSON mascarado da API admin global.

// Cross-seller: admin_global:{userId}:{id}

// Permissões: cache NUNCA concede acesso — limpo ao negar/trocar usuário (S_4.8.3).

// Sem localStorage. TTL 90s, max 8 FIFO.

// =============================================================================



import { isDetailContractSyncStale } from "../../components/devCenter/ops/opsPresentation.js";
import { isValidDevCenterGlobalCustomerId } from "./devCenterCustomersGlobalInput.js";



export const DEV_CENTER_DETAIL_CACHE_SCOPE = "admin_global";



export const DEV_CENTER_DETAIL_CACHE_TTL_MS = 90_000;

export const DEV_CENTER_DETAIL_CACHE_MAX_ENTRIES = 8;



/** @typedef {{ contract: Record<string, unknown>; fetchedAt: number }} DetailCacheEntry */



/** @type {Map<string, DetailCacheEntry>} */

const store = new Map();



/** @type {string | null} */

let boundUserId = null;



export { isDetailContractSyncStale };



/** Limpa todo o cache — logout, negação ou troca de sessão. */

export function clearDevCenterGlobalDetailCache() {

  store.clear();

}



/**

 * Vincula cache ao usuário autorizado — troca de userId invalida entradas anteriores.

 * @param {string | null | undefined} userId

 */

export function bindDevCenterGlobalDetailCacheUser(userId) {

  const next = userId != null && String(userId).trim() ? String(userId) : null;

  if (boundUserId && next && boundUserId !== next) {

    store.clear();

  }

  if (!next) {

    store.clear();

  }

  boundUserId = next;

}



/** @param {string} id */

export function buildDevCenterGlobalDetailCacheKey(id) {

  const uid = boundUserId ?? "_unbound";

  return `${DEV_CENTER_DETAIL_CACHE_SCOPE}:${uid}:${String(id)}`;

}



/** @param {DetailCacheEntry} entry @param {number} [now] */

export function isDetailCacheEntryFresh(entry, now = Date.now()) {

  return now - entry.fetchedAt <= DEV_CENTER_DETAIL_CACHE_TTL_MS;

}



/** @param {string} id */

export function getDevCenterGlobalDetailCache(id) {

  if (!boundUserId || !isValidDevCenterGlobalCustomerId(id)) return null;

  return store.get(buildDevCenterGlobalDetailCacheKey(id)) ?? null;

}



/** @param {string} id @param {Record<string, unknown>} contract */

export function setDevCenterGlobalDetailCache(id, contract) {

  if (!boundUserId || !isValidDevCenterGlobalCustomerId(id)) return;

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

 */

export function resolveDevCenterDetailFetch(id, cached) {

  if (!id || !boundUserId || !isValidDevCenterGlobalCustomerId(id)) return { fetch: false, reason: "miss" };

  if (!cached) return { fetch: true, reason: "miss" };

  if (!isDetailCacheEntryFresh(cached)) return { fetch: true, reason: "ttl_expired" };

  if (isDetailContractSyncStale(cached.contract)) return { fetch: true, reason: "sync_stale" };

  return { fetch: false, reason: "hit" };

}


