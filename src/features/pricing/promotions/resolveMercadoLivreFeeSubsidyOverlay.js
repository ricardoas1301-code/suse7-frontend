// ======================================================
// PI — Overlay isolado do subsídio de tarifa do Mercado Livre ("Reduzimos sua tarifa").
//
// Camada FINA e isolada. NÃO altera tarifa base, envio, listing_type_id, comissão,
// nem recalcula o contrato inteiro. Só devolve o subsídio quando vem de fonte confiável
// e informa se pode ser aplicado no card (isolamento Clássico/Premium).
//
// Decimal.js — proibido float/parseFloat em cálculo financeiro.
// ======================================================

import Decimal from "decimal.js";

import { resolverAjustesFinanceirosPromocaoComOrigem } from "./aplicarReducaoTarifaPromocaoNoCenario.js";

const ROUND = Decimal.ROUND_HALF_UP;
const TOLERANCIA_BRL = new Decimal("0.02");

/** @param {unknown} v @returns {Decimal | null} */
export function toDecOverlay(v) {
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
export function decStr2Overlay(d) {
  if (d == null || !d.isFinite()) return null;
  return d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {Record<string, unknown> | null | undefined} obj */
function rec(obj) {
  return obj != null && typeof obj === "object" ? /** @type {Record<string, unknown>} */ (obj) : {};
}

/** @param {string | null | undefined} listingTypeId @returns {string | null} */
function normalizeListingTypeId(listingTypeId) {
  const s = listingTypeId != null ? String(listingTypeId).trim().toLowerCase() : "";
  if (s === "") return null;
  if (s.includes("gold_pro") || s === "premium") return "gold_pro";
  if (s.includes("gold_special") || s === "classic" || s === "classico") return "gold_special";
  return s;
}

/** @param {Record<string, unknown>} m @param {string[]} keys @returns {Decimal | null} */
function pickDec(m, keys) {
  for (const key of keys) {
    const d = toDecOverlay(m[key]);
    if (d != null && d.gte(0)) return d;
  }
  return null;
}

/**
 * Resolve o subsídio de tarifa do ML como overlay isolado.
 *
 * @param {{
 *   selectedPromotion?: unknown;
 *   cardScenario?: unknown;
 *   officialPromotionRow?: unknown;
 *   listingTypeId?: string | null;
 *   currentListingTypeId?: string | null;
 * }} params
 * @returns {{ has_subsidy: boolean; subsidy_brl: Decimal | null; source: string; can_apply_to_card: boolean }}
 */
export function resolveMercadoLivreFeeSubsidyOverlay({
  selectedPromotion = null,
  cardScenario = null,
  officialPromotionRow = null,
  listingTypeId = null,
  currentListingTypeId = null,
}) {
  const cardType = normalizeListingTypeId(listingTypeId);
  const currentType = normalizeListingTypeId(currentListingTypeId);
  const isCurrentListingCard = cardType != null && currentType != null && cardType === currentType;

  const cardM = rec(rec(cardScenario).marketplace);

  // 1) Fonte explícita no cenário do PRÓPRIO card (dado isolado daquele listing_type).
  const cardExplicit = pickDec(cardM, [
    "marketplace_fee_discount_brl",
    "marketplace_fee_discount_amount_brl",
    "fee_discount_brl",
    "promotion_subsidy_amount_brl",
    "charged_fee_discount_brl",
  ]);
  if (cardExplicit != null && cardExplicit.gt(0)) {
    return {
      has_subsidy: true,
      subsidy_brl: cardExplicit.toDecimalPlaces(2, ROUND),
      source: "card_scenario_explicit_fee_discount",
      can_apply_to_card: true,
    };
  }

  // 2) Diferença determinística tarifa cheia − tarifa reduzida DO MESMO cenário do card.
  const grossFee = pickDec(cardM, [
    "fee_amount_before_promo_subsidy_brl",
    "promotion_fee_gross_brl",
    "sale_fee_amount_brl",
    "fee_amount_brl",
  ]);
  const netFee = pickDec(cardM, [
    "sale_fee_net_display_brl",
    "promotion_fee_net_brl",
    "fee_amount_after_promo_subsidy_brl",
  ]);
  if (grossFee != null && netFee != null && grossFee.minus(netFee).gt(TOLERANCIA_BRL)) {
    return {
      has_subsidy: true,
      subsidy_brl: grossFee.minus(netFee).toDecimalPlaces(2, ROUND),
      source: "card_scenario_gross_net_diff",
      can_apply_to_card: true,
    };
  }

  // 3) Campo oficial do payload da promoção — só aplica no card do listing_type atual publicado.
  const promoFonte =
    officialPromotionRow != null && typeof officialPromotionRow === "object"
      ? officialPromotionRow
      : selectedPromotion;
  if (promoFonte != null && typeof promoFonte === "object") {
    const { ajustes, sourcePath } = resolverAjustesFinanceirosPromocaoComOrigem(
      /** @type {Record<string, unknown>} */ (promoFonte),
    );
    const officialSubsidy = ajustes != null ? toDecOverlay(ajustes.marketplace_fee_discount_brl) : null;
    if (officialSubsidy != null && officialSubsidy.gt(0)) {
      return {
        has_subsidy: true,
        subsidy_brl: officialSubsidy.toDecimalPlaces(2, ROUND),
        source: sourcePath ?? "official_promotion_row",
        can_apply_to_card: isCurrentListingCard,
      };
    }
  }

  return { has_subsidy: false, subsidy_brl: null, source: "no_trusted_subsidy", can_apply_to_card: false };
}

/**
 * Financeiro do card da promoção (base isolada + overlay), puro e testável.
 * NÃO recalcula contrato: lê o cenário oficial do próprio listing_type e aplica overlay.
 *
 * Regra "Você recebe":
 *  - SSOT oficial (official_amount_to_receive_brl do tipo atual, ou payout da simulação do tipo) tem prioridade;
 *  - fallback: com subsídio aplicável → (preço − tarifa cheia − envio) + subsídio;
 *              sem subsídio → preço − tarifa líquida − envio.
 *
 * @param {{
 *   scenario?: unknown;
 *   salePriceOverrideBrl?: string | null;
 *   officialAmountToReceiveBrl?: string | null;
 *   officialPromotionRow?: unknown;
 *   listingTypeId?: string | null;
 *   currentListingTypeId?: string | null;
 * }} params
 */
export function resolvePromotionCardFinancials({
  scenario = null,
  salePriceOverrideBrl = null,
  officialAmountToReceiveBrl = null,
  officialPromotionRow = null,
  listingTypeId = null,
  currentListingTypeId = null,
}) {
  const m = rec(rec(scenario).marketplace);

  const saleOverrideDec =
    salePriceOverrideBrl != null && String(salePriceOverrideBrl).trim() !== ""
      ? toDecOverlay(String(salePriceOverrideBrl))
      : null;
  const saleDec = saleOverrideDec ?? pickDec(m, ["sale_price_brl"]);
  const grossFeeDec = pickDec(m, [
    "fee_amount_before_promo_subsidy_brl",
    "promotion_fee_gross_brl",
    "sale_fee_amount_brl",
    "fee_amount_brl",
  ]);
  const netFeeDec =
    pickDec(m, ["sale_fee_net_display_brl", "promotion_fee_net_brl", "fee_amount_after_promo_subsidy_brl"]) ??
    grossFeeDec;
  const shipDec = pickDec(m, ["shipping_cost_amount_brl", "shipping_cost_brl"]);
  const scenarioPayoutDec = pickDec(m, ["marketplace_payout_amount_brl", "net_receivable_brl"]);
  const commissionPercent = m.sale_fee_percent ?? m.commission_percent ?? null;

  const officialReceiveDec = toDecOverlay(officialAmountToReceiveBrl) ?? scenarioPayoutDec;

  const overlay = resolveMercadoLivreFeeSubsidyOverlay({
    selectedPromotion: officialPromotionRow,
    cardScenario: scenario,
    officialPromotionRow,
    listingTypeId,
    currentListingTypeId,
  });
  const subsidyApplied = overlay.has_subsidy === true && overlay.can_apply_to_card === true;

  let receiveDec = officialReceiveDec;
  let receiveSource =
    officialReceiveDec != null
      ? toDecOverlay(officialAmountToReceiveBrl) != null
        ? "official_amount_to_receive_brl"
        : "listing_type_official_simulation_payout"
      : null;
  if (receiveDec == null && saleDec != null && netFeeDec != null && shipDec != null) {
    if (subsidyApplied && grossFeeDec != null && overlay.subsidy_brl != null) {
      receiveDec = saleDec.minus(grossFeeDec).minus(shipDec).plus(overlay.subsidy_brl);
      receiveSource = "computed_base_plus_subsidy";
    } else {
      receiveDec = saleDec.minus(netFeeDec).minus(shipDec);
      receiveSource = "computed_final_minus_net_fee_minus_shipping";
    }
  }
  if (receiveDec != null) receiveDec = receiveDec.toDecimalPlaces(2, ROUND);

  return {
    sale_brl: decStr2Overlay(saleDec),
    gross_fee_brl: decStr2Overlay(grossFeeDec),
    net_fee_brl: decStr2Overlay(netFeeDec),
    shipping_brl: decStr2Overlay(shipDec),
    commission_percent: commissionPercent != null ? String(commissionPercent) : null,
    receive_brl: decStr2Overlay(receiveDec),
    receive_source: receiveSource,
    subsidy_applied: subsidyApplied,
    subsidy_brl: subsidyApplied && overlay.subsidy_brl != null ? decStr2Overlay(overlay.subsidy_brl) : "0.00",
    subsidy_source: overlay.source,
    has_core: saleDec != null && netFeeDec != null && receiveDec != null,
    // Decimais para o render (evita re-parse no componente).
    _dec: { saleDec, grossFeeDec, netFeeDec, shipDec, receiveDec, subsidyDec: subsidyApplied ? overlay.subsidy_brl : null },
  };
}

/** @param {Record<string, unknown>} payload */
export function logPromoFeeSubsidyOverlay(payload) {
  if (typeof import.meta !== "undefined" && import.meta.env?.PROD) return;
  console.info("[S7_PROMO_FEE_SUBSIDY_OVERLAY]", payload);
}
