// ======================================================
// PI — aplica redução de tarifa ML no marketplace do cenário simulado.
// Não altera tarifa bruta oficial — corrige payout, lucro e margem.
// ======================================================

import Decimal from "decimal.js";

import { obterContratoPrecoMiniCardPromocao } from "../../../components/pricing/pricingPromotionCardContract.js";
import { getOfferStatusFromMargin } from "../../../components/mercadoLivrePricingScenarioCompareShared.js";

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

/**
 * @param {Record<string, unknown>} src
 * @param {string[]} keys
 * @returns {Decimal | null}
 */
function pickAmountDec(src, keys) {
  for (const key of keys) {
    const d = toDec(src[key]);
    if (d != null && d.gt(0)) return d;
  }
  return null;
}

/**
 * @param {Record<string, unknown> | null | undefined} raw
 * @returns {Record<string, unknown> | null}
 */
function normalizarAjustesFinanceiros(raw) {
  if (raw == null || typeof raw !== "object") return null;
  const feeDec = pickAmountDec(raw, [
    "marketplace_fee_discount_brl",
    "marketplace_fee_reduction_brl",
    "fee_discount_brl",
  ]);
  if (feeDec == null || !feeDec.gt(0)) return null;

  return {
    ...raw,
    marketplace_fee_discount_brl: decStr2(feeDec),
    marketplace_price_subsidy_brl: raw.marketplace_price_subsidy_brl ?? "0.00",
    has_marketplace_fee_discount: true,
    has_marketplace_price_subsidy: raw.has_marketplace_price_subsidy === true,
    marketplace_fee_discount_label:
      raw.marketplace_fee_discount_label != null &&
      String(raw.marketplace_fee_discount_label).trim() !== ""
        ? String(raw.marketplace_fee_discount_label).trim()
        : "Reduzimos sua tarifa",
  };
}

/**
 * Candidatos de ajuste financeiro — contratos da promoção (mini card) antes do top-level,
 * que pode vir zerado/falso da simulação async.
 *
 * @param {Record<string, unknown>} promo
 * @returns {{ path: string; raw: Record<string, unknown> }[]}
 */
