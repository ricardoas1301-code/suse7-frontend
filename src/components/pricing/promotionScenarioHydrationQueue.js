// ======================================================
// S4.3.6.26 — Fila de hidratação com concorrência limitada + dedup.
// ======================================================

import { notificarRevisaoFinanceiraListing } from "./pricingFinancialScenarioStore.js";
import {
  filtrarManifestoParaHidratacao,
  montarManifestoPromocoesComparativo,
} from "./promotionOfferManifest.js";

/** Concorrência máxima de cenários em paralelo. */
export const PROMOTION_HYDRATION_MAX_CONCURRENCY = 3;

/**
 * @typedef {{
 *   montarChave: (params: Record<string, unknown>) => string;
 *   hidratar: (params: Record<string, unknown>) => Promise<{
 *     ok: boolean;
 *     fromCache?: boolean;
 *     estado?: unknown;
 *     error?: string;
 *   }>;
 * }} HydrationStrategyLike
 */

/** @type {HydrationStrategyLike | null} */
let hydrationStrategy = null;

/** Somente testes — injeta strategy sem endpoint. */
export function __debugSetPromotionHydrationStrategy(strategy) {
  hydrationStrategy = strategy;
}

/**
 * @returns {Promise<HydrationStrategyLike>}
 */
async function resolverStrategy() {
  if (hydrationStrategy != null) return hydrationStrategy;
  const m = await import("./MercadoLivrePromotionScenarioHydrationStrategy.js");
  hydrationStrategy = m.MercadoLivrePromotionScenarioHydrationStrategy;
  return /** @type {HydrationStrategyLike} */ (hydrationStrategy);
}

/**
 * @typedef {{
 *   id: string;
 *   listingKey: string;
 *   listingExternalId: string | null;
 *   listingId: string | null;
 *   listingType: "classic" | "premium";
 *   salePrice: number;
 *   scenario: unknown;
 *   selectionId: string;
 *   configuracaoFinanceira?: unknown;
 *   selectedFinalPriceOverride?: string | number | null;
 *   priority: number;
 *   revision: number;
 * }} HydrationJob
 */

/** @type {Map<string, Promise<unknown>>} */
const inflightByCacheKey = new Map();

/** @type {Set<string>} */
const queuedOrActiveIds = new Set();

/** Assinaturas já hidratadas com sucesso neste listing (evita requeue em re-render). */
/** @type {Set<string>} */
const completedJobIds = new Set();

/** @type {HydrationJob[]} */
let queue = [];

let activeCount = 0;
let listingEpoch = 0;
/** @type {string} */
let activeListingKey = "";

/**
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 */
function listingKeyOf(listingExternalId, listingId) {
  const ext = listingExternalId != null ? String(listingExternalId).trim() : "";
  const id = listingId != null ? String(listingId).trim() : "";
  return ext || id || "";
}

/**
 * Garante listing ativo sem cancelar hidratações em andamento do mesmo anúncio.
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 */
function ensureListingAtivo(listingExternalId, listingId) {
  const nextKey = listingKeyOf(listingExternalId, listingId);
  if (nextKey === "") return "";
  if (activeListingKey !== nextKey) {
    resetFilaHidratacaoPromocoes(listingExternalId, listingId);
  } else if (activeListingKey === "") {
    activeListingKey = nextKey;
  }
  return activeListingKey;
}

