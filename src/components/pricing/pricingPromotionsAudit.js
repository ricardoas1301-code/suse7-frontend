// ======================================================
// PI — Promoções: logs de auditoria (somente DEV).
// ======================================================

import {
  buildPromotionContractIdentityKey,
  buildPromotionScenarioIdentityFromRow,
} from "../mercadoLivrePricingScenarioCompareShared.js";
import { resolvePromotionSelectionId } from "./pricingPromotionCarouselUi.js";

/**
 * @param {unknown} payload
 */
export function contarPromocoesBrutasPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      modal_promotion_scenarios: 0,
      top_promotion_scenarios: 0,
      top_scenarios_nao_baseline: 0,
      top_scenarios_promo_filtradas: 0,
      merged_union_estimate: 0,
    };
  }
  const rec = /** @type {Record<string, unknown>} */ (payload);
  const sx =
    rec.sale_xray_modal != null && typeof rec.sale_xray_modal === "object"
      ? /** @type {Record<string, unknown>} */ (rec.sale_xray_modal)
      : null;
  const modalArr = sx != null && Array.isArray(sx.promotion_scenarios) ? sx.promotion_scenarios : [];
  const topPromoArr = Array.isArray(rec.promotion_scenarios) ? rec.promotion_scenarios : [];
  const scenariosTop = Array.isArray(rec.scenarios) ? rec.scenarios : [];
  const baselineTop =
    rec.baseline != null && typeof rec.baseline === "object"
      ? rec.baseline
      : scenariosTop.find((s) => s && typeof s === "object" && s.is_baseline === true) ?? null;
  let naoBaseline = 0;
  let promoFiltradas = 0;
  for (const s of scenariosTop) {
    if (!s || typeof s !== "object") continue;
    const row = /** @type {Record<string, unknown>} */ (s);
    if (row === baselineTop || row.is_baseline === true) continue;
    naoBaseline += 1;
    const st = String(row.scenario_type ?? row.kind ?? "").toLowerCase();
    const sid = String(row.scenario_id ?? row.scenario_key ?? "").toLowerCase();
    if (st.includes("listing") && st.includes("type")) continue;
    if (sid === "gold_special" || sid === "gold_pro" || sid.includes("listing_type")) continue;
    promoFiltradas += 1;
  }
  const mergedUnionEstimate = Math.max(modalArr.length, topPromoArr.length, promoFiltradas);
  return {
    modal_promotion_scenarios: modalArr.length,
    top_promotion_scenarios: topPromoArr.length,
    top_scenarios_nao_baseline: naoBaseline,
    top_scenarios_promo_filtradas: promoFiltradas,
    merged_union_estimate: mergedUnionEstimate,
  };
}

/**
 * @param {unknown} payload
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditRaw(payload, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const counts = contarPromocoesBrutasPayload(payload);
  const sx =
    payload != null && typeof payload === "object"
      ? /** @type {Record<string, unknown>} */ (payload).sale_xray_modal
      : null;
  const modalAfterWrap =
    sx != null && typeof sx === "object" && Array.isArray(/** @type {Record<string, unknown>} */ (sx).promotion_scenarios)
      ? /** @type {Record<string, unknown>[]} */ (/** @type {Record<string, unknown>} */ (sx).promotion_scenarios).length
      : counts.merged_union_estimate;
  const rawTotal = Math.max(
    counts.modal_promotion_scenarios,
    counts.top_promotion_scenarios,
    counts.top_scenarios_promo_filtradas,
    modalAfterWrap,
  );
  console.info("[S7_PI_PROMOS_AUDIT] raw_total", {
    listingExternalId: listingExternalId ?? null,
    raw_total: rawTotal,
    after_wrap_modal_total: modalAfterWrap,
    ...counts,
  });
}

/**
 * @param {{
 *   listingExternalId?: string | null;
 *   afterBuildRaiox?: number;
 *   afterOrdered?: number;
 *   afterSplit?: number;
 * }} stats
 */
export function logPiPromosAuditPipeline(stats) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMOS_AUDIT] pipeline", stats);
}