function montarCandidatosAjustesFinanceirosPromocao(promo) {
  /** @type {{ path: string; raw: Record<string, unknown> }[]} */
  const candidatos = [];

  const card =
    promo.promotion_card_contract != null && typeof promo.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (promo.promotion_card_contract)
      : null;
  const offer =
    promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (promo.promotion_offer_contract)
      : null;

  if (card?.promotion_financial_adjustments != null) {
    candidatos.push({
      path: "promotion_card_contract.promotion_financial_adjustments",
      raw: /** @type {Record<string, unknown>} */ (card.promotion_financial_adjustments),
    });
  }
  if (offer?.promotion_financial_adjustments != null) {
    candidatos.push({
      path: "promotion_offer_contract.promotion_financial_adjustments",
      raw: /** @type {Record<string, unknown>} */ (offer.promotion_financial_adjustments),
    });
  }
  if (card != null) {
    candidatos.push({
      path: "promotion_card_contract.fee_discount_fields",
      raw: {
        marketplace_fee_discount_brl: card.marketplace_fee_discount_brl,
        marketplace_fee_reduction_brl: card.marketplace_fee_reduction_brl,
        official_amount_to_receive_brl: card.seller_receives_brl,
      },
    });
  }
  if (offer != null) {
    candidatos.push({
      path: "promotion_offer_contract.fee_discount_fields",
      raw: {
        marketplace_fee_discount_brl: offer.marketplace_fee_discount_brl,
        marketplace_fee_reduction_brl: offer.marketplace_fee_reduction_brl,
        official_amount_to_receive_brl: offer.seller_receives_brl,
      },
    });
  }

  const cardPreco = obterContratoPrecoMiniCardPromocao(promo);
  if (cardPreco != null) {
    candidatos.push({
      path: "promotion_card_contract.preco_mini_card",
      raw: {
        marketplace_fee_discount_brl: cardPreco.marketplace_fee_discount_brl,
        marketplace_fee_reduction_brl: cardPreco.marketplace_fee_reduction_brl,
        official_amount_to_receive_brl: cardPreco.seller_receives_brl,
      },
    });
  }

  if (promo.promotion_fee_discount != null && typeof promo.promotion_fee_discount === "object") {
    const fd = /** @type {Record<string, unknown>} */ (promo.promotion_fee_discount);
    candidatos.push({
      path: "promotion_fee_discount",
      raw: {
        marketplace_fee_discount_brl: fd.marketplace_fee_discount_brl,
        official_amount_to_receive_brl: fd.official_amount_to_receive_brl ?? fd.calculated_amount_to_receive_brl,
        has_marketplace_fee_discount: fd.has_marketplace_fee_discount,
      },
    });
  }

  const audit =
    promo.ml_financial_audit != null && typeof promo.ml_financial_audit === "object"
      ? /** @type {Record<string, unknown>} */ (promo.ml_financial_audit)
      : null;
  if (audit != null) {
    candidatos.push({
      path: "ml_financial_audit",
      raw: {
        marketplace_fee_discount_brl: audit.fee_discount_brl ?? audit.discount_meli_brl,
        official_amount_to_receive_brl: audit.amount_to_receive,
      },
    });
  }

  const mPromo =
    promo.marketplace != null && typeof promo.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (promo.marketplace)
      : null;
  if (mPromo != null) {
    candidatos.push({
      path: "promo.marketplace",
      raw: {
        marketplace_fee_discount_brl:
          mPromo.fee_discount_brl ??
          mPromo.marketplace_fee_discount_amount_brl ??
          mPromo.promotion_subsidy_amount_brl,
        official_amount_to_receive_brl: mPromo.marketplace_payout_amount_brl ?? mPromo.net_receivable_brl,
      },
    });
  }

  if (promo.promotion_financial_adjustments != null) {
    candidatos.push({
      path: "promotion_financial_adjustments",
      raw: /** @type {Record<string, unknown>} */ (promo.promotion_financial_adjustments),
    });
  }

  return candidatos;
}

/**
 * @param {Record<string, unknown>} promo
 * @returns {{ ajustes: Record<string, unknown> | null; sourcePath: string | null }}
 */
export function resolverAjustesFinanceirosPromocaoComOrigem(promo) {
  for (const { path, raw } of montarCandidatosAjustesFinanceirosPromocao(promo)) {
    const norm = normalizarAjustesFinanceiros(raw);
    if (norm != null) return { ajustes: norm, sourcePath: path };
  }
  return { ajustes: null, sourcePath: null };
}

/**
 * @param {Record<string, unknown>} promo
 * @returns {Record<string, unknown> | null}
 */
export function obterAjustesFinanceirosPromocao(promo) {
  return resolverAjustesFinanceirosPromocaoComOrigem(promo).ajustes;
}

/** @param {Record<string, unknown>} promo @returns {Record<string, unknown> | null} */
export function extrairAjustesFinanceirosPromocaoSelecionada(promo) {
  return obterAjustesFinanceirosPromocao(promo);
}

/**
 * Remove metadados de promoção embutidos no cenário bruto da simulação async
 * (evita sobrescrever o contrato normalizado da promoção selecionada).
 *
 * @param {unknown} cenarioSimulado
 * @returns {Record<string, unknown> | null}
 */
