// ======================================================
// S4.3.6.25 / S4.3.6.28 — SSOT financeiro Precificação × Comparativo.
// Identidade discriminada: BASELINE ≠ PROMOTION (sem slot genérico).
// Sem fórmulas — só identidade, revision e invalidação localizada.
// ======================================================

import {
  invalidateSimulacaoOficialCacheByListing,
  invalidateSimulacaoOficialCacheKeysMatching,
} from "../../utils/simulacaoOficialListingTypeCache.js";

/** @typedef {"BASELINE" | "PROMOTION"} FinancialScenarioKind */

export const FINANCIAL_SCENARIO_KIND = Object.freeze({
  BASELINE: /** @type {const} */ ("BASELINE"),
  PROMOTION: /** @type {const} */ ("PROMOTION"),
});

export const BASELINE_SCENARIO_ID = "CURRENT_LISTING_PRICE";

/**
 * @typedef {{
 *   marketplace?: string | null;
 *   sellerId?: string | null;
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   scenarioKind: FinancialScenarioKind;
 *   scenarioId: string;
 * }} FinancialScenarioIdentity
 */

/**
 * @typedef {{
 *   listingExternalId: string | null;
 *   listingId: string | null;
 *   listingType: "classic" | "premium";
 *   scenarioKind: FinancialScenarioKind;
 *   scenarioId: string;
 *   marketplace: string;
 *   sellerId: string;
 *   kind: "preco" | "margem";
 *   value: number;
 *   salePrice: number | null;
 *   extrasKey: string;
 *   cacheKey: string | null;
 *   revision: number;
 *   pricingRevision: number;
 *   costsRevision: number;
 *   updatedAt: number;
 * }} PricingFinancialScenarioSnapshot
 */

/** @type {Map<string, PricingFinancialScenarioSnapshot>} */
const snapshotsBySlot = new Map();

/** Revisão por listing (write-through / hidratação de promoções). */
/** @type {Map<string, number>} */
const listingRevisionByKey = new Map();

/** @type {Set<(ev: {
 *   revision: number;
 *   listingKey: string;
 *   listingType: string;
 *   scenarioKind: FinancialScenarioKind | "*";
 *   scenarioId: string | "*";
 * }) => void>} */
const listeners = new Set();

let globalRevision = 0;

/**
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 */
export function montarChaveListingFinanceiro(listingExternalId, listingId) {
  const ext =
    listingExternalId != null && String(listingExternalId).trim() !== ""
      ? String(listingExternalId).trim()
      : "";
  const id = listingId != null && String(listingId).trim() !== "" ? String(listingId).trim() : "";
  return ext || id || "";
}

/**
 * @param {FinancialScenarioIdentity} identity
 */
export function montarChaveSlotCenarioFinanceiro(identity) {
  const listingKey = montarChaveListingFinanceiro(identity.listingExternalId, identity.listingId);
  const marketplace =
    identity.marketplace != null && String(identity.marketplace).trim() !== ""
      ? String(identity.marketplace).trim().toLowerCase()
      : "ml";
  const sellerId =
    identity.sellerId != null && String(identity.sellerId).trim() !== ""
      ? String(identity.sellerId).trim()
      : "_";
  const kind = String(identity.scenarioKind || "").trim().toUpperCase();
  const scenarioId = String(identity.scenarioId || "").trim();
  return `${marketplace}::${sellerId}::${listingKey}::${identity.listingType}::${kind}::${scenarioId}`;
}

/**
 * @param {Partial<FinancialScenarioIdentity> & {
 *   listingType: "classic" | "premium";
 *   scenarioKind?: FinancialScenarioKind | string;
 *   scenarioId?: string | null;
 *   promotionId?: string | null;
 * }} raw
 * @returns {FinancialScenarioIdentity}
 */