function pump() {
  while (activeCount < PROMOTION_HYDRATION_MAX_CONCURRENCY && queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const job = queue.shift();
    if (job == null) break;
    if (job.listingKey !== activeListingKey) {
      queuedOrActiveIds.delete(job.id);
      continue;
    }
    activeCount += 1;
    const epochAtStart = listingEpoch;
    void (async () => {
      try {
        const strategy = await resolverStrategy();
        const cacheKey = strategy.montarChave({
          listingExternalId: job.listingExternalId,
          listingId: job.listingId,
          listingType: job.listingType,
          salePrice: job.salePrice,
          scenario: job.scenario,
          configuracaoFinanceira: job.configuracaoFinanceira,
          selectedFinalPriceOverride: job.selectedFinalPriceOverride,
        });

        let promise = inflightByCacheKey.get(cacheKey);
        if (promise == null) {
          promise = strategy
            .hidratar({
              listingExternalId: job.listingExternalId,
              listingId: job.listingId,
              listingType: job.listingType,
              salePrice: job.salePrice,
              scenario: job.scenario,
              configuracaoFinanceira: job.configuracaoFinanceira,
              selectedFinalPriceOverride: job.selectedFinalPriceOverride,
              revision: job.revision,
            })
            .finally(() => {
              inflightByCacheKey.delete(cacheKey);
            });
          inflightByCacheKey.set(cacheKey, promise);
        }

        const result = /** @type {{ ok?: boolean; estado?: unknown; fromCache?: boolean }} */ (await promise);

        if (epochAtStart !== listingEpoch || job.listingKey !== activeListingKey) return;
        // Notifica só quando há dado novo no cache (Comparativo aberto reage; hit não spam).
        if (result?.ok && result.estado != null) {
          completedJobIds.add(job.id);
          if (result.fromCache !== true) {
            notificarRevisaoFinanceiraListing(job.listingExternalId, job.listingId);
          }
        }
      } finally {
        queuedOrActiveIds.delete(job.id);
        activeCount -= 1;
        pump();
      }
    })();
  }
}

/**
 * Cancela fila do anúncio anterior / troca de listing.
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 */
export function resetFilaHidratacaoPromocoes(listingExternalId, listingId) {
  const nextKey = listingKeyOf(listingExternalId, listingId);
  listingEpoch += 1;
  activeListingKey = nextKey;
  queue = queue.filter((j) => {
    if (j.listingKey === nextKey) return true;
    queuedOrActiveIds.delete(j.id);
    return false;
  });
  // Limpa completed de outros anúncios; mantém do listing atual se reaproveitável.
  for (const id of [...completedJobIds]) {
    if (!id.startsWith(`${nextKey}|`)) completedJobIds.delete(id);
  }
}

/**
 * Enfileira hidratação (dedup por id de job + inflight de cache key).
 * @param {Omit<HydrationJob, "id" | "listingKey"> & { id?: string }} job
 */
export function enfileirarHidratacaoPromocao(job) {
  const listingKey = listingKeyOf(job.listingExternalId, job.listingId);
  if (listingKey === "") return;
  ensureListingAtivo(job.listingExternalId, job.listingId);
  const id =
    job.id != null
      ? String(job.id)
      : `${listingKey}|${job.listingType}|${job.selectionId}|${job.salePrice}`;
  if (queuedOrActiveIds.has(id) || completedJobIds.has(id)) return;
  queuedOrActiveIds.add(id);
  queue.push({
    ...job,
    id,
    listingKey,
    revision: job.revision ?? listingEpoch,
  });
  pump();
}

/**
 * Agenda hidratação automática de todo o manifesto elegível.
 * Não cancela a fila do mesmo anúncio (só troca de listing cancela).
 * @param {{
 *   opcoes: { row: { scenario: unknown }; selectionId: string }[];
 *   obterPrecoManual?: ((selectionId: string) => { priceBrl?: string } | null) | null;
 *   promocaoAtivaId?: string | null;
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   configuracaoFinanceira?: unknown;
 * }} params
 */
export function agendarHidratacaoAutomaticaManifesto(params) {
  const manifesto = montarManifestoPromocoesComparativo({
    opcoes: params.opcoes,
    obterPrecoManual: params.obterPrecoManual,
    promocaoAtivaId: params.promocaoAtivaId,
  });
  const elegiveis = filtrarManifestoParaHidratacao(manifesto);
  ensureListingAtivo(params.listingExternalId, params.listingId);
  for (const entry of elegiveis) {
    enfileirarHidratacaoPromocao({
      listingExternalId: params.listingExternalId ?? null,
      listingId: params.listingId ?? null,
      listingType: params.listingType,
      salePrice: /** @type {number} */ (entry.salePrice),
      scenario: entry.scenario,
      selectionId: entry.selectionId,
      configuracaoFinanceira: params.configuracaoFinanceira,
      selectedFinalPriceOverride: entry.salePriceBrl,
      priority: entry.priority,
      revision: listingEpoch,
    });
  }
  return { manifesto, elegiveisCount: elegiveis.length };
}