export function sanitizarCenarioSimuladoBrutoPromocao(cenarioSimulado) {
  if (cenarioSimulado == null || typeof cenarioSimulado !== "object") return null;
  const bruto = /** @type {Record<string, unknown>} */ (cenarioSimulado);
  const sim = { ...bruto };

  delete sim.promotion_financial_adjustments;
  delete sim.promotion_funding;
  delete sim.promotion_fee_discount;
  delete sim.promotion_card_contract;
  delete sim.promotion_offer_contract;
  delete sim.promotion_calc_card_selection_contract;
  delete sim.ml_financial_audit;
  delete sim.promotion_id;
  delete sim.promotion_name;
  delete sim.promotion_type;

  if (sim.marketplace != null && typeof sim.marketplace === "object") {
    const m = /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (sim.marketplace) });
    delete m.fee_discount_brl;
    delete m.marketplace_fee_discount_amount_brl;
    delete m.marketplace_fee_discount_brl;
    delete m.promotion_subsidy_amount_brl;
    delete m.charged_fee_discount_brl;
    delete m.has_fee_subsidy;
    delete m.fee_amount_after_promo_subsidy_brl;
    delete m.sale_fee_net_display_brl;
    delete m.promotion_fee_net_brl;
    sim.marketplace = m;
  }

  if (sim.sale_xray_pricing != null && typeof sim.sale_xray_pricing === "object") {
    const sx = /** @type {Record<string, unknown>} */ ({
      .../** @type {Record<string, unknown>} */ (sim.sale_xray_pricing),
    });
    delete sx.has_fee_subsidy;
    delete sx.show_fee_subsidy_breakdown;
    delete sx.subsidy_ml_brl;
    sim.sale_xray_pricing = sx;
  }

  return sim;
}

/**
 * Preserva extras/custos já calculados pelo backend — ajusta só pelo delta do repasse.
 *
 * @param {Record<string, unknown>} sim
 * @param {Decimal} payoutAnteriorDec
 * @param {Decimal} payoutNovoDec
 * @param {Decimal} profitAnteriorDec
 */
function recalcularResultadoPorDeltaPayout(sim, payoutAnteriorDec, payoutNovoDec, profitAnteriorDec) {
  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : {};
  const res =
    sim.result != null && typeof sim.result === "object"
      ? /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (sim.result) })
      : /** @type {Record<string, unknown>} */ ({});

  const salePrice = toDec(m.sale_price_brl ?? sim.sale_price_brl);
  const deltaPayout = payoutNovoDec.minus(payoutAnteriorDec);
  const profit = profitAnteriorDec.plus(deltaPayout);
  const marginPct = salePrice != null && salePrice.gt(0) ? profit.times(100).div(salePrice) : null;
  const tone = getOfferStatusFromMargin(marginPct != null ? decStr2(marginPct) : null);

  sim.result = {
    ...res,
    profit_brl: decStr2(profit),
    margin_pct: marginPct != null ? decStr2(marginPct) : res.margin_pct ?? null,
    offer_status_semantic: tone?.level ?? tone?.color ?? res.offer_status_semantic ?? null,
    health_status: tone?.label ?? res.health_status ?? null,
    offer_status_margin_basis: "marketplace_payout_with_fee_discount_brl",
    profit_adjusted_by_fee_discount_brl: decStr2(deltaPayout),
  };
}

/**
 * @param {Record<string, unknown>} sim
 * @param {Decimal} payoutDec
 */
function recalcularResultadoComPayoutCorrigido(sim, payoutDec) {
  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : {};
  const ic =
    sim.internal_costs != null && typeof sim.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (sim.internal_costs)
      : {};
  const res =
    sim.result != null && typeof sim.result === "object"
      ? /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (sim.result) })
      : /** @type {Record<string, unknown>} */ ({});
  const pi =
    sim.pricing_intelligence_extras != null && typeof sim.pricing_intelligence_extras === "object"
      ? /** @type {Record<string, unknown>} */ (sim.pricing_intelligence_extras)
      : {};

  const salePrice = toDec(m.sale_price_brl ?? sim.sale_price_brl);
  const productCost = toDec(ic.product_cost_brl) ?? new Decimal(0);
  const tax = toDec(ic.tax_amount_brl) ?? new Decimal(0);
  const packaging = toDec(ic.operational_packaging_total_brl) ?? new Decimal(0);
  const extrasTotal = toDec(pi.extras_total_brl) ?? new Decimal(0);

  if (salePrice == null || !salePrice.gt(0)) return;

  const profit = payoutDec.minus(productCost).minus(tax).minus(packaging).minus(extrasTotal);
  const marginPct = profit.times(100).div(salePrice);
  const tone = getOfferStatusFromMargin(decStr2(marginPct));

  sim.result = {
    ...res,
    profit_brl: decStr2(profit),
    margin_pct: decStr2(marginPct),
    offer_status_semantic: tone?.level ?? tone?.color ?? res.offer_status_semantic ?? null,
    health_status: tone?.label ?? res.health_status ?? null,
    offer_status_margin_basis: "marketplace_payout_with_fee_discount_brl",
  };
}