export function normalizarIdentidadeCenarioFinanceiro(raw) {
  const scenarioKindRaw = String(raw.scenarioKind ?? "").trim().toUpperCase();
  /** @type {FinancialScenarioKind} */
  let scenarioKind =
    scenarioKindRaw === FINANCIAL_SCENARIO_KIND.PROMOTION
      ? FINANCIAL_SCENARIO_KIND.PROMOTION
      : scenarioKindRaw === FINANCIAL_SCENARIO_KIND.BASELINE
        ? FINANCIAL_SCENARIO_KIND.BASELINE
        : FINANCIAL_SCENARIO_KIND.BASELINE;

  // Compat: promotionId explícito força PROMOTION.
  const promoHint =
    raw.promotionId != null && String(raw.promotionId).trim() !== ""
      ? String(raw.promotionId).trim()
      : raw.scenarioId != null &&
          String(raw.scenarioId).trim() !== "" &&
          String(raw.scenarioId).trim() !== BASELINE_SCENARIO_ID
        ? String(raw.scenarioId).trim()
        : "";

  if (promoHint !== "" && scenarioKindRaw !== FINANCIAL_SCENARIO_KIND.BASELINE) {
    scenarioKind = FINANCIAL_SCENARIO_KIND.PROMOTION;
  }

  const scenarioId =
    scenarioKind === FINANCIAL_SCENARIO_KIND.BASELINE
      ? BASELINE_SCENARIO_ID
      : promoHint !== ""
        ? promoHint
        : String(raw.scenarioId ?? "").trim();

  return {
    marketplace: raw.marketplace ?? "ml",
    sellerId: raw.sellerId ?? null,
    listingExternalId: raw.listingExternalId ?? null,
    listingId: raw.listingId ?? null,
    listingType: raw.listingType,
    scenarioKind,
    scenarioId,
  };
}

/**
 * @param {FinancialScenarioIdentity} identity
 * @param {{ throwOnError?: boolean }} [opts]
 */
