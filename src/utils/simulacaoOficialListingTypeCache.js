// ======================================================
// S4.3.6.22 — Cache compartilhado da simulação oficial por listing type.
// Usado pelos cards Classic/Premium e pelo Comparativo de Ofertas.
// Dedup in-flight + latest-wins por chave estável.
// ======================================================

import { chaveCacheSimulacaoOficial } from "./simulateListingTypeScenarioKeys.js";

/**
 * @typedef {{
 *   scenario: unknown;
 *   loading: boolean;
 *   erro: string | null;
 *   resolvedPrice: number | null;
 *   resolvedMargin: number | null;
 *   commissionSource: string | null;
 *   feePercent: string | null;
 *   key: string | null;
 * }} EstadoSimulacaoTipoCache
 */

/** @type {Map<string, EstadoSimulacaoTipoCache>} */
const cacheStore = new Map();

/** @type {Map<string, Promise<EstadoSimulacaoTipoCache | null>>} */
const inflightStore = new Map();

/**
 * @param {Parameters<typeof chaveCacheSimulacaoOficial>[0]} params
 */
export function montarChaveCacheSimulacaoOficialShared(params) {
  return chaveCacheSimulacaoOficial(params);
}

/** @param {string} key */
export function peekSimulacaoOficialCache(key) {
  if (key == null || String(key).trim() === "") return null;
  return cacheStore.get(String(key)) ?? null;
}

/** @param {string} key @param {EstadoSimulacaoTipoCache} value */
export function setSimulacaoOficialCache(key, value) {
  if (key == null || String(key).trim() === "") return;
  cacheStore.set(String(key), { ...value, loading: false });
}

/** @param {string} key */
export function hasSimulacaoOficialCache(key) {
  return peekSimulacaoOficialCache(key) != null;
}

/** @param {string} key */
export function hasSimulacaoOficialInflight(key) {
  return inflightStore.has(String(key));
}

/**
 * Invalida entradas cujo key contém o prefixo (ex.: listing external id).
 * @param {string | null | undefined} listingPrefix
 */
export function invalidateSimulacaoOficialCacheByListing(listingPrefix) {
  const p = listingPrefix != null ? String(listingPrefix).trim() : "";
  if (p === "") {
    cacheStore.clear();
    inflightStore.clear();
    return;
  }
  for (const key of [...cacheStore.keys()]) {
    if (key.startsWith(p) || key.includes(`|${p}|`) || key.startsWith(`${p}|`)) {
      cacheStore.delete(key);
    }
  }
  for (const key of [...inflightStore.keys()]) {
    if (key.startsWith(p) || key.includes(`|${p}|`) || key.startsWith(`${p}|`)) {
      inflightStore.delete(key);
    }
  }
}

/**
 * S4.3.6.25 — invalida chaves do listing, opcionalmente preservando uma chave atual.
 * @param {string | null | undefined} listingPrefix
 * @param {(key: string) => boolean} [shouldKeep]
 */
export function invalidateSimulacaoOficialCacheKeysMatching(listingPrefix, shouldKeep) {
  const p = listingPrefix != null ? String(listingPrefix).trim() : "";
  if (p === "") {
    if (typeof shouldKeep !== "function") {
      cacheStore.clear();
      inflightStore.clear();
      return;
    }
    for (const key of [...cacheStore.keys()]) {
      if (!shouldKeep(key)) cacheStore.delete(key);
    }
    for (const key of [...inflightStore.keys()]) {
      if (!shouldKeep(key)) inflightStore.delete(key);
    }
    return;
  }
  const matchesListing = (/** @type {string} */ key) =>
    key.startsWith(p) || key.includes(`|${p}|`) || key.startsWith(`${p}|`);
  for (const key of [...cacheStore.keys()]) {
    if (!matchesListing(key)) continue;
    if (typeof shouldKeep === "function" && shouldKeep(key)) continue;
    cacheStore.delete(key);
  }
  for (const key of [...inflightStore.keys()]) {
    if (!matchesListing(key)) continue;
    if (typeof shouldKeep === "function" && shouldKeep(key)) continue;
    inflightStore.delete(key);
  }
}

/**
 * Invalidação ampla (preço/custo mudou de forma que a chave muda naturalmente;
 * útil em testes ou reset de sessão).
 */
export function clearSimulacaoOficialCache() {
  cacheStore.clear();
  inflightStore.clear();
}

/**
 * Dedup: uma única promise por chave; popula o cache ao concluir com sucesso.
 *
 * @param {string} key
 * @param {() => Promise<EstadoSimulacaoTipoCache | null>} fetcher
 * @returns {Promise<{ estado: EstadoSimulacaoTipoCache | null; fromCache: boolean; deduped: boolean }>}
 */
export async function getOrFetchSimulacaoOficialCache(key, fetcher) {
  const k = String(key);
  const hit = cacheStore.get(k);
  if (hit != null && hit.scenario != null) {
    return { estado: hit, fromCache: true, deduped: false };
  }

  const existing = inflightStore.get(k);
  if (existing != null) {
    const estado = await existing;
    return { estado, fromCache: false, deduped: true };
  }

  const promise = (async () => {
    try {
      const estado = await fetcher();
      if (estado != null && estado.scenario != null) {
        cacheStore.set(k, { ...estado, loading: false, erro: null, key: k });
        return cacheStore.get(k) ?? estado;
      }
      return estado;
    } finally {
      inflightStore.delete(k);
    }
  })();

  inflightStore.set(k, promise);
  const estado = await promise;
  return { estado, fromCache: false, deduped: false };
}

/** Somente testes. */
export function __debugSimulacaoOficialCacheSize() {
  return { cache: cacheStore.size, inflight: inflightStore.size };
}