/**
 * @param {{
 *   listing_id?: string | null;
 *   promotion_id?: string | null;
 *   promotion_name?: string | null;
 *   selected_marketplace_fee_discount_brl?: string | null;
 *   selected_source_path?: string | null;
 *   has_selected_fee_discount?: boolean;
 * }} payload
 */
export function logPromotionSelectedFeeDiscountSource(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_SELECTED_FEE_DISCOUNT_SOURCE]", payload);
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionFinalScenarioBeforeSetstate(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_FINAL_SCENARIO_BEFORE_SETSTATE]", payload);
}

/**
 * @param {Record<string, unknown>} payload
 */
export function logPromotionFinalScenarioAfterFeeDiscountBinding(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_FINAL_SCENARIO_AFTER_FEE_DISCOUNT_BINDING]", payload);
}

/**
 * @param {{
 *   listing_id?: string | null;
 *   promotion_id?: string | null;
 *   promotion_name?: string | null;
 *   listing_type?: string | null;
 *   card_model?: "classic" | "premium" | null;
 *   binding: Record<string, unknown>;
 * }} payload
 */
export function logPromotionCalcCardFeeDiscountBinding(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMOTION_CALC_CARD_FEE_DISCOUNT_BINDING]", {
    listing_id: payload.listing_id ?? null,
    promotion_id: payload.promotion_id ?? null,
    promotion_name: payload.promotion_name ?? null,
    listing_type: payload.listing_type ?? null,
    card_model: payload.card_model ?? null,
    ...payload.binding,
  });
}

/**
 * Reaplica redução de tarifa no cenário final (idempotente) — sempre após resposta async.
 *
 * @param {Record<string, unknown>} cenarioSim
 * @param {Record<string, unknown>} promocaoFonte
 * @param {{
 *   listingType?: string | null;
 *   listingExternalId?: string | null;
 *   logFinalBinding?: boolean;
 * }} [ctx]
 * @returns {Record<string, unknown>}
 */
