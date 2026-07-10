// ======================================================
// PI v7 — contrato financeiro saneado da Receita do Marketplace.
// Decimal.js — sem float para cálculos financeiros.
// ======================================================

import Decimal from "decimal.js";

const ROUND = Decimal.ROUND_HALF_UP;
const TOLERANCIA_BRL = new Decimal("0.02");

const TRUSTED_SNAPSHOT_SOURCES = new Set([
  "promotion_card_contract.promotion_financial_adjustments",
  "promotion_offer_contract.promotion_financial_adjustments",
  "promotion_card_contract.fee_discount_fields",
  "promotion_offer_contract.fee_discount_fields",
  "promotion_card_contract.preco_mini_card",
  "promotion_fee_discount",
  "ml_financial_audit",
  "promotion_financial_adjustments",
  "financial_snapshot.marketplace_fee_discount_brl",
  "immutable_click_snapshot",
  "immutable_click_snapshot_validated",
  "preserved_fee_discount_from_snapshot",
]);

const WEAK_SOURCES = new Set([
  "none",
  "click_snapshot",
  "pending_reconciliation_at_render",
  "selectedPromotionSnapshot",
  "promotion_fee_discount_brl_prop",
  "official_amount_reconciliation",
  "immutable_click_snapshot_preserved_after_async",
]);