export function validarIdentidadeCenarioFinanceiro(identity, opts = {}) {
  const throwOnError = opts.throwOnError !== false && import.meta.env?.DEV === true;
  /** @type {string[]} */
  const errors = [];

  if (identity.scenarioKind !== FINANCIAL_SCENARIO_KIND.BASELINE &&
      identity.scenarioKind !== FINANCIAL_SCENARIO_KIND.PROMOTION) {
    errors.push("scenarioKind_ausente_ou_invalido");
  }
  if (identity.scenarioKind === FINANCIAL_SCENARIO_KIND.PROMOTION) {
    if (identity.scenarioId == null || String(identity.scenarioId).trim() === "") {
      errors.push("promocao_sem_scenarioId");
    }
    if (String(identity.scenarioId).trim() === BASELINE_SCENARIO_ID) {
      errors.push("promocao_nao_pode_usar_CURRENT_LISTING_PRICE");
    }
  }
  if (identity.scenarioKind === FINANCIAL_SCENARIO_KIND.BASELINE) {
    if (String(identity.scenarioId).trim() !== BASELINE_SCENARIO_ID) {
      errors.push("baseline_deve_usar_CURRENT_LISTING_PRICE");
    }
  }
  const listingKey = montarChaveListingFinanceiro(identity.listingExternalId, identity.listingId);
  if (listingKey === "") errors.push("listing_ausente");
  if (identity.listingType !== "classic" && identity.listingType !== "premium") {
    errors.push("listingType_invalido");
  }

  if (errors.length > 0 && throwOnError) {
    throw new Error(`[S4.3.6.28] identidade financeira ambígua: ${errors.join(",")}`);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} cacheKey
 */
function chaveCacheEhBaseline(cacheKey) {
  return String(cacheKey).includes("|promo:none|") || /\|promo:none$/.test(String(cacheKey));
}

/**
 * @param {string} cacheKey
 * @param {string} promotionId
 */
function chaveCacheEhPromocao(cacheKey, promotionId) {
  const pid = String(promotionId).trim();
  if (pid === "") return false;
  return String(cacheKey).includes(`|promo:${pid}|`) || String(cacheKey).endsWith(`|promo:${pid}`);
}

/**
 * @param {{
 *   identity: FinancialScenarioIdentity;
 *   kind: "preco" | "margem";
 *   value: number;
 *   salePrice?: number | null;
 *   extrasKey?: string;
 *   cacheKey?: string | null;
 *   keepCacheKey?: string | null;
 *   pricingRevision?: number;
 *   costsRevision?: number;
 * }} p
 */
export function publishFinancialScenario(p) {
  const identity = normalizarIdentidadeCenarioFinanceiro(p.identity);
  const validation = validarIdentidadeCenarioFinanceiro(identity, { throwOnError: true });
  if (!validation.ok) return null;

  const listingKey = montarChaveListingFinanceiro(identity.listingExternalId, identity.listingId);
  const slot = montarChaveSlotCenarioFinanceiro(identity);
  const prev = snapshotsBySlot.get(slot);

  const salePrice =
    p.salePrice != null && Number.isFinite(p.salePrice) && p.salePrice > 0
      ? Math.round(p.salePrice * 100) / 100
      : p.kind === "preco" && Number.isFinite(p.value) && p.value > 0
        ? Math.round(p.value * 100) / 100
        : null;

  const next = {
    listingExternalId: identity.listingExternalId != null ? String(identity.listingExternalId) : null,
    listingId: identity.listingId != null ? String(identity.listingId) : null,
    listingType: identity.listingType,
    scenarioKind: identity.scenarioKind,
    scenarioId: identity.scenarioId,
    marketplace:
      identity.marketplace != null && String(identity.marketplace).trim() !== ""
        ? String(identity.marketplace).trim().toLowerCase()
        : "ml",
    sellerId:
      identity.sellerId != null && String(identity.sellerId).trim() !== ""
        ? String(identity.sellerId).trim()
        : "_",
    kind: p.kind,
    value: p.value,
    salePrice,
    extrasKey: p.extrasKey != null ? String(p.extrasKey) : "none",
    cacheKey: p.cacheKey != null ? String(p.cacheKey) : null,
    revision: globalRevision + 1,
    pricingRevision: p.pricingRevision != null ? Number(p.pricingRevision) : globalRevision + 1,
    costsRevision: p.costsRevision != null ? Number(p.costsRevision) : 0,
    updatedAt: Date.now(),
  };

  const changed =
    prev == null ||
    prev.kind !== next.kind ||
    prev.value !== next.value ||
    prev.salePrice !== next.salePrice ||
    prev.extrasKey !== next.extrasKey ||
    prev.cacheKey !== next.cacheKey ||
    prev.scenarioKind !== next.scenarioKind ||
    prev.scenarioId !== next.scenarioId;

  if (!changed) return prev;

  globalRevision = next.revision;
  snapshotsBySlot.set(slot, next);
  listingRevisionByKey.set(listingKey, next.revision);

  const keep = p.keepCacheKey != null ? String(p.keepCacheKey) : next.cacheKey;

  // Invalidação LOCALIZADA — nunca limpa o namespace do outro scenarioKind.
  if (typeof invalidateSimulacaoOficialCacheKeysMatching === "function") {
    if (identity.scenarioKind === FINANCIAL_SCENARIO_KIND.BASELINE) {
      invalidateSimulacaoOficialCacheKeysMatching(listingKey, (key) => {
        if (keep != null && key === keep) return true;
        // Preserva todas as entradas promocionais.
        if (!chaveCacheEhBaseline(key)) return true;
        return false;
      });
    } else {
      const promoId = identity.scenarioId;
      invalidateSimulacaoOficialCacheKeysMatching(listingKey, (key) => {
        if (keep != null && key === keep) return true;
        // Preserva baseline e outras promoções.
        if (!chaveCacheEhPromocao(key, promoId)) return true;
        return false;
      });
    }
  } else if (identity.scenarioKind === FINANCIAL_SCENARIO_KIND.BASELINE) {
    invalidateSimulacaoOficialCacheByListing(listingKey);
  }

  const ev = {
    revision: next.revision,
    listingKey,
    listingType: identity.listingType,
    scenarioKind: identity.scenarioKind,
    scenarioId: identity.scenarioId,
  };
  for (const fn of listeners) {
    try {
      fn(ev);
    } catch {
      /* ignore listener errors */
    }
  }
  return next;
}

/**
 * Publica somente o cenário-base (preço atual do anúncio / Precificação).
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   marketplace?: string | null;
 *   sellerId?: string | null;
 *   kind: "preco" | "margem";
 *   value: number;
 *   salePrice?: number | null;
 *   extrasKey?: string;
 *   cacheKey?: string | null;
 *   keepCacheKey?: string | null;
 * }} p
 */
export function publishBaselineScenario(p) {
  return publishFinancialScenario({
    identity: {
      marketplace: p.marketplace,
      sellerId: p.sellerId,
      listingExternalId: p.listingExternalId,
      listingId: p.listingId,
      listingType: p.listingType,
      scenarioKind: FINANCIAL_SCENARIO_KIND.BASELINE,
      scenarioId: BASELINE_SCENARIO_ID,
    },
    kind: p.kind,
    value: p.value,
    salePrice: p.salePrice,
    extrasKey: p.extrasKey,
    cacheKey: p.cacheKey,
    keepCacheKey: p.keepCacheKey,
  });
}

/**
 * Publica somente um cenário promocional (nunca toca o slot BASELINE).
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   marketplace?: string | null;
 *   sellerId?: string | null;
 *   promotionId: string;
 *   kind: "preco" | "margem";
 *   value: number;
 *   salePrice?: number | null;
 *   extrasKey?: string;
 *   cacheKey?: string | null;
 *   keepCacheKey?: string | null;
 * }} p
 */
export function publishPromotionScenario(p) {
  const promotionId = p.promotionId != null ? String(p.promotionId).trim() : "";
  return publishFinancialScenario({
    identity: {
      marketplace: p.marketplace,
      sellerId: p.sellerId,
      listingExternalId: p.listingExternalId,
      listingId: p.listingId,
      listingType: p.listingType,
      scenarioKind: FINANCIAL_SCENARIO_KIND.PROMOTION,
      scenarioId: promotionId,
    },
    kind: p.kind,
    value: p.value,
    salePrice: p.salePrice,
    extrasKey: p.extrasKey,
    cacheKey: p.cacheKey,
    keepCacheKey: p.keepCacheKey,
  });
}

/**
 * Compat S4.3.6.25 — SEMPRE publica BASELINE.
 * Chamadas com promotionId devem usar publishPromotionScenario.
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   kind: "preco" | "margem";
 *   value: number;
 *   salePrice?: number | null;
 *   extrasKey?: string;
 *   cacheKey?: string | null;
 *   keepCacheKey?: string | null;
 *   promotionId?: string | null;
 *   scenarioKind?: FinancialScenarioKind;
 * }} p
 */
export function publicarSnapshotFinanceiroPrecificacao(p) {
  // Proteção: se a chamada carregar promotionId/PROMOTION, NÃO contaminar baseline.
  const kindHint = String(p.scenarioKind ?? "").trim().toUpperCase();
  const hasPromo =
    (p.promotionId != null && String(p.promotionId).trim() !== "") ||
    kindHint === FINANCIAL_SCENARIO_KIND.PROMOTION;
  if (hasPromo) {
    const promotionId = p.promotionId != null ? String(p.promotionId).trim() : "";
    if (import.meta.env?.DEV === true) {
      console.warn(
        "[S4.3.6.28] publicarSnapshotFinanceiroPrecificacao recusou publicação promocional no slot BASELINE; use publishPromotionScenario.",
      );
    }
    if (promotionId === "" || promotionId === BASELINE_SCENARIO_ID) return null;
    return publishPromotionScenario({
      listingExternalId: p.listingExternalId,
      listingId: p.listingId,
      listingType: p.listingType,
      promotionId,
      kind: p.kind,
      value: p.value,
      salePrice: p.salePrice,
      extrasKey: p.extrasKey,
      cacheKey: p.cacheKey,
      keepCacheKey: p.keepCacheKey,
    });
  }
  return publishBaselineScenario(p);
}

/**
 * Selector explícito — aceita somente BASELINE.
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 * @param {"classic" | "premium" | null | undefined} listingType
 * @param {{ marketplace?: string | null; sellerId?: string | null }} [opts]
 * @returns {PricingFinancialScenarioSnapshot | null}
 */
export function selectBaselineScenario(listingExternalId, listingId, listingType, opts = {}) {
  if (listingType == null) return null;
  const identity = normalizarIdentidadeCenarioFinanceiro({
    marketplace: opts.marketplace,
    sellerId: opts.sellerId,
    listingExternalId,
    listingId,
    listingType,
    scenarioKind: FINANCIAL_SCENARIO_KIND.BASELINE,
    scenarioId: BASELINE_SCENARIO_ID,
  });
  const snap = snapshotsBySlot.get(montarChaveSlotCenarioFinanceiro(identity)) ?? null;
  if (snap == null) return null;
  if (snap.scenarioKind !== FINANCIAL_SCENARIO_KIND.BASELINE) return null;
  if (snap.scenarioId !== BASELINE_SCENARIO_ID) return null;
  return snap;
}

/**
 * Selector explícito — exige PROMOTION + promotionId.
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 * @param {"classic" | "premium" | null | undefined} listingType
 * @param {string | null | undefined} promotionId
 * @param {{ marketplace?: string | null; sellerId?: string | null }} [opts]
 * @returns {PricingFinancialScenarioSnapshot | null}
 */
export function selectPromotionScenario(
  listingExternalId,
  listingId,
  listingType,
  promotionId,
  opts = {},
) {
  if (listingType == null) return null;
  const pid = promotionId != null ? String(promotionId).trim() : "";
  if (pid === "" || pid === BASELINE_SCENARIO_ID) return null;
  const identity = normalizarIdentidadeCenarioFinanceiro({
    marketplace: opts.marketplace,
    sellerId: opts.sellerId,
    listingExternalId,
    listingId,
    listingType,
    scenarioKind: FINANCIAL_SCENARIO_KIND.PROMOTION,
    scenarioId: pid,
  });
  const snap = snapshotsBySlot.get(montarChaveSlotCenarioFinanceiro(identity)) ?? null;
  if (snap == null) return null;
  if (snap.scenarioKind !== FINANCIAL_SCENARIO_KIND.PROMOTION) return null;
  if (snap.scenarioId !== pid) return null;
  return snap;
}

/**
 * Combina baseline + promoções sem misturar identidades.
 * @param {{
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   listingType: "classic" | "premium";
 *   promotionIds?: string[];
 *   marketplace?: string | null;
 *   sellerId?: string | null;
 * }} p
 */
export function selectOfferComparisonScenarios(p) {
  const baseline = selectBaselineScenario(p.listingExternalId, p.listingId, p.listingType, {
    marketplace: p.marketplace,
    sellerId: p.sellerId,
  });
  const promos = (Array.isArray(p.promotionIds) ? p.promotionIds : [])
    .map((id) =>
      selectPromotionScenario(p.listingExternalId, p.listingId, p.listingType, id, {
        marketplace: p.marketplace,
        sellerId: p.sellerId,
      }),
    )
    .filter((s) => s != null);
  return { baseline, promotions: promos };
}

/**
 * Compat — lê SOMENTE baseline (nunca promoção).
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 * @param {"classic" | "premium" | null | undefined} listingType
 * @returns {PricingFinancialScenarioSnapshot | null}
 */
export function obterSnapshotFinanceiroPrecificacao(listingExternalId, listingId, listingType) {
  return selectBaselineScenario(listingExternalId, listingId, listingType);
}

/** Revisão global (Comparativo usa em resolveKey). */
export function obterRevisaoFinanceiraPrecificacaoGlobal() {
  return globalRevision;
}

/**
 * S4.3.6.26 — notifica revisão sem alterar snapshots BASELINE/PROMOTION.
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 */
export function notificarRevisaoFinanceiraListing(listingExternalId, listingId) {
  const listingKey = montarChaveListingFinanceiro(listingExternalId, listingId);
  if (listingKey === "") return 0;
  globalRevision += 1;
  listingRevisionByKey.set(listingKey, globalRevision);
  const ev = {
    revision: globalRevision,
    listingKey,
    listingType: "*",
    scenarioKind: /** @type {"*"} */ ("*"),
    scenarioId: "*",
  };
  for (const fn of listeners) {
    try {
      fn(ev);
    } catch {
      /* ignore */
    }
  }
  return globalRevision;
}

/**
 * @param {string | null | undefined} listingExternalId
 * @param {string | null | undefined} listingId
 */
export function obterRevisaoFinanceiraPrecificacaoListing(listingExternalId, listingId) {
  const listingKey = montarChaveListingFinanceiro(listingExternalId, listingId);
  if (listingKey === "") return 0;
  let max = listingRevisionByKey.get(listingKey) ?? 0;
  for (const [, snap] of snapshotsBySlot) {
    const snapKey = montarChaveListingFinanceiro(snap.listingExternalId, snap.listingId);
    if (snapKey === listingKey && snap.revision > max) max = snap.revision;
  }
  return max;
}

/**
 * @param {(ev: {
 *   revision: number;
 *   listingKey: string;
 *   listingType: string;
 *   scenarioKind: FinancialScenarioKind | "*";
 *   scenarioId: string | "*";
 * }) => void} listener
 */
export function assinarSnapshotFinanceiroPrecificacao(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Somente testes. */
export function __debugResetPricingFinancialScenarioStore() {
  snapshotsBySlot.clear();
  listingRevisionByKey.clear();
  listeners.clear();
  globalRevision = 0;
}

/** Somente testes. */
export function __debugPricingFinancialScenarioStoreSize() {
  return { snapshots: snapshotsBySlot.size, listeners: listeners.size, revision: globalRevision };
}

/** Somente testes. */
export function __debugListPricingFinancialScenarioSlots() {
  return [...snapshotsBySlot.keys()];
}
