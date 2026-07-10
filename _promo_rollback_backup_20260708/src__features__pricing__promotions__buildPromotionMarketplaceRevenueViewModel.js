// ======================================================
// PI — ViewModel final da receita marketplace nos cards centrais de Promoções.
// Fonte autoritativa da redução de tarifa: promoção selecionada (contrato normalizado).
// Decimal.js — sem float.
// ======================================================

import Decimal from "decimal.js";

import { obterContratoPrecoMiniCardPromocao } from "../../../components/pricing/pricingPromotionCardContract.js";
import { getOfferStatusFromMargin } from "../../../components/mercadoLivrePricingScenarioCompareShared.js";
import {
  extrairAjustesFinanceirosPromocaoSelecionada,
  resolverAjustesFinanceirosPromocaoComOrigem,
} from "./aplicarReducaoTarifaPromocaoNoCenario.js";

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
    if (d != null && d.gt(0)) return d;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionCardRenderViewModel(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_CARD_RENDER_VIEWMODEL]", payload);
}

/**
 * @param {{
 *   selectedPromotion: unknown;
 *   scenario: unknown;
 *   listingType?: string | null;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 * }} params
 */
export function buildPromotionMarketplaceRevenueViewModel({
  selectedPromotion,
  scenario,
  listingType = null,
  promocaoPrecoVendaExibicaoOverride = null,
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : /** @type {Record<string, unknown>} */ ({});
  const promo =
    selectedPromotion != null && typeof selectedPromotion === "object"
      ? /** @type {Record<string, unknown>} */ (selectedPromotion)
      : /** @type {Record<string, unknown>} */ ({});

  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const { ajustes: ajustesSelecionados, sourcePath: sourceUsedForFeeDiscount } =
    resolverAjustesFinanceirosPromocaoComOrigem(promo);

  const ajustesCenario = extrairAjustesFinanceirosPromocaoSelecionada(sim);

  let feeDiscountDec = ajustesSelecionados != null ? toDec(ajustesSelecionados.marketplace_fee_discount_brl) : null;

  const cardPreco = obterContratoPrecoMiniCardPromocao(promo);
  const saleFromCard =
    cardPreco?.real_promotion_final_price_brl != null
      ? toDec(cardPreco.real_promotion_final_price_brl)
      : null;

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
    saleFromCard ??
    toDec(m.sale_price_brl) ??
    toDec(sim.sale_price_brl) ??
    toDec(ajustesSelecionados?.buyer_final_price_brl);

  const grossFeeDec =
    pickDec(m, [
      "fee_amount_before_promo_subsidy_brl",
      "promotion_fee_gross_brl",
      "sale_fee_amount_brl",
      "fee_amount_brl",
    ]) ?? new Decimal(0);

  const shipDec = pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ?? new Decimal(0);

  const officialReceiveDec =
    toDec(ajustesSelecionados?.official_amount_to_receive_brl) ??
    toDec(cardPreco?.seller_receives_brl) ??
    toDec(
      promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (promo.promotion_offer_contract).seller_receives_brl
        : null,
    );

  const amountBeforeDec =
    saleDec != null ? saleDec.minus(grossFeeDec).minus(shipDec) : null;

  if (
    (feeDiscountDec == null || !feeDiscountDec.gt(0)) &&
    officialReceiveDec != null &&
    amountBeforeDec != null &&
    officialReceiveDec.gt(amountBeforeDec)
  ) {
    feeDiscountDec = officialReceiveDec.minus(amountBeforeDec).toDecimalPlaces(2, ROUND);
  }

  const scenarioFeeDiscountDec =
    ajustesCenario != null
      ? toDec(ajustesCenario.marketplace_fee_discount_brl)
      : pickDec(m, ["fee_discount_brl", "marketplace_fee_discount_amount_brl", "marketplace_fee_discount_brl"]);

  let amountReceiveDec = amountBeforeDec;
  if (amountReceiveDec != null && feeDiscountDec != null && feeDiscountDec.gt(0)) {
    amountReceiveDec = amountReceiveDec.plus(feeDiscountDec);
  }

  if (
    officialReceiveDec != null &&
    amountReceiveDec != null &&
    feeDiscountDec != null &&
    feeDiscountDec.gt(0) &&
    officialReceiveDec.minus(amountReceiveDec).abs().gt(TOLERANCIA_BRL)
  ) {
    amountReceiveDec = officialReceiveDec.toDecimalPlaces(2, ROUND);
  }

  const shouldRenderFeeDiscountLine = feeDiscountDec != null && feeDiscountDec.gt(0);

  return {
    listing_type: listingType,
    sale_price_brl: decStr2(saleDec),
    gross_sale_fee_brl: decStr2(grossFeeDec),
    shipping_cost_brl: decStr2(shipDec),
    marketplace_fee_discount_brl: shouldRenderFeeDiscountLine ? decStr2(feeDiscountDec) : "0.00",
    amount_to_receive_before_fee_discount_brl: decStr2(amountBeforeDec),
    amount_to_receive_brl: decStr2(amountReceiveDec ?? amountBeforeDec),
    should_render_fee_discount_line: shouldRenderFeeDiscountLine,
    fee_discount_label: "Reduzimos sua tarifa",
    source_used_for_fee_discount: sourceUsedForFeeDiscount,
    selected_fee_discount_brl: shouldRenderFeeDiscountLine ? decStr2(feeDiscountDec) : "0.00",
    scenario_fee_discount_brl: decStr2(scenarioFeeDiscountDec) ?? "0.00",
    viewmodel_fee_discount_brl: shouldRenderFeeDiscountLine ? decStr2(feeDiscountDec) : "0.00",
  };
}

/**
 * ViewModel completo do card central PI (receita + resultado ajustado pela redução de tarifa).
 *
 * @param {{
 *   selectedPromotion: unknown;
 *   scenario: unknown;
 *   listingType?: string | null;
 *   listingExternalId?: string | null;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 *   componentName?: string | null;
 *   renderPhase?: string | null;
 * }} params
 */
export function buildPromotionCardViewModel({
  selectedPromotion,
  scenario,
  listingType = null,
  listingExternalId = null,
  promocaoPrecoVendaExibicaoOverride = null,
  componentName = "MercadoLivrePricingScenarioRevenueSection",
  renderPhase = "final",
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : /** @type {Record<string, unknown>} */ ({});
  const promo =
    selectedPromotion != null && typeof selectedPromotion === "object"
      ? /** @type {Record<string, unknown>} */ (selectedPromotion)
      : /** @type {Record<string, unknown>} */ ({});

  const revenue = buildPromotionMarketplaceRevenueViewModel({
    selectedPromotion,
    scenario,
    listingType,
    promocaoPrecoVendaExibicaoOverride,
  });

  const mSim =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const res =
    sim.result != null && typeof sim.result === "object"
      ? /** @type {Record<string, unknown>} */ (sim.result)
      : /** @type {Record<string, unknown>} */ ({});

  const profitBeforeDec = toDec(res.profit_brl);
  const feeDiscountDec = toDec(revenue.marketplace_fee_discount_brl);
  const saleDec = toDec(revenue.sale_price_brl);
  const vmPayoutDec = toDec(revenue.amount_to_receive_brl);
  const simPayoutDec =
    toDec(mSim.marketplace_payout_amount_brl) ??
    toDec(mSim.net_receivable_brl) ??
    toDec(sim.net_receivable_brl);

  let profitBrl = res.profit_brl != null ? String(res.profit_brl) : null;
  let marginPct = res.margin_pct != null ? String(res.margin_pct) : null;
  let offerStatusSemantic = res.offer_status_semantic != null ? String(res.offer_status_semantic) : null;
  let healthStatus = res.health_status != null ? String(res.health_status) : null;

  const lucroJaRefleteReducaoTarifa =
    simPayoutDec != null &&
    vmPayoutDec != null &&
    simPayoutDec.minus(vmPayoutDec).abs().lte(TOLERANCIA_BRL);

  if (
    profitBeforeDec != null &&
    feeDiscountDec != null &&
    feeDiscountDec.gt(0) &&
    !lucroJaRefleteReducaoTarifa
  ) {
    const profitAdj = profitBeforeDec.plus(feeDiscountDec);
    profitBrl = decStr2(profitAdj);
    if (saleDec != null && saleDec.gt(0)) {
      const marginAdj = profitAdj.times(100).div(saleDec);
      marginPct = decStr2(marginAdj);
      const tone = getOfferStatusFromMargin(marginPct);
      offerStatusSemantic = tone?.level ?? tone?.color ?? offerStatusSemantic;
      healthStatus = tone?.label ?? healthStatus;
    }
  }

  const promotionId =
    promo.promotion_id != null
      ? String(promo.promotion_id)
      : promo.promotion_card_contract != null &&
          typeof promo.promotion_card_contract === "object" &&
          /** @type {Record<string, unknown>} */ (promo.promotion_card_contract).promotion_id != null
        ? String(/** @type {Record<string, unknown>} */ (promo.promotion_card_contract).promotion_id)
        : null;

  const promotionName =
    promo.promotion_name != null
      ? String(promo.promotion_name)
      : promo.label != null
        ? String(promo.label)
        : null;

  const auditPayload = {
    listing_id: listingExternalId,
    promotion_id: promotionId,
    promotion_name: promotionName,
    listing_type: listingType,
    render_phase: renderPhase,
    selected_fee_discount_brl: revenue.selected_fee_discount_brl,
    scenario_fee_discount_brl: revenue.scenario_fee_discount_brl,
    viewmodel_fee_discount_brl: revenue.viewmodel_fee_discount_brl,
    sale_price_brl: revenue.sale_price_brl,
    gross_sale_fee_brl: revenue.gross_sale_fee_brl,
    shipping_cost_brl: revenue.shipping_cost_brl,
    amount_to_receive_before_fee_discount_brl: revenue.amount_to_receive_before_fee_discount_brl,
    amount_to_receive_brl: revenue.amount_to_receive_brl,
    should_render_fee_discount_line: revenue.should_render_fee_discount_line,
    source_used_for_fee_discount: revenue.source_used_for_fee_discount,
    component_name: componentName,
  };

  return {
    revenue,
    profit_brl: profitBrl,
    margin_pct: marginPct,
    offer_status_semantic: offerStatusSemantic,
    health_status: healthStatus,
    auditPayload,
  };
}
