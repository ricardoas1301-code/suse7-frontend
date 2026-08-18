// ======================================================
// PI — ViewModel final da receita marketplace nos cards centrais de Promoções.
// Fonte autoritativa da redução de tarifa: promoção selecionada (contrato normalizado).
// Decimal.js — sem float.
// ======================================================

import Decimal from "decimal.js";

import { obterContratoPrecoMiniCardPromocao } from "../../../components/pricing/pricingPromotionCardContract.js";
import {
  extrairAjustesFinanceirosPromocaoSelecionada,
  resolverAjustesFinanceirosPromocaoComOrigem,
} from "./aplicarReducaoTarifaPromocaoNoCenario.js";
import { calcularResultadoPromocionalReconciliado } from "./calcularResultadoPromocionalReconciliado.js";
import {
  montarResultadoPromocionalCardReconciliado,
  resolverMarketplaceReceivablePromocionalExibido,
  resolverPrecoVendaPromocionalCard,
} from "./resolverComponentesFinanceirosPromocaoCard.js";

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

  const saleDec = resolverPrecoVendaPromocionalCard({
    scenario: sim,
    selectedPromotion: promo,
    promocaoPrecoVendaExibicaoOverride,
  });

  const grossFeeDec =
    pickDec(m, [
      "fee_amount_before_promo_subsidy_brl",
      "promotion_fee_gross_brl",
      "sale_fee_amount_brl",
      "fee_amount_brl",
    ]) ?? new Decimal(0);

  const shipDec = pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ?? new Decimal(0);

  const amountReceiveStr = resolverMarketplaceReceivablePromocionalExibido({
    scenario: sim,
    selectedPromotion: promo,
    promocaoPrecoVendaExibicaoOverride,
  });
  const amountReceiveDec = toDec(amountReceiveStr);

  const { ajustes: ajustesSelecionados, sourcePath: sourceUsedForFeeDiscount } =
    resolverAjustesFinanceirosPromocaoComOrigem(promo);

  const ajustesCenario = extrairAjustesFinanceirosPromocaoSelecionada(sim);

  let feeDiscountDec = ajustesSelecionados != null ? toDec(ajustesSelecionados.marketplace_fee_discount_brl) : null;

  const amountBeforeDec =
    saleDec != null ? saleDec.minus(grossFeeDec).minus(shipDec) : null;

  if (
    (feeDiscountDec == null || !feeDiscountDec.gt(0)) &&
    amountReceiveDec != null &&
    amountBeforeDec != null &&
    amountReceiveDec.gt(amountBeforeDec)
  ) {
    feeDiscountDec = amountReceiveDec.minus(amountBeforeDec).toDecimalPlaces(2, ROUND);
  }

  const scenarioFeeDiscountDec =
    ajustesCenario != null
      ? toDec(ajustesCenario.marketplace_fee_discount_brl)
      : pickDec(m, ["fee_discount_brl", "marketplace_fee_discount_amount_brl", "marketplace_fee_discount_brl"]);

  const shouldRenderFeeDiscountLine = feeDiscountDec != null && feeDiscountDec.gt(0);

  return {
    listing_type: listingType,
    sale_price_brl: decStr2(saleDec),
    gross_sale_fee_brl: decStr2(grossFeeDec),
    shipping_cost_brl: decStr2(shipDec),
    marketplace_fee_discount_brl: shouldRenderFeeDiscountLine ? decStr2(feeDiscountDec) : "0.00",
    amount_to_receive_before_fee_discount_brl: decStr2(amountBeforeDec),
    amount_to_receive_brl: amountReceiveStr ?? decStr2(amountBeforeDec),
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

  const reconciliadoCard = montarResultadoPromocionalCardReconciliado({
    scenario: sim,
    selectedPromotion: promo,
    listingType,
    promocaoPrecoVendaExibicaoOverride,
  });

  const reconciliado =
    reconciliadoCard != null
      ? {
          profit_brl: reconciliadoCard.profit_brl,
          margin_pct: reconciliadoCard.margin_pct,
          offer_status_semantic: reconciliadoCard.offer_status_semantic,
          health_status: reconciliadoCard.health_status,
        }
      : calcularResultadoPromocionalReconciliado({
          scenario: sim,
          marketplaceReceivableBrl: revenue.amount_to_receive_brl,
          salePriceBrl: revenue.sale_price_brl,
        });

  const profitBrl = reconciliado?.profit_brl ?? null;
  const marginPct = reconciliado?.margin_pct ?? null;
  const offerStatusSemantic = reconciliado?.offer_status_semantic ?? null;
  const healthStatus = reconciliado?.health_status ?? null;

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
    reconciliadoCard,
    auditPayload,
  };
}
