// ======================================================
// PI v6 — estabilidade redução de tarifa (click → async → render final)
// Decimal.js — sem float.
// ======================================================

import Decimal from "decimal.js";

const ROUND = Decimal.ROUND_HALF_UP;

/** @param {unknown} v @returns {Decimal | null} */
export function toDecPromoV6(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v).replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d @returns {string | null} */
export function decStr2PromoV6(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {unknown} v @returns {boolean} */
export function feeDiscountPositivoPromoV6(v) {
  const d = toDecPromoV6(v);
  return d != null && d.gt(0);
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionFeeDiscountFinalStabilityV6(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_FEE_DISCOUNT_FINAL_STABILITY_V6]", payload);
}

/**
 * Resolve fee discount final — nunca substitui positivo congelado por zero.
 *
 * @param {{
 *   promotionFeeDiscountBrl?: string | null;
 *   snapshotFeeDiscountBrl?: string | null;
 *   inferredFeeDiscountBrl?: string | null;
 *   promotionSelectedKey?: string | null;
 * }} params
 */
export function resolverFeeDiscountFinalEstavelV6({
  promotionFeeDiscountBrl = null,
  snapshotFeeDiscountBrl = null,
  inferredFeeDiscountBrl = null,
  promotionSelectedKey = null,
}) {
  const propDec = toDecPromoV6(promotionFeeDiscountBrl);
  const snapDec = toDecPromoV6(snapshotFeeDiscountBrl);
  const infDec = toDecPromoV6(inferredFeeDiscountBrl);

  if (propDec != null && propDec.gt(0)) {
    return {
      finalFeeDiscountBrl: decStr2PromoV6(propDec),
      source: "promotion_fee_discount_brl_prop",
      preservedFromSnapshot: false,
      promotionSelectedKey,
    };
  }

  if (snapDec != null && snapDec.gt(0)) {
    return {
      finalFeeDiscountBrl: decStr2PromoV6(snapDec),
      source: "immutable_click_snapshot_preserved_after_async",
      preservedFromSnapshot: true,
      promotionSelectedKey,
    };
  }

  if (infDec != null && infDec.gt(0)) {
    return {
      finalFeeDiscountBrl: decStr2PromoV6(infDec),
      source: "official_amount_reconciliation",
      preservedFromSnapshot: false,
      promotionSelectedKey,
    };
  }

  return {
    finalFeeDiscountBrl: "0.00",
    source: "none",
    preservedFromSnapshot: false,
    promotionSelectedKey,
  };
}

/**
 * Congela fee discount positivo no store — nunca sobrescreve positivo por zero.
 *
 * @param {Record<string, Record<string, unknown>>} store
 * @param {string | null | undefined} snapshotKey
 * @param {string | null | undefined} feeDiscountBrl
 * @param {string | null | undefined} requestId
 */
export function congelarFeeDiscountSnapshotSePositivo(store, snapshotKey, feeDiscountBrl, requestId = null) {
  if (snapshotKey == null || String(snapshotKey).trim() === "") return;
  const feeDec = toDecPromoV6(feeDiscountBrl);
  if (feeDec == null || !feeDec.gt(0)) return;

  const key = String(snapshotKey).trim();
  const existing = store[key];
  const existingFee = existing != null ? toDecPromoV6(existing.marketplace_fee_discount_brl) : null;
  if (existingFee != null && existingFee.gt(0)) return;

  store[key] = {
    ...(existing != null && typeof existing === "object" ? existing : {}),
    marketplace_fee_discount_brl: decStr2PromoV6(feeDec),
    fee_discount_frozen_at: new Date().toISOString(),
    request_id: requestId ?? existing?.request_id ?? null,
    has_snapshot: true,
    snapshot_key: key,
  };
}
