// ======================================================
// PI — SSOT dos componentes financeiros exibidos no card promocional.
// Unifica preço oficial, configurável e manual no mesmo pipeline Decimal.
// ======================================================

import Decimal from "decimal.js";

import { obterContratoPrecoMiniCardPromocao } from "../../../components/pricing/pricingPromotionCardContract.js";
import { resolverAjustesFinanceirosPromocaoComOrigem } from "./aplicarReducaoTarifaPromocaoNoCenario.js";
import { calcularResultadoPromocionalReconciliado } from "./calcularResultadoPromocionalReconciliado.js";
import { buildFinalPromotionTruthPresentation } from "./promotionFinalTruthPresentationGate.js";

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
export function decStr2Monetario(d) {
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

/** @param {string | null | undefined} raw @returns {Decimal | null} */
function parsePrecoOverride(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  return toDec(
    String(raw)
      .replace(/[^\d,.-]/g, "")
      .replace(",", "."),
  );
}

/**
 * @param {{
 *   scenario: unknown;
 *   selectedPromotion?: unknown;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 * }} params
 */
export function resolverPrecoVendaPromocionalCard({
  scenario,
  selectedPromotion = null,
  promocaoPrecoVendaExibicaoOverride = null,
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : /** @type {Record<string, unknown>} */ ({});

  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  return (
    parsePrecoOverride(promocaoPrecoVendaExibicaoOverride) ??
    toDec(m.sale_price_brl) ??
    toDec(sim.sale_price_brl) ??
    // S4.3.6.17 — sem fallback para real_promotion rejeitado.
    null
  );
}

/**
 * Preço oficial/contratual da promoção (para detectar divergência manual/configurável).
 * @param {unknown} selectedPromotion
 */
export function resolverPrecoOficialPromocaoContrato(selectedPromotion) {
  const gate = buildFinalPromotionTruthPresentation({ scenario: selectedPromotion });
  if (gate.truthStatus !== "CONFIRMED_OFFICIAL" || gate.officialPriceBrl == null) return null;
  return toDec(gate.officialPriceBrl);
}

/** @param {Decimal | null} saleDec @param {Decimal | null} officialSaleDec */
export function precoPromocionalDivergeOficial(saleDec, officialSaleDec) {
  if (saleDec == null || officialSaleDec == null || !saleDec.gt(0) || !officialSaleDec.gt(0)) {
    return false;
  }
  return saleDec.minus(officialSaleDec).abs().gt(TOLERANCIA_BRL);
}

/**
 * “Você recebe” exibido — SSOT: payout simulado do cenário (por listing_type).
 * Sem clamp em official_amount_to_receive quando o preço diverge do oficial.
 *
 * @param {{
 *   scenario: unknown;
 *   selectedPromotion?: unknown;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 * }} params
 */
export function resolverMarketplaceReceivablePromocionalExibido({
  scenario,
  selectedPromotion = null,
  promocaoPrecoVendaExibicaoOverride = null,
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : /** @type {Record<string, unknown>} */ ({});

  const m =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (sim.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const saleDec = resolverPrecoVendaPromocionalCard({
    scenario,
    selectedPromotion,
    promocaoPrecoVendaExibicaoOverride,
  });

  const simPayoutDec =
    pickDec(m, [
      "marketplace_payout_amount_brl",
      "net_receivable_brl",
      "payout_after_promo_subsidy_brl",
    ]) ?? toDec(sim.net_receivable_brl) ?? toDec(sim.marketplace_payout_amount_brl);

  if (
    simPayoutDec != null &&
    saleDec != null &&
    simPayoutDec.gt(0) &&
    simPayoutDec.lte(saleDec.plus(TOLERANCIA_BRL))
  ) {
    return decStr2Monetario(simPayoutDec);
  }

  const grossFeeDec =
    pickDec(m, [
      "fee_amount_before_promo_subsidy_brl",
      "promotion_fee_gross_brl",
      "sale_fee_amount_brl",
      "fee_amount_brl",
    ]) ?? new Decimal(0);

  const shipDec = pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]) ?? new Decimal(0);

  if (saleDec == null || !saleDec.gt(0)) return null;

  const amountBeforeDec = saleDec.minus(grossFeeDec).minus(shipDec);
  const officialSaleDec = resolverPrecoOficialPromocaoContrato(selectedPromotion);
  const divergeOficial = precoPromocionalDivergeOficial(saleDec, officialSaleDec);

  let feeDiscountDec = pickDec(m, [
    "fee_discount_brl",
    "marketplace_fee_discount_amount_brl",
    "marketplace_fee_discount_brl",
  ]);

  if (feeDiscountDec == null || !feeDiscountDec.gt(0)) {
    const { ajustes } = resolverAjustesFinanceirosPromocaoComOrigem(
      selectedPromotion != null && typeof selectedPromotion === "object"
        ? /** @type {Record<string, unknown>} */ (selectedPromotion)
        : {},
    );
    if (!divergeOficial && ajustes != null) {
      feeDiscountDec = toDec(ajustes.marketplace_fee_discount_brl);
    }
  }

  let amountReceiveDec = amountBeforeDec;
  if (feeDiscountDec != null && feeDiscountDec.gt(0)) {
    amountReceiveDec = amountBeforeDec.plus(feeDiscountDec);
  }

  if (!divergeOficial) {
    const promo =
      selectedPromotion != null && typeof selectedPromotion === "object"
        ? /** @type {Record<string, unknown>} */ (selectedPromotion)
        : {};
    const { ajustes } = resolverAjustesFinanceirosPromocaoComOrigem(promo);
    const cardPreco = obterContratoPrecoMiniCardPromocao(promo);
    const officialReceiveDec =
      toDec(ajustes?.official_amount_to_receive_brl) ??
      toDec(cardPreco?.seller_receives_brl);

    if (
      officialReceiveDec != null &&
      amountReceiveDec != null &&
      feeDiscountDec != null &&
      feeDiscountDec.gt(0) &&
      officialReceiveDec.minus(amountReceiveDec).abs().gt(TOLERANCIA_BRL)
    ) {
      amountReceiveDec = officialReceiveDec.toDecimalPlaces(2, ROUND);
    }
  }

  return decStr2Monetario(amountReceiveDec);
}

/**
 * Pipeline unificado: componentes + resultado reconciliado por cenário.
 *
 * @param {{
 *   scenario: unknown;
 *   selectedPromotion?: unknown;
 *   listingType?: string | null;
 *   promocaoPrecoVendaExibicaoOverride?: string | null;
 * }} params
 */
export function montarResultadoPromocionalCardReconciliado({
  scenario,
  selectedPromotion = null,
  listingType = null,
  promocaoPrecoVendaExibicaoOverride = null,
}) {
  const sim =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : null;
  if (sim == null) return null;

  const saleDec = resolverPrecoVendaPromocionalCard({
    scenario,
    selectedPromotion,
    promocaoPrecoVendaExibicaoOverride,
  });
  const salePriceBrl = decStr2Monetario(saleDec);
  const marketplaceReceivableBrl = resolverMarketplaceReceivablePromocionalExibido({
    scenario,
    selectedPromotion,
    promocaoPrecoVendaExibicaoOverride,
  });

  const ic =
    sim.internal_costs != null && typeof sim.internal_costs === "object"
      ? /** @type {Record<string, unknown>} */ (sim.internal_costs)
      : {};
  const pi =
    sim.pricing_intelligence_extras != null && typeof sim.pricing_intelligence_extras === "object"
      ? /** @type {Record<string, unknown>} */ (sim.pricing_intelligence_extras)
      : {};

  const resultado = calcularResultadoPromocionalReconciliado({
    scenario: sim,
    marketplaceReceivableBrl,
    salePriceBrl,
  });

  return {
    listing_type: listingType,
    sale_price_brl: salePriceBrl,
    marketplace_receivable_brl: marketplaceReceivableBrl,
    product_cost_brl: decStr2Monetario(toDec(ic.product_cost_brl)),
    tax_brl: decStr2Monetario(toDec(ic.tax_amount_brl)),
    operational_packaging_brl: decStr2Monetario(toDec(ic.operational_packaging_total_brl)),
    extras_total_brl: decStr2Monetario(toDec(pi.extras_total_brl) ?? new Decimal(0)),
    profit_brl: resultado?.profit_brl ?? null,
    margin_pct: resultado?.margin_pct ?? null,
    offer_status_semantic: resultado?.offer_status_semantic ?? null,
    health_status: resultado?.health_status ?? null,
  };
}

/**
 * Invariante: lucro exibido fecha com os componentes visíveis do card.
 *
 * @param {{
 *   marketplaceReceivableBrl: string | null | undefined;
 *   productCostBrl: string | null | undefined;
 *   taxBrl: string | null | undefined;
 *   operationalPackagingBrl: string | null | undefined;
 *   extrasTotalBrl?: string | null | undefined;
 *   profitBrl: string | null | undefined;
 * }} card
 * @returns {{ ok: boolean; expectedProfitBrl?: string; deltaBrl?: string }}
 */
export function assertPromotionCardReconciles(card) {
  const payout = toDec(card.marketplaceReceivableBrl);
  const product = toDec(card.productCostBrl) ?? new Decimal(0);
  const tax = toDec(card.taxBrl) ?? new Decimal(0);
  const packaging = toDec(card.operationalPackagingBrl) ?? new Decimal(0);
  const extras = toDec(card.extrasTotalBrl) ?? new Decimal(0);
  const profit = toDec(card.profitBrl);

  if (payout == null || profit == null) {
    return { ok: false };
  }

  const expected = payout.minus(product).minus(tax).minus(packaging).minus(extras);
  const expectedStr = decStr2Monetario(expected);
  const delta = profit.minus(expected).abs();

  return {
    ok: expectedStr === decStr2Monetario(profit) && delta.lte(TOLERANCIA_BRL),
    expectedProfitBrl: expectedStr ?? undefined,
    deltaBrl: decStr2Monetario(delta) ?? undefined,
  };
}
