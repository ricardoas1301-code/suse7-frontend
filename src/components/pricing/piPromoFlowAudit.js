// ======================================================
// PI — Promoções: log unificado [S7_PI_PROMO_FLOW_AUDIT] (somente DEV).
// ======================================================

/**
 * @param {unknown} scenario
 * @returns {Record<string, unknown>}
 */
export function buildPiPromoFlowAuditFromScenario(scenario) {
  if (!scenario || typeof scenario !== "object") return {};
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const contract =
    r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
      : null;
  const m =
    r.marketplace != null && typeof r.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (r.marketplace)
      : /** @type {Record<string, unknown>} */ ({});
  const audit =
    r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
      ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
      : /** @type {Record<string, unknown>} */ ({});
  return {
    promotion_name: contract?.promotion_name ?? r.promotion_name ?? r.label ?? null,
    promotion_id: contract?.promotion_id ?? r.promotion_id ?? audit.promotion_id ?? null,
    type: contract?.promotion_type ?? r.promotion_type ?? audit.type ?? null,
    ref_id: contract?.offer_id ?? r.offer_id ?? null,
    original_price: contract?.original_price_brl ?? audit.original_price ?? m.original_price_brl ?? null,
    promotion_price: contract?.final_price_brl ?? audit.promotion_price ?? m.sale_price_brl ?? null,
    seller_percentage: contract?.seller_percentage_raw ?? audit.seller_percentage ?? null,
    meli_percentage: contract?.meli_percentage_raw ?? audit.meli_percentage ?? null,
    discount_seller_brl:
      contract?.discount_amount_brl ?? audit.discount_seller_brl ?? m.seller_discount_amount_brl ?? null,
    discount_seller_pct:
      contract?.discount_percent_display != null
        ? `${contract.discount_percent_display}.00`
        : null,
    discount_meli_brl: audit.discount_meli_brl ?? m.promotion_subsidy_amount_brl ?? null,
    discount_meli_boost_amount: audit.discount_meli_boost_amount ?? null,
    fee_before_subsidy: m.fee_amount_before_promo_subsidy_brl ?? m.sale_fee_amount_brl ?? m.fee_amount_brl ?? null,
    fee_after_subsidy: m.fee_amount_after_promo_subsidy_brl ?? null,
    shipping_brl: m.shipping_cost_amount_brl ?? null,
    payout:
      contract?.seller_receives_brl ??
      m.marketplace_payout_amount_brl ??
      m.net_receivable_brl ??
      m.payout_after_promo_subsidy_brl ??
      null,
    source_field_used: contract?.source_confidence ?? audit.discount_source ?? m.promotion_source ?? null,
  };
}

/**
 * @param {string} stage
 * @param {Record<string, unknown>} payload
 */
export function logPiPromoFlowAudit(stage, payload = {}) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMO_FLOW_AUDIT]", { stage, ...payload });
}
