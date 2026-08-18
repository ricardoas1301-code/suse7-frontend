// ======================================================================
// S7 — Concorrência: fila de cadastro + persistência resiliente
// ======================================================================

import { saveProductCompetitor, saveMonitoredListingCompetitor } from "../../services/competitionApi";
import {
  candidateToSavePayload,
  logBatchSavePayloadDev,
  snapshotCandidatoParaFila,
} from "./concorrenciaCompetitorDisplay";

export const SAVE_QUEUE_STATUS = {
  QUEUED: "queued",
  SAVING: "saving",
};

/** listing_id em voo no HTTP (evita duplicata simultânea no mesmo item). */
const inFlightListingIds = new Set();

/** @type {Map<string, 'queued'|'saving'>} */
const listingStatuses = new Map();

/** @type {Map<string, { items: object[]; running: boolean }>} */
const productQueues = new Map();

/** @type {Set<() => void>} */
const listeners = new Set();

function notifyListeners() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

export function subscribeCompetitorSaveQueue(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getListingSaveStatus(listingId) {
  const id = String(listingId || "").trim();
  return id ? listingStatuses.get(id) ?? null : null;
}

export function isCompetitorSaveInFlight(listingId) {
  const id = String(listingId || "").trim();
  if (!id) return false;
  return inFlightListingIds.has(id) || listingStatuses.has(id);
}

/** Slots ocupados (fila + processamento) para um anúncio monitorado ou produto. */
export function countProductPendingSlots(scopeId) {
  const sid = String(scopeId || "").trim();
  if (!sid) return 0;
  let n = 0;
  for (const [listingId, status] of listingStatuses) {
    if (!status) continue;
    const job = findQueueJobByListingId(listingId);
    if (!job) continue;
    const jobScope = String(
      job.monitoredListingId || job.product?.monitored_listing_id || job.product?.id || ""
    );
    if (jobScope === sid) n += 1;
  }
  return n;
}

function findQueueJobByListingId(listingId) {
  const lid = String(listingId || "").trim();
  for (const q of productQueues.values()) {
    for (const item of q.items) {
      if (String(item.candidate?.competitor_listing_id || "") === lid) return item;
    }
    if (q.current?.candidate && String(q.current.candidate.competitor_listing_id || "") === lid) {
      return q.current;
    }
  }
  return null;
}

/**
 * Executa cadastro no backend (uma requisição).
 */
export async function executarCadastroConcorrente({ product, monitoredListingId = null, candidate, linkUrl = null }) {
  const productId = product?.id;
  const monitoredId = monitoredListingId ?? product?.monitored_listing_id ?? null;
  const listingId = String(candidate?.competitor_listing_id || "").trim();
  if ((!productId && !monitoredId) || !listingId) {
    return { ok: false, error: "Dados do concorrente incompletos." };
  }
  if (inFlightListingIds.has(listingId)) {
    return { ok: false, code: "SAVE_IN_PROGRESS", error: "Cadastro já em andamento." };
  }

  inFlightListingIds.add(listingId);
  const linkTrim = linkUrl != null ? String(linkUrl).trim() : "";
  const payload = candidateToSavePayload(candidate, product, {
    linkUrl: linkTrim || null,
  });
  logBatchSavePayloadDev(payload);

  try {
    if (monitoredId && productId) {
      return await saveMonitoredListingCompetitor(monitoredId, productId, payload);
    }
    return await saveProductCompetitor(productId, payload);
  } finally {
    inFlightListingIds.delete(listingId);
  }
}

async function processProductQueue(productId) {
  const pid = String(productId);
  const q = productQueues.get(pid);
  if (!q || q.running) return;

  q.running = true;
  while (q.items.length > 0) {
    const job = q.items.shift();
    q.current = job;
    const listingId = String(job.candidate?.competitor_listing_id || "").trim();
    if (!listingId) continue;

    listingStatuses.set(listingId, SAVE_QUEUE_STATUS.SAVING);
    notifyListeners();

    let res;
    try {
      res = await executarCadastroConcorrente({
        product: job.product,
        monitoredListingId: job.monitoredListingId ?? null,
        candidate: job.candidate,
        linkUrl: job.linkUrl ?? null,
      });
    } catch (err) {
      res = {
        ok: false,
        error: err?.message ?? "Não foi possível cadastrar o concorrente.",
        status: 0,
      };
    }

    if (!res?.ok) {
      if (import.meta.env.DEV) {
        console.error("[S7_COMPETITION_SAVE_STAGE_ERROR]", {
          stage: "frontend_post",
          item_id: listingId,
          status: res?.status ?? null,
          code: res?.code ?? null,
          message: res?.error ?? null,
        });
      }
    }

    listingStatuses.delete(listingId);
    q.current = null;
    notifyListeners();

    try {
      if (typeof job.onComplete === "function") {
        await job.onComplete(res, job);
      }
    } catch {
      /* ignore callback errors */
    }
  }

  q.running = false;
  q.current = null;
  if (q.items.length === 0) {
    productQueues.delete(pid);
  }
}

/**
 * Enfileira cadastro — retorna imediatamente; processamento em segundo plano.
 */
export function enqueueCadastroConcorrente({ product, monitoredListingId = null, candidate, linkUrl = null, onComplete }) {
  const productId = product?.id;
  const monitoredId = monitoredListingId ?? product?.monitored_listing_id ?? null;
  const queueKey = monitoredId || productId;
  const listingId = String(candidate?.competitor_listing_id || "").trim();
  if (!queueKey || !listingId) {
    return { ok: false, code: "INVALID", error: "Dados do concorrente incompletos." };
  }
  if (listingStatuses.has(listingId)) {
    return { ok: false, code: "ALREADY_QUEUED", error: "Este concorrente já está na fila." };
  }

  const pid = String(queueKey);
  if (!productQueues.has(pid)) {
    productQueues.set(pid, { items: [], running: false, current: null });
  }

  const q = productQueues.get(pid);
  const willWaitInQueue = q.running || q.items.length > 0;
  q.items.push({
    product,
    monitoredListingId: monitoredId,
    candidate: snapshotCandidatoParaFila(candidate),
    linkUrl,
    onComplete,
  });
  if (willWaitInQueue) {
    listingStatuses.set(listingId, SAVE_QUEUE_STATUS.QUEUED);
    notifyListeners();
  }

  processProductQueue(pid);

  return { ok: true, queued: true, listingId };
}
