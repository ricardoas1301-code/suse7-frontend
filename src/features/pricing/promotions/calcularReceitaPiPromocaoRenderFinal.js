// ======================================================
// PI — cálculo final da receita no render (aba Promoções).
// Fonte autoritativa: snapshot imutável do clique no mini card.
// Decimal.js — sem float.
// ======================================================

import Decimal from "decimal.js";

import { obterContratoPrecoMiniCardPromocao } from "../../../components/pricing/pricingPromotionCardContract.js";
import { inferirReducaoTarifaPorReconciliacaoPayout } from "./capturarSnapshotFinanceiroPromocaoSelecionada.js";
import { resolverAjustesFinanceirosPromocaoComOrigem } from "./aplicarReducaoTarifaPromocaoNoCenario.js";

const ROUND = Decimal.ROUND_HALF_UP;
const TOLERANCIA_BRL = new Decimal("0.02");

/** @param {unknown} v @returns {Decimal | null} */
function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v).replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null | undefined} d @returns {string | null} */
function decStr2(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {Record<string, unknown>} src @param {string[]} keys @returns {Decimal | null} */
function pickDec(src, keys) {
  for (const key of keys) {
    const d = toDec(src[key]);
    if (d != null && d.gte(0)) return d;
  }
  return null;
}

/**
 * @param {unknown} selectedPromotion
 * @returns {{ feeDiscountDec: Decimal | null; sourcePath: string | null; officialReceiveDec: Decimal | null }}
 */
export function extrairReducaoTarifaDaPromocaoSelecionada(selectedPromotion) {
  if (selectedPromotion == null || typeof selectedPromotion !== "object") {
    return { feeDiscountDec: null, sourcePath: null, officialReceiveDec: null };
  }
  const promo = /** @type {Record<string, unknown>} */ (selectedPromotion);
  const { ajustes, sourcePath } = resolverAjustesFinanceirosPromocaoComOrigem(promo);

  let feeDiscountDec =
    ajustes != null ? toDec(ajustes.marketplace_fee_discount_brl) : null;

  const cardPreco = obterContratoPrecoMiniCardPromocao(promo);
  const officialReceiveDec =
    toDec(ajustes?.official_amount_to_receive_brl) ??
    toDec(cardPreco?.seller_receives_brl) ??
    toDec(
      promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (promo.promotion_offer_contract).seller_receives_brl
        : null,
    );

  if (feeDiscountDec == null || !feeDiscountDec.gt(0)) {
    const card =
      promo.promotion_card_contract != null && typeof promo.promotion_card_contract === "object"
        ? /** @type {Record<string, unknown>} */ (promo.promotion_card_contract)
        : null;
    const offer =
      promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (promo.promotion_offer_contract)
        : null;
    feeDiscountDec =
      pickDec(card ?? {}, ["marketplace_fee_reduction_brl", "marketplace_fee_discount_brl"]) ??
      pickDec(offer ?? {}, ["marketplace_fee_reduction_brl", "marketplace_fee_discount_brl"]) ??
      null;
  }

  return {
    feeDiscountDec: feeDiscountDec != null && feeDiscountDec.gt(0) ? feeDiscountDec.toDecimalPlaces(2, ROUND) : null,
    sourcePath,
    officialReceiveDec,
  };
}

/** @param {unknown} financialSnapshot */
function montarPromocaoAPartirDoSnapshot(financialSnapshot) {
  if (financialSnapshot == null || typeof financialSnapshot !== "object") return null;
  const snap = /** @type {Record<string, unknown>} */ (financialSnapshot);
  return {
    promotion_id: snap.promotion_id ?? null,
    promotion_name: snap.promotion_name ?? null,
    promotion_card_contract: snap.raw_promotion_card_contract ?? null,
    promotion_offer_contract: snap.raw_promotion_offer_contract ?? null,
  };
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionRevenueSectionRenderFinal(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_REVENUE_SECTION_RENDER_FINAL]", payload);
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionRevenueSectionFinalFromSnapshot(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_REVENUE_SECTION_FINAL_FROM_SNAPSHOT]", payload);
}

/**
 * Cálculo autoritativo no render final.
 * Snapshot (clique mini card) vence selectedPromotion mutável e payout cru da simulação.
 *
 * @param {{
 *   selectedPromotion?: unknown;
 *   financialSnapshot?: unknown;
 *   scenario: unknown;
 *   listingType?: string | null;
 *   listingExternalId?: string | null;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 * }} params
 */
export function calcularReceitaPiPromocaoRenderFinal({
  selectedPromotion = null,
  financialSnapshot = null,
  scenario,
  listingType = null,
  listingExternalId = null,
  promocaoPrecoVendaExibicaoOverride = null,
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : /** @type {Record<string, unknown>} */ ({});

  const snap =
    financialSnapshot != null && typeof financialSnapshot === "object"
      ? /** @type {Record<string, unknown>} */ (financialSnapshot)
      : null;

  const promoFromSnapshot = montarPromocaoAPartirDoSnapshot(snap);
  const promo =
    promoFromSnapshot != null
      ? /** @type {Record<string, unknown>} */ (promoFromSnapshot)
      : selectedPromotion != null && typeof selectedPromotion === "object"
        ? /** @type {Record<string, unknown>} */ (selectedPromotion)
        : null;

  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const cardPreco = promo != null ? obterContratoPrecoMiniCardPromocao(promo) : null;

  const saleFromOverride =
    promocaoPrecoVendaExibicaoOverride != null && String(promocaoPrecoVendaExibicaoOverride).trim() !== ""
      ? toDec(
          String(promocaoPrecoVendaExibicaoOverride)
            .replace(/[^\d,.-]/g, "")
            .replace(",", "."),
        )
      : null;

  const saleDec =
    saleFromOverride ??
    toDec(snap?.buyer_final_price_brl) ??
    (cardPreco?.real_promotion_final_price_brl != null
      ? toDec(cardPreco.real_promotion_final_price_brl)
      : null) ??
    toDec(m.sale_price_brl) ??
    toDec(sim.sale_price_brl);

  const grossFeeDec =
    pickDec(m, [
      "fee_amount_before_promo_subsidy_brl",
      "promotion_fee_gross_brl",
      "sale_fee_amount_brl",
      "fee_amount_brl",
    ]) ?? new Decimal(0);

  const shipDec =
    pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ?? new Decimal(0);

  const rawReceiveDec =
    toDec(m.marketplace_payout_amount_brl) ??
    toDec(m.net_receivable_brl) ??
    toDec(sim.net_receivable_brl);

  const amountBeforeDec =
    saleDec != null ? saleDec.minus(grossFeeDec).minus(shipDec) : null;

  const snapshotFeeDec = toDec(snap?.marketplace_fee_discount_brl);
  const snapshotOfficialDec = toDec(snap?.official_amount_to_receive_brl);

  const { feeDiscountDec: promoFeeDec, sourcePath, officialReceiveDec: promoOfficialDec } =
    promo != null
      ? extrairReducaoTarifaDaPromocaoSelecionada(promo)
      : { feeDiscountDec: null, sourcePath: null, officialReceiveDec: null };

  const inferredFeeStr =
    snapshotFeeDec == null || !snapshotFeeDec.gt(0)
      ? inferirReducaoTarifaPorReconciliacaoPayout({
          official_amount_to_receive_brl:
            snap?.official_amount_to_receive_brl != null
              ? String(snap.official_amount_to_receive_brl)
              : promoOfficialDec != null
                ? decStr2(promoOfficialDec)
                : null,
          sale_price_brl: decStr2(saleDec),
          gross_sale_fee_brl: decStr2(grossFeeDec),
          shipping_cost_brl: decStr2(shipDec),
        })
      : null;

  const inferredFeeDec = inferredFeeStr != null ? toDec(inferredFeeStr) : null;

  let finalFeeDiscountDec =
    snapshotFeeDec != null && snapshotFeeDec.gt(0)
      ? snapshotFeeDec
      : promoFeeDec != null && promoFeeDec.gt(0)
        ? promoFeeDec
        : inferredFeeDec != null && inferredFeeDec.gt(0)
          ? inferredFeeDec
          : null;

  let finalReceiveDec = amountBeforeDec;
  if (finalReceiveDec != null && finalFeeDiscountDec != null && finalFeeDiscountDec.gt(0)) {
    finalReceiveDec = finalReceiveDec.plus(finalFeeDiscountDec);
  }

  const officialReceiveDec =
    snapshotOfficialDec ?? promoOfficialDec ?? null;

  if (
    officialReceiveDec != null &&
    finalReceiveDec != null &&
    finalFeeDiscountDec != null &&
    finalFeeDiscountDec.gt(0) &&
    officialReceiveDec.minus(finalReceiveDec).abs().gt(TOLERANCIA_BRL)
  ) {
    finalReceiveDec = officialReceiveDec.toDecimalPlaces(2, ROUND);
  } else if (
    officialReceiveDec != null &&
    finalFeeDiscountDec != null &&
    finalFeeDiscountDec.gt(0) &&
    finalReceiveDec == null
  ) {
    finalReceiveDec = officialReceiveDec.toDecimalPlaces(2, ROUND);
  }

  const shouldRenderFeeDiscount = finalFeeDiscountDec != null && finalFeeDiscountDec.gt(0);

  const promotionId =
    snap?.promotion_id != null
      ? String(snap.promotion_id)
      : promo?.promotion_id != null
        ? String(promo.promotion_id)
        : cardPreco?.promotion_id != null
          ? String(cardPreco.promotion_id)
          : null;

  const promotionName =
    snap?.promotion_name != null
      ? String(snap.promotion_name)
      : promo?.promotion_name != null
        ? String(promo.promotion_name)
        : promo?.label != null
          ? String(promo.label)
          : null;

  const feeDiscountSource =
    snap?.fee_discount_source != null
      ? String(snap.fee_discount_source)
      : snapshotFeeDec != null && snapshotFeeDec.gt(0)
        ? "financial_snapshot.marketplace_fee_discount_brl"
        : inferredFeeDec != null && inferredFeeDec.gt(0)
          ? "financial_snapshot.reconciliation"
          : sourcePath;

  const renderPayload = {
    listing_id: listingExternalId ?? snap?.listing_id ?? null,
    promotion_id: promotionId,
    promotion_name: promotionName,
    listing_type: listingType,
    snapshot_key: snap?.snapshot_key ?? null,
    has_snapshot: snap?.has_snapshot === true,
    sale_price_brl: decStr2(saleDec),
    gross_sale_fee_brl: decStr2(grossFeeDec),
    shipping_cost_brl: decStr2(shipDec),
    scenario_raw_amount_to_receive_brl: decStr2(amountBeforeDec ?? rawReceiveDec),
    snapshot_official_amount_to_receive_brl:
      snap?.official_amount_to_receive_brl != null
        ? String(snap.official_amount_to_receive_brl)
        : null,
    snapshot_fee_discount_brl:
      snap?.marketplace_fee_discount_brl != null
        ? String(snap.marketplace_fee_discount_brl)
        : "0.00",
    inferred_fee_discount_brl: inferredFeeStr,
    final_fee_discount_brl: shouldRenderFeeDiscount ? decStr2(finalFeeDiscountDec) : "0.00",
    final_amount_to_receive_brl: decStr2(finalReceiveDec ?? amountBeforeDec ?? rawReceiveDec),
    should_render_fee_discount_line: shouldRenderFeeDiscount,
    fee_discount_label: "Reduzimos sua tarifa",
    component_name: "MercadoLivrePricingScenarioRevenueSection",
    has_selected_promotion: promo != null,
    selected_promotion_source_path: feeDiscountSource,
    raw_amount_to_receive_brl: decStr2(amountBeforeDec ?? rawReceiveDec),
    selected_promotion_fee_discount_brl: shouldRenderFeeDiscount ? decStr2(finalFeeDiscountDec) : "0.00",
  };

  return renderPayload;
}