/**
 * Write-through imediato (sem debounce) após confirmação de preço promocional.
 * Publica no cache compartilhado e notifica o SSOT/Comparativo.
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   salePrice: number;
 *   scenario: unknown;
 *   selectionId: string;
 *   configuracaoFinanceira?: unknown;
 *   selectedFinalPriceOverride?: string | number | null;
 *   revision: number;
 * }} params
 */
export async function writeThroughHidratacaoPromocaoConfirmada(params) {
  const listingKey = listingKeyOf(params.listingExternalId, params.listingId);
  if (listingKey === "") return { ok: false, error: "listing_missing" };
  ensureListingAtivo(params.listingExternalId, params.listingId);

  // Invalida assinaturas anteriores desta promoção (preço mudou).
  const selectionPrefix = `${listingKey}|${params.listingType}|${params.selectionId}|`;
  for (const id of [...completedJobIds]) {
    if (id.startsWith(selectionPrefix)) completedJobIds.delete(id);
  }

  const strategy = await resolverStrategy();
  const cacheKey = strategy.montarChave({
    listingExternalId: params.listingExternalId,
    listingId: params.listingId,
    listingType: params.listingType,
    salePrice: params.salePrice,
    scenario: params.scenario,
    configuracaoFinanceira: params.configuracaoFinanceira,
    selectedFinalPriceOverride: params.selectedFinalPriceOverride,
  });

  let promise = inflightByCacheKey.get(cacheKey);
  if (promise == null) {
    promise = strategy
      .hidratar({
        listingExternalId: params.listingExternalId,
        listingId: params.listingId,
        listingType: params.listingType,
        salePrice: params.salePrice,
        scenario: params.scenario,
        configuracaoFinanceira: params.configuracaoFinanceira,
        selectedFinalPriceOverride: params.selectedFinalPriceOverride,
        revision: params.revision,
      })
      .finally(() => {
        inflightByCacheKey.delete(cacheKey);
      });
    inflightByCacheKey.set(cacheKey, promise);
  }

  const result = /** @type {{ ok?: boolean; estado?: unknown; fromCache?: boolean; error?: string }} */ (
    await promise
  );

  // Proteção de revisão: só publica se a revisão do job ainda for a mais recente do seller.
  // (Comparativo usa seqRef/resolveKey; aqui invalidamos notificação se listing mudou.)
  if (listingKeyOf(params.listingExternalId, params.listingId) !== activeListingKey) {
    return { ok: false, error: "stale_listing", revision: params.revision };
  }

  if (result.ok && result.estado != null) {
    const id = `${listingKey}|${params.listingType}|${params.selectionId}|${params.salePrice}`;
    completedJobIds.add(id);
    notificarRevisaoFinanceiraListing(params.listingExternalId, params.listingId);
  }
  return result;
}

/** Somente testes. */
export function __debugFilaHidratacaoPromocoes() {
  return {
    queueLength: queue.length,
    activeCount,
    inflight: inflightByCacheKey.size,
    queuedOrActive: queuedOrActiveIds.size,
    listingEpoch,
    activeListingKey,
    maxConcurrency: PROMOTION_HYDRATION_MAX_CONCURRENCY,
  };
}

/** Somente testes. */
export function __debugResetFilaHidratacaoPromocoes() {
  queue = [];
  activeCount = 0;
  inflightByCacheKey.clear();
  queuedOrActiveIds.clear();
  completedJobIds.clear();
  listingEpoch += 1;
  activeListingKey = "";
  hydrationStrategy = null;
}