/** @param {unknown} v @returns {Decimal | null} */
export function toDecPromoV7(v) {
  if (v == null || v === "") return null;
  try {
    const normalized = String(v).trim().replace(/[^\d,.-]/g, "").replace(",", ".");
    if (normalized === "" || normalized === "-" || normalized === ".") return null;
    const d = new Decimal(normalized);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d @returns {string | null} */
export function decStr2PromoV7(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {unknown} value @returns {string | null} */
function cleanString(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s !== "" ? s : null;
}

/** @param {Record<string, unknown>} src @param {string[]} keys @returns {{ dec: Decimal; source: string } | null} */
function pickDecWithSource(src, keys) {
  for (const key of keys) {
    const d = toDecPromoV7(src[key]);
    if (d != null && d.gte(0)) return { dec: d, source: key };
  }
  return null;
}

/** @param {Record<string, unknown> | null} src @param {string[]} keys @returns {{ dec: Decimal; source: string } | null} */
function pickPositiveDecWithSource(src, keys) {
  if (src == null) return null;
  for (const key of keys) {
    const d = toDecPromoV7(src[key]);
    if (d != null && d.gt(0)) return { dec: d, source: key };
  }
  return null;
}

/** @param {Record<string, unknown> | null} obj @returns {Record<string, unknown>} */
function rec(obj) {
  return obj != null && typeof obj === "object" ? obj : {};
}

/** @param {string | null | undefined} source */
export function isTrustedSnapshotFeeSource(source) {
  if (source == null || String(source).trim() === "") return false;
  const s = String(source).trim();
  if (WEAK_SOURCES.has(s)) return false;
  if (TRUSTED_SNAPSHOT_SOURCES.has(s)) return true;
  return s.includes("promotion_") || s.includes("fee_discount_fields") || s.includes("financial_adjustments");
}

/** @param {unknown} asyncScenario */
function extractScenarioRecords(asyncScenario) {
  const sim = rec(asyncScenario != null && typeof asyncScenario === "object" ? asyncScenario : null);
  const marketplace = rec(sim.marketplace != null && typeof sim.marketplace === "object" ? sim.marketplace : null);
  const saleXray = rec(sim.sale_xray_pricing != null && typeof sim.sale_xray_pricing === "object" ? sim.sale_xray_pricing : null);
  const pricing = rec(sim.pricing != null && typeof sim.pricing === "object" ? sim.pricing : null);
  return { sim, marketplace, saleXray, pricing };
}

/**
 * @param {{
 *   promotionSnapshot?: unknown;
 *   asyncScenario?: unknown;
 *   listingTypeId?: string | null;
 *   previousValidContract?: Record<string, unknown> | null;
 *   salePriceOverrideBrl?: string | null;
 * }} params
 */
export function resolvePromotionRevenueContract({
  promotionSnapshot = null,
  asyncScenario = null,
  listingTypeId = null,
  previousValidContract = null,
  salePriceOverrideBrl = null,
}) {
  const snap = rec(promotionSnapshot != null && typeof promotionSnapshot === "object" ? promotionSnapshot : null);
  const previous = rec(previousValidContract);
  const { sim, marketplace: m, saleXray: sx, pricing: pr } = extractScenarioRecords(asyncScenario);

  /** @type {string[]} */
  const warnings = [];
  const sources = {
    promotion_final_price: null,
    gross_marketplace_fee: null,
    net_marketplace_fee: null,
    marketplace_fee_discount: null,
    shipping_cost: null,
    receive: null,
  };

  const salePick =
    toDecPromoV7(salePriceOverrideBrl) != null
      ? { dec: /** @type {Decimal} */ (toDecPromoV7(salePriceOverrideBrl)), source: "promotion_price_display_override" }
      : pickDecWithSource(snap, ["promotion_final_price_brl", "buyer_final_price_brl", "sale_price_brl"]) ??
        pickDecWithSource(m, ["sale_price_brl"]) ??
        pickDecWithSource(sim, ["sale_price_brl"]);
  const saleDec = salePick?.dec ?? null;
  sources.promotion_final_price = salePick?.source ?? null;

  const grossPick =
    pickDecWithSource(snap, ["gross_marketplace_fee_brl", "gross_sale_fee_brl"]) ??
    pickDecWithSource(m, [
      "fee_amount_before_promo_subsidy_brl",
      "promotion_fee_gross_brl",
      "charged_fee_gross_brl",
      "sale_fee_amount_brl",
      "fee_amount_brl",
    ]) ??
    pickDecWithSource(sx, ["charged_fee_gross_brl", "fee_amount_gross_brl"]) ??
    pickDecWithSource(pr, ["fee_amount_brl"]);
  const grossFeeDec = grossPick?.dec ?? null;
  sources.gross_marketplace_fee = grossPick?.source ?? null;

  const explicitNetPick =
    pickDecWithSource(snap, ["net_marketplace_fee_brl", "net_sale_fee_brl"]) ??
    pickDecWithSource(m, [
      "sale_fee_net_display_brl",
      "promotion_fee_net_brl",
      "fee_amount_after_promo_subsidy_brl",
      "charged_fee_net_brl",
    ]) ??
    pickDecWithSource(sx, ["charged_fee_net_brl", "fee_amount_net_display_brl"]);

  const explicitFeeDiscountFromSnapshot = pickPositiveDecWithSource(snap, [
    "marketplace_fee_discount_brl",
    "marketplace_fee_reduction_brl",
    "fee_discount_brl",
  ]);
  const snapshotFeeSource = cleanString(snap.fee_discount_source) ?? cleanString(snap.source_trace);
  const trustedSnapshotFee =
    explicitFeeDiscountFromSnapshot != null && isTrustedSnapshotFeeSource(snapshotFeeSource)
      ? {
          dec: explicitFeeDiscountFromSnapshot.dec,
          source: "immutable_click_snapshot",
        }
      : null;
  if (explicitFeeDiscountFromSnapshot != null && trustedSnapshotFee == null) {
    warnings.push("ignored_untrusted_snapshot_fee_discount");
  }

  const explicitScenarioFee =
    pickPositiveDecWithSource(m, [
      "marketplace_fee_discount_brl",
      "marketplace_fee_discount_amount_brl",
      "fee_discount_brl",
      "marketplace_fee_reduction_brl",
      "charged_fee_discount_brl",
    ]) ?? pickPositiveDecWithSource(sx, ["charged_fee_reduction_brl", "subsidy_ml_brl"]);

  const deterministicFee =
    grossFeeDec != null && explicitNetPick?.dec != null && grossFeeDec.minus(explicitNetPick.dec).gt(TOLERANCIA_BRL)
      ? {
          dec: grossFeeDec.minus(explicitNetPick.dec),
          source: "deterministic_official_fee_diff",
        }
      : null;

  const feeDiscountPick =
    trustedSnapshotFee ??
    (explicitScenarioFee != null
      ? { dec: explicitScenarioFee.dec, source: "official_listing_prices" }
      : null) ??
    deterministicFee;
  const feeDiscountDec =
    feeDiscountPick?.dec != null ? feeDiscountPick.dec.toDecimalPlaces(2, ROUND) : new Decimal(0);
  sources.marketplace_fee_discount = feeDiscountDec.gt(0) ? feeDiscountPick?.source ?? null : "official_listing_prices";

  let netFeeDec = explicitNetPick?.dec ?? null;
  if (netFeeDec == null && grossFeeDec != null && feeDiscountDec.gt(0)) {
    netFeeDec = Decimal.max(0, grossFeeDec.minus(feeDiscountDec));
    sources.net_marketplace_fee = "gross_minus_trusted_fee_discount";
  } else {
    sources.net_marketplace_fee = explicitNetPick?.source ?? grossPick?.source ?? null;
    netFeeDec = netFeeDec ?? grossFeeDec;
  }

  const shippingPick =
    pickDecWithSource(snap, ["shipping_cost_brl", "shipping_cost_amount_brl"]) ??
    pickDecWithSource(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ??
    pickDecWithSource(sx, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ??
    pickDecWithSource(pr, ["shipping_cost_brl"]);
  let shippingDec = shippingPick?.dec ?? null;
  sources.shipping_cost = shippingPick?.source ?? null;
  const previousShippingDec = toDecPromoV7(previous.shipping_cost_brl);
  if ((shippingDec == null || shippingDec.lte(0)) && previousShippingDec != null && previousShippingDec.gt(0)) {
    shippingDec = previousShippingDec;
    sources.shipping_cost = "preserved_shipping_from_previous_valid_contract";
  }

  if (shippingDec == null) {
    warnings.push("missing_shipping_cost");
    shippingDec = new Decimal(0);
    sources.shipping_cost = "shipping_not_available";
  }

  const officialReceivePick =
    pickDecWithSource(snap, ["official_amount_to_receive_brl"]) ??
    pickDecWithSource(m, ["marketplace_payout_amount_brl", "net_receivable_brl", "payout_after_promo_subsidy_brl"]) ??
    pickDecWithSource(sim, ["marketplace_payout_amount_brl", "net_receivable_brl"]);
  const officialReceiveDec = officialReceivePick?.dec ?? null;

  const receiveDec =
    saleDec != null && netFeeDec != null && shippingDec != null
      ? saleDec.minus(netFeeDec).minus(shippingDec).toDecimalPlaces(2, ROUND)
      : null;
  sources.receive = receiveDec != null ? "async_reconciled_official_scenario" : "financial_contract_incomplete";

  if (officialReceiveDec != null && receiveDec != null && officialReceiveDec.minus(receiveDec).abs().gt(TOLERANCIA_BRL)) {
    warnings.push("official_receive_differs_from_v7_formula");
  }
  if (saleDec == null) warnings.push("missing_promotion_final_price");
  if (netFeeDec == null) warnings.push("missing_net_marketplace_fee");

  const listingTypeLabel =
    cleanString(snap.listing_type_label) ??
    cleanString(m.listing_type_label) ??
    (listingTypeId === "premium" || listingTypeId === "gold_pro"
      ? "Premium"
      : listingTypeId === "classic" || listingTypeId === "gold_special"
        ? "Clássico"
        : null);
  const commissionPercent =
    cleanString(snap.commission_percent) ??
    cleanString(m.sale_fee_percent) ??
    cleanString(m.commission_percent) ??
    cleanString(sx.sale_fee_percent) ??
    cleanString(pr.sale_fee_percent);

  const promotionSelectedKey =
    cleanString(snap.promotion_selected_key) ?? cleanString(snap.snapshot_key) ?? cleanString(sim.scenario_id);

  const isValid = saleDec != null && netFeeDec != null && receiveDec != null && !warnings.includes("missing_shipping_cost");

  return {
    listing_id: cleanString(snap.listing_id) ?? cleanString(sim.listing_id) ?? null,
    listing_type_id: cleanString(snap.listing_type_id) ?? listingTypeId ?? null,
    promotion_selected_key: promotionSelectedKey,
    promotion_id: cleanString(snap.promotion_id) ?? cleanString(sim.promotion_id) ?? null,
    promotion_name: cleanString(snap.promotion_name) ?? cleanString(sim.promotion_name) ?? cleanString(sim.label) ?? null,

    promotion_final_price_brl: decStr2PromoV7(saleDec),
    gross_marketplace_fee_brl: decStr2PromoV7(grossFeeDec),
    net_marketplace_fee_brl: decStr2PromoV7(netFeeDec),
    marketplace_fee_discount_brl: decStr2PromoV7(feeDiscountDec) ?? "0.00",
    shipping_cost_brl: decStr2PromoV7(shippingDec),
    official_amount_to_receive_brl: decStr2PromoV7(officialReceiveDec),

    commission_percent: commissionPercent,
    listing_type_label: listingTypeLabel,

    receive_brl: decStr2PromoV7(receiveDec),
    sources,
    warnings,
    is_valid: isValid,
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromotionRevenueFinancialSanityV7(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_REVENUE_FINANCIAL_SANITY_V7]", payload);
}
