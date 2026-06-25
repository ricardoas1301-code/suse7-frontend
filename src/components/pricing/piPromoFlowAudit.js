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
  const m =
    r.marketplace != null && typeof r.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (r.marketplace)
      : /** @type {Record<string, unknown>} */ ({});
  const audit =
    r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
      ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
      : /** @type {Record<string, unknown>} */ ({});
  return {
    promotion_name: r.promotion_name ?? r.label ?? null,
    promotion_id: r.promotion_id ?? audit.promotion_id ?? null,
    type: r.promotion_type ?? audit.type ?? null,
    ref_id: r.offer_id ?? null,
    original_price: audit.original_price ?? m.original_price_brl ?? null,
    promotion_price: audit.promotion_price ?? m.sale_price_brl ?? null,
    seller_percentage: audit.seller_percentage ?? null,
    meli_percentage: audit.meli_percentage ?? null,
    discount_seller_brl: audit.discount_seller_brl ?? m.seller_discount_amount_brl ?? null,
    discount_seller_pct: audit.ml_discount_pct ?? m.seller_discount_percent ?? null,
    discount_meli_brl: audit.discount_meli_brl ?? m.promotion_subsidy_amount_brl ?? null,
    discount_meli_boost_amount: audit.discount_meli_boost_amount ?? null,
    fee_before_subsidy: m.fee_amount_before_promo_subsidy_brl ?? m.sale_fee_amount_brl ?? m.fee_amount_brl ?? null,
    fee_after_subsidy: m.fee_amount_after_promo_subsidy_brl ?? null,
    shipping_brl: m.shipping_cost_amount_brl ?? null,
    payout: m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? m.payout_after_promo_subsidy_brl ?? null,
    source_field_used: audit.discount_source ?? m.promotion_source ?? null,
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