export function reidratarReducaoTarifaNoCenarioFinal(cenarioSim, promocaoFonte, ctx = {}) {
  const { ajustes: ajustesSelecionados, sourcePath: selectedSourcePath } =
    resolverAjustesFinanceirosPromocaoComOrigem(promocaoFonte);
  const cardModel =
    ctx.listingType === "premium" || ctx.listingType === "gold_pro"
      ? "premium"
      : ctx.listingType === "classic" || ctx.listingType === "gold_special"
        ? "classic"
        : null;

  const mAntes =
    cenarioSim.marketplace != null && typeof cenarioSim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (cenarioSim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const listingId = String(
    promocaoFonte.listing_id ??
      promocaoFonte.external_listing_id ??
      cenarioSim.listing_id ??
      ctx.listingExternalId ??
      "",
  );
  const promotionId =
    promocaoFonte.promotion_id != null ? String(promocaoFonte.promotion_id) : null;
  const promotionName =
    promocaoFonte.promotion_name != null ? String(promocaoFonte.promotion_name) : null;

  const rawReceive =
    mAntes.marketplace_payout_amount_brl ??
    mAntes.net_receivable_brl ??
    cenarioSim.net_receivable_brl ??
    null;
  const rawFeeDiscount =
    mAntes.fee_discount_brl ?? mAntes.marketplace_fee_discount_amount_brl ?? null;

  const willRehydrate =
    ajustesSelecionados?.has_marketplace_fee_discount === true &&
    toDec(ajustesSelecionados.marketplace_fee_discount_brl)?.gt(0) === true;

  if (ctx.logFinalBinding !== false) {
    logPromotionFinalScenarioBeforeSetstate({
      listing_id: listingId || null,
      promotion_id: promotionId,
      promotion_name: promotionName,
      card_model: cardModel,
      raw_amount_to_receive_brl: rawReceive != null ? String(rawReceive) : null,
      raw_marketplace_fee_discount_brl: rawFeeDiscount != null ? String(rawFeeDiscount) : null,
      selected_marketplace_fee_discount_brl:
        ajustesSelecionados?.marketplace_fee_discount_brl != null
          ? String(ajustesSelecionados.marketplace_fee_discount_brl)
          : null,
      will_rehydrate_fee_discount: willRehydrate,
    });
  }

  aplicarReducaoTarifaPromocaoNoCenarioSimulado(cenarioSim, promocaoFonte, ctx);

  const mDepois =
    cenarioSim.marketplace != null && typeof cenarioSim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (cenarioSim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const priceDec = toDec(cenarioSim.sale_price_brl ?? mDepois.sale_price_brl);
  const grossFeeDec =
    toDec(mDepois.fee_amount_before_promo_subsidy_brl) ??
    toDec(mDepois.promotion_fee_gross_brl) ??
    toDec(mDepois.sale_fee_amount_brl);
  const shipDec = toDec(mDepois.shipping_cost_amount_brl) ?? new Decimal(0);
  const feeDiscountDec = toDec(mDepois.fee_discount_brl ?? mDepois.marketplace_fee_discount_amount_brl);
  const amountBefore =
    priceDec != null && grossFeeDec != null ? priceDec.minus(grossFeeDec).minus(shipDec) : null;
  const amountAfter =
    toDec(mDepois.marketplace_payout_amount_brl ?? mDepois.net_receivable_brl ?? cenarioSim.net_receivable_brl);

  const ajustesFinais =
    cenarioSim.promotion_financial_adjustments != null &&
    typeof cenarioSim.promotion_financial_adjustments === "object"
      ? /** @type {Record<string, unknown>} */ (cenarioSim.promotion_financial_adjustments)
      : null;

  if (ctx.logFinalBinding !== false) {
    logPromotionFinalScenarioAfterFeeDiscountBinding({
      listing_id: listingId || null,
      promotion_id: promotionId,
      promotion_name: promotionName,
      card_model: cardModel,
      buyer_final_price_brl: decStr2(priceDec),
      gross_sale_fee_brl: decStr2(grossFeeDec),
      shipping_cost_brl: decStr2(shipDec),
      marketplace_fee_discount_brl: decStr2(feeDiscountDec),
      amount_to_receive_before_fee_discount_brl: decStr2(amountBefore),
      amount_to_receive_after_fee_discount_brl: decStr2(amountAfter),
      ui_should_render_fee_discount_line:
        feeDiscountDec != null &&
        feeDiscountDec.gt(0) &&
        ajustesFinais?.has_marketplace_fee_discount === true,
      final_source_path_used: selectedSourcePath,
      warnings: willRehydrate && (feeDiscountDec == null || !feeDiscountDec.gt(0)) ? ["fee_discount_binding_failed"] : [],
    });
  }

  return cenarioSim;
}

/**
 * @param {Record<string, unknown>} sim
 * @param {Record<string, unknown>} promo
 * @param {{ listingType?: string | null }} [ctx]
 */
export function aplicarReducaoTarifaPromocaoNoCenarioSimulado(sim, promo, ctx = {}) {
  const { ajustes, sourcePath: selectedSourcePath } = resolverAjustesFinanceirosPromocaoComOrigem(promo);
  /** @type {string[]} */
  const warnings = [];
  let sourcePathUsed = selectedSourcePath ?? "none";

  const mSim =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (sim.marketplace) })
      : /** @type {Record<string, unknown>} */ ({});

  const priceDec =
    toDec(sim.sale_price_brl) ??
    toDec(mSim.sale_price_brl) ??
    toDec(ajustes?.buyer_final_price_brl);
  const grossFeeDec =
    toDec(mSim.fee_amount_before_promo_subsidy_brl) ??
    toDec(mSim.promotion_fee_gross_brl) ??
    toDec(mSim.sale_fee_amount_brl);
  const shipDec = toDec(mSim.shipping_cost_amount_brl) ?? new Decimal(0);

  let feeDiscountDec = ajustes != null ? toDec(ajustes.marketplace_fee_discount_brl) : null;

  const officialReceiveDec =
    toDec(ajustes?.official_amount_to_receive_brl) ??
    toDec(
      promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
        ? /** @type {Record<string, unknown>} */ (promo.promotion_offer_contract).seller_receives_brl
        : null,
    );

  const amountBeforeFeeDiscount =
    priceDec != null && grossFeeDec != null ? priceDec.minus(grossFeeDec).minus(shipDec) : null;

  const payoutAnteriorDec =
    toDec(mSim.payout_after_promo_subsidy_brl) ??
    toDec(mSim.marketplace_payout_amount_brl) ??
    toDec(mSim.net_receivable_brl) ??
    amountBeforeFeeDiscount;

  const resPrev =
    sim.result != null && typeof sim.result === "object"
      ? /** @type {Record<string, unknown>} */ (sim.result)
      : null;
  const profitAnteriorDec = resPrev != null ? toDec(resPrev.profit_brl) : null;

  if (
    feeDiscountDec == null &&
    officialReceiveDec != null &&
    amountBeforeFeeDiscount != null &&
    officialReceiveDec.gt(amountBeforeFeeDiscount)
  ) {
    feeDiscountDec = officialReceiveDec.minus(amountBeforeFeeDiscount).toDecimalPlaces(2, ROUND);
    sourcePathUsed = `${sourcePathUsed}|amount_to_receive_reconciliation`;
  }

  if (feeDiscountDec == null || !feeDiscountDec.gt(0)) {
    logPromotionCalcCardFeeDiscountBinding({
      listing_id: String(promo.listing_id ?? promo.external_listing_id ?? sim.listing_id ?? ""),
      promotion_id: promo.promotion_id != null ? String(promo.promotion_id) : null,
      promotion_name: promo.promotion_name != null ? String(promo.promotion_name) : null,
      listing_type: ctx.listingType ?? null,
      card_model: ctx.listingType === "gold_pro" ? "premium" : ctx.listingType === "gold_special" ? "classic" : null,
      binding: {
        buyer_final_price_brl: decStr2(priceDec),
        gross_sale_fee_brl: decStr2(grossFeeDec),
        shipping_cost_brl: decStr2(shipDec),
        marketplace_fee_discount_brl: "0.00",
        amount_to_receive_before_fee_discount_brl: decStr2(amountBeforeFeeDiscount),
        amount_to_receive_after_fee_discount_brl: decStr2(amountBeforeFeeDiscount),
        ui_should_render_fee_discount_line: false,
        source_path_used: sourcePathUsed,
        warnings: ["no_fee_discount_detected"],
      },
    });
    return;
  }

  feeDiscountDec = feeDiscountDec.toDecimalPlaces(2, ROUND);

  let payoutDec = amountBeforeFeeDiscount != null ? amountBeforeFeeDiscount.plus(feeDiscountDec) : null;
  if (
    officialReceiveDec != null &&
    payoutDec != null &&
    officialReceiveDec.minus(payoutDec).abs().gt(TOLERANCIA_BRL)
  ) {
    warnings.push("official_amount_to_receive_differs_from_formula");
    payoutDec = officialReceiveDec.toDecimalPlaces(2, ROUND);
  }

  const feeDiscountStr = decStr2(feeDiscountDec);
  mSim.fee_discount_brl = feeDiscountStr;
  mSim.promotion_subsidy_amount_brl = feeDiscountStr;
  mSim.marketplace_fee_discount_amount_brl = feeDiscountStr;
  mSim.charged_fee_discount_brl = feeDiscountStr;
  mSim.has_fee_subsidy = true;

  if (grossFeeDec != null) {
    mSim.fee_amount_before_promo_subsidy_brl = decStr2(grossFeeDec);
    mSim.promotion_fee_gross_brl = decStr2(grossFeeDec);
    const netFee = Decimal.max(0, grossFeeDec.minus(feeDiscountDec));
    mSim.fee_amount_after_promo_subsidy_brl = decStr2(netFee);
    mSim.sale_fee_net_display_brl = decStr2(netFee);
    mSim.promotion_fee_net_brl = decStr2(netFee);
  }

  if (payoutDec != null) {
    const payoutStr = decStr2(payoutDec);
    mSim.marketplace_payout_amount_brl = payoutStr;
    mSim.net_receivable_brl = payoutStr;
    mSim.payout_after_promo_subsidy_brl = payoutStr;
    sim.net_receivable_brl = payoutStr;
    sim.marketplace_payout_amount_brl = payoutStr;

    if (payoutAnteriorDec != null && profitAnteriorDec != null) {
      recalcularResultadoPorDeltaPayout(sim, payoutAnteriorDec, payoutDec, profitAnteriorDec);
    } else {
      recalcularResultadoComPayoutCorrigido(sim, payoutDec);
    }
  }

  const ajustesFinais = normalizarAjustesFinanceiros({
    ...(ajustes ?? {}),
    marketplace_fee_discount_brl: feeDiscountStr,
    official_amount_to_receive_brl: decStr2(payoutDec),
  });

  sim.marketplace = mSim;
  sim.promotion_financial_adjustments = ajustesFinais;

  const sxPrev =
    sim.sale_xray_pricing != null && typeof sim.sale_xray_pricing === "object"
      ? /** @type {Record<string, unknown>} */ (sim.sale_xray_pricing)
      : /** @type {Record<string, unknown>} */ ({});
  sim.sale_xray_pricing = {
    ...sxPrev,
    has_fee_subsidy: true,
    show_fee_subsidy_breakdown: true,
    subsidy_ml_brl: feeDiscountStr,
    fee_amount_gross_brl: grossFeeDec != null ? decStr2(grossFeeDec) : sxPrev.fee_amount_gross_brl ?? null,
    fee_amount_net_display_brl:
      grossFeeDec != null
        ? decStr2(Decimal.max(0, grossFeeDec.minus(feeDiscountDec)))
        : sxPrev.fee_amount_net_display_brl ?? null,
  };

  logPromotionCalcCardFeeDiscountBinding({
    listing_id: String(promo.listing_id ?? promo.external_listing_id ?? sim.listing_id ?? ""),
    promotion_id: promo.promotion_id != null ? String(promo.promotion_id) : null,
    promotion_name: promo.promotion_name != null ? String(promo.promotion_name) : null,
    listing_type: ctx.listingType ?? null,
    card_model:
      ctx.listingType === "premium" || ctx.listingType === "gold_pro"
        ? "premium"
        : ctx.listingType === "classic" || ctx.listingType === "gold_special"
          ? "classic"
          : null,
    binding: {
      buyer_final_price_brl: decStr2(priceDec),
      gross_sale_fee_brl: decStr2(grossFeeDec),
      shipping_cost_brl: decStr2(shipDec),
      marketplace_fee_discount_brl: feeDiscountStr,
      amount_to_receive_before_fee_discount_brl: decStr2(amountBeforeFeeDiscount),
      amount_to_receive_after_fee_discount_brl: decStr2(payoutDec),
      ui_should_render_fee_discount_line: true,
      source_path_used: sourcePathUsed,
      warnings,
    },
  });
}