/**
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditRows(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  console.info("[S7_PI_PROMOS_AUDIT] rows_total", {
    listingExternalId: listingExternalId ?? null,
    rows_total: list.length,
  });
  console.info("[S7_PI_PROMOS_AUDIT] identity_sample", {
    listingExternalId: listingExternalId ?? null,
    sample: list.slice(0, 20).map(({ scenario, group }, index) => ({
      group,
      ...buildPromotionScenarioIdentityFromRow(
        scenario,
        index,
        resolvePromotionSelectionId({ scenario, group }, index),
      ),
    })),
  });
  console.info("[S7_PI_PROMOS_AUDIT] status_sample", {
    listingExternalId: listingExternalId ?? null,
    sample: list.slice(0, 12).map(({ scenario, group }, index) => {
      const identity = buildPromotionScenarioIdentityFromRow(scenario, index);
      return {
        group,
        title: identity.title,
        status: identity.status,
        effective_api_state: identity.effective_api_state,
        dedupeKey: identity.dedupeKey,
      };
    }),
  });
}

/**
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditPanel(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMOS_AUDIT] panel_total", {
    listingExternalId: listingExternalId ?? null,
    panel_total: Array.isArray(rows) ? rows.length : 0,
  });
}

/**
 * @param {number} renderedTotal
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromosAuditRendered(renderedTotal, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_PI_PROMOS_AUDIT] rendered_total", {
    listingExternalId: listingExternalId ?? null,
    rendered_total: renderedTotal,
  });
}

/**
 * Auditoria financeira por promoção — compara campos oficiais ML (audit) vs cenário Suse7.
 *
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromoFinAudit(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  for (const { scenario } of list) {
    if (!scenario || typeof scenario !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : /** @type {Record<string, unknown>} */ ({});
    const audit =
      r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
        ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
        : /** @type {Record<string, unknown>} */ ({});
    const mlDisc = audit.ml_discount_brl != null ? String(audit.ml_discount_brl) : null;
    const suse7Disc = m.seller_discount_amount_brl != null ? String(m.seller_discount_amount_brl) : null;
    const mlPct = audit.ml_discount_pct != null ? String(audit.ml_discount_pct) : null;
    const suse7Pct = m.seller_discount_percent != null ? String(m.seller_discount_percent) : null;
    console.info("[S7_PI_PROMO_FIN_AUDIT]", {
      listingExternalId: listingExternalId ?? null,
      promotion_name: r.promotion_name ?? r.label ?? null,
      promotion_id: r.promotion_id ?? null,
      type: r.promotion_type ?? null,
      ref_id: r.offer_id ?? null,
      raw_status: r.ml_promotion_raw_status ?? null,
      original_price: audit.original_price ?? m.original_price_brl ?? null,
      promotion_price: audit.promotion_price ?? m.sale_price_brl ?? null,
      ml_discount_brl: mlDisc,
      ml_discount_pct: mlPct,
      suse7_discount_brl: suse7Disc,
      suse7_discount_pct: suse7Pct,
      ml_fee_brl: null,
      suse7_fee_brl: m.sale_fee_amount_brl ?? m.fee_amount_brl ?? null,
      ml_shipping_brl: null,
      suse7_shipping_brl: m.shipping_cost_amount_brl ?? null,
      ml_payout_brl: null,
      suse7_payout_brl: m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? null,
      diff_discount_brl: mlDisc && suse7Disc ? `${Number(suse7Disc) - Number(mlDisc)}` : null,
      diff_discount_pct: mlPct && suse7Pct ? `${Number(suse7Pct) - Number(mlPct)}` : null,
      diff_payout_brl: null,
      discount_source: audit.discount_source ?? null,
    });
  }
}

/**
 * Auditoria financeira profunda por promoção (DEV).
 *
 * @param {{ scenario: unknown; group: string }[]} rows
 * @param {string | null | undefined} listingExternalId
 */
export function logPiPromoFinAuditDeep(rows, listingExternalId = null) {
  if (!import.meta.env.DEV) return;
  const list = Array.isArray(rows) ? rows : [];
  for (const { scenario } of list) {
    if (!scenario || typeof scenario !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const m =
      r.marketplace != null && typeof r.marketplace === "object"
        ? /** @type {Record<string, unknown>} */ (r.marketplace)
        : /** @type {Record<string, unknown>} */ ({});
    const audit =
      r.ml_financial_audit != null && typeof r.ml_financial_audit === "object"
        ? /** @type {Record<string, unknown>} */ (r.ml_financial_audit)
        : /** @type {Record<string, unknown>} */ ({});
    console.info("[S7_PI_PROMO_FIN_AUDIT_DEEP]", {
      listingExternalId: listingExternalId ?? null,
      promotion_id: r.promotion_id ?? audit.promotion_id ?? null,
      type: r.promotion_type ?? audit.type ?? null,
      original_price: audit.original_price ?? m.original_price_brl ?? null,
      promotion_price: audit.promotion_price ?? m.sale_price_brl ?? null,
      seller_percentage: audit.seller_percentage ?? null,
      meli_percentage: audit.meli_percentage ?? null,
      discount_seller_brl: audit.discount_seller_brl ?? m.seller_discount_amount_brl ?? null,
      discount_meli_brl: audit.discount_meli_brl ?? m.promotion_subsidy_amount_brl ?? null,
      discount_total_brl: audit.discount_total_brl ?? null,
      boosted_offer: audit.boosted_offer ?? null,
      discount_meli_boost_amount: audit.discount_meli_boost_amount ?? null,
      total_price_for_boosted_offer: audit.total_price_for_boosted_offer ?? null,
      fee_before_subsidy: m.fee_amount_before_promo_subsidy_brl ?? m.sale_fee_amount_brl ?? null,
      fee_after_subsidy: m.fee_amount_after_promo_subsidy_brl ?? null,
      payout_before_subsidy: m.payout_before_promo_subsidy_brl ?? null,
      payout_after_subsidy:
        m.marketplace_payout_amount_brl ?? m.net_receivable_brl ?? m.payout_after_promo_subsidy_brl ?? null,
      meli_subsidy_source: audit.meli_subsidy_source ?? null,
      discount_source: audit.discount_source ?? null,
    });
  }
}
