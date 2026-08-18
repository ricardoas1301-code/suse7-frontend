// ======================================================
// S4.3.6.17 — Fronteira final fail-closed da apresentação/simulação promocional.
// Após resolvePromotionPriceTruthFailClosed, nenhum candidato rejeitado sobrevive.
// ======================================================

import { resolvePromotionPriceTruthFailClosed } from "./promotionPriceTruthFailClosed.js";
import { isValidDecimalMoneyString } from "./promotionManualSimulationPrice.js";
import { buildPromotionIdentityKeyParts } from "./promotionIdentityKey.js";

/**
 * @typedef {"CONFIRMED" | "EMPTY" | "MANUAL"} PromotionFinalDisplayState
 */

/**
 * @typedef {{
 *   finalPromotionTruth: import("./promotionPriceTruthFailClosed.js").PromotionPriceTruthResolution;
 *   truthStatus: "CONFIRMED_OFFICIAL" | "UNCONFIRMED_EMPTY";
 *   officialPriceBrl: string | null;
 *   officialDiscountPercentage: string | null;
 *   officialDiscountAmountBrl: string | null;
 *   canAutoSimulate: boolean;
 *   displayState: PromotionFinalDisplayState;
 *   salePriceForFinance: string | null;
 *   miniCardPriceBrl: string | null;
 *   candidatePrice: string | null;
 *   candidateProvenance: string | null;
 *   rejectionReasons: string[];
 *   promotionIdentityKey: string;
 *   manualPriceRecordPresent: boolean;
 *   resolverName: string;
 * }} FinalPromotionTruthPresentation
 */

/** @param {unknown} scenario */
function extrairCard(scenario) {
  const r =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : {};
  return r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
    ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
    : null;
}

/** @param {unknown} scenario */
function extrairOfferCapability(scenario) {
  const card = extrairCard(scenario);
  const cap =
    card?.promotion_offer_capability ??
    (card?.promotion_display_price_truth != null &&
    typeof card.promotion_display_price_truth === "object"
      ? /** @type {Record<string, unknown>} */ (card.promotion_display_price_truth)
          .promotion_offer_capability
      : null);
  return cap != null && typeof cap === "object"
    ? /** @type {Record<string, unknown>} */ (cap)
    : null;
}

/**
 * Candidato residual apenas para auditoria — nunca entra no DTO oficial.
 * @param {unknown} scenario
 */
export function extrairCandidatoPrecoRejeitadoParaAuditoria(scenario) {
  const card = extrairCard(scenario);
  const cap = extrairOfferCapability(scenario);
  const candidatos = [
    { value: cap?.suggested_initial_price_brl, provenance: "suggested_initial_price_brl" },
    { value: cap?.api_reference_price_brl, provenance: "api_reference_price_brl" },
    { value: card?.official_promotion_display_price_brl, provenance: "official_promotion_display_price_brl" },
    { value: card?.real_promotion_final_price_brl, provenance: "real_promotion_final_price_brl" },
    { value: card?.selected_final_price, provenance: "selected_final_price" },
  ];
  for (const c of candidatos) {
    if (c.value != null && isValidDecimalMoneyString(String(c.value))) {
      return { priceBrl: String(c.value), provenance: c.provenance };
    }
  }
  return { priceBrl: null, provenance: null };
}

/**
 * Fronteira final única: status manda; candidato rejeitado não sobrevive.
 * @param {{
 *   scenario?: unknown;
 *   manualPriceRecord?: import("./promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null;
 *   listingExternalId?: string | null;
 *   accountId?: string | null;
 *   variationId?: string | null;
 * }} context
 * @returns {FinalPromotionTruthPresentation}
 */
export function buildFinalPromotionTruthPresentation(context = {}) {
  const {
    scenario = null,
    manualPriceRecord = null,
    listingExternalId = null,
    accountId = null,
    variationId = null,
  } = context;

  const finalPromotionTruth = resolvePromotionPriceTruthFailClosed({
    scenario,
    listingExternalId,
    accountId,
    variationId,
  });

  const candidate = extrairCandidatoPrecoRejeitadoParaAuditoria(scenario);
  const identity =
    finalPromotionTruth.promotionIdentityKey ||
    buildPromotionIdentityKeyParts({
      scenario,
      listingExternalId,
      accountId,
      variationId,
    }).identityKey;

  const manualValid =
    manualPriceRecord?.source === "USER_PROVIDED_SIMULATION_PRICE" &&
    isValidDecimalMoneyString(manualPriceRecord.priceBrl);

  if (
    finalPromotionTruth.status === "CONFIRMED_OFFICIAL" &&
    isValidDecimalMoneyString(finalPromotionTruth.priceBrl)
  ) {
    return {
      finalPromotionTruth,
      truthStatus: "CONFIRMED_OFFICIAL",
      officialPriceBrl: finalPromotionTruth.priceBrl,
      officialDiscountPercentage: finalPromotionTruth.discountPercentage,
      officialDiscountAmountBrl: finalPromotionTruth.discountAmountBrl,
      canAutoSimulate: true,
      displayState: "CONFIRMED",
      salePriceForFinance: finalPromotionTruth.priceBrl,
      miniCardPriceBrl: finalPromotionTruth.priceBrl,
      candidatePrice: candidate.priceBrl,
      candidateProvenance: candidate.provenance,
      rejectionReasons: [],
      promotionIdentityKey: identity,
      manualPriceRecordPresent: false,
      resolverName: finalPromotionTruth.resolverName,
    };
  }

  // UNCONFIRMED_EMPTY — precedência absoluta do status. Proibido truth.price || raw.
  if (manualValid) {
    return {
      finalPromotionTruth,
      truthStatus: "UNCONFIRMED_EMPTY",
      officialPriceBrl: null,
      officialDiscountPercentage: null,
      officialDiscountAmountBrl: null,
      canAutoSimulate: true,
      displayState: "MANUAL",
      salePriceForFinance: String(manualPriceRecord.priceBrl),
      miniCardPriceBrl: String(manualPriceRecord.priceBrl),
      candidatePrice: candidate.priceBrl,
      candidateProvenance: candidate.provenance,
      rejectionReasons: finalPromotionTruth.rejectionReasons ?? [],
      promotionIdentityKey: identity,
      manualPriceRecordPresent: true,
      resolverName: finalPromotionTruth.resolverName,
    };
  }

  return {
    finalPromotionTruth,
    truthStatus: "UNCONFIRMED_EMPTY",
    officialPriceBrl: null,
    officialDiscountPercentage: null,
    officialDiscountAmountBrl: null,
    canAutoSimulate: false,
    displayState: "EMPTY",
    salePriceForFinance: null,
    miniCardPriceBrl: null,
    candidatePrice: candidate.priceBrl,
    candidateProvenance: candidate.provenance,
    rejectionReasons: finalPromotionTruth.rejectionReasons ?? [],
    promotionIdentityKey: identity,
    manualPriceRecordPresent: false,
    resolverName: finalPromotionTruth.resolverName,
  };
}

/**
 * Auditoria runtime estruturada (sem tokens / sem payload sensível completo).
 * @param {{
 *   listingId?: string | null;
 *   scenario?: unknown;
 *   manualPriceRecord?: import("./promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null;
 *   accountId?: string | null;
 *   miniCardDeliveredPriceBrl?: string | null;
 *   classicPremiumSalePriceBrl?: string | null;
 * }} params
 */
export function buildPromotionFailClosedRuntimeAudit(params = {}) {
  const gate = buildFinalPromotionTruthPresentation({
    scenario: params.scenario,
    manualPriceRecord: params.manualPriceRecord ?? null,
    listingExternalId: params.listingId ?? null,
    accountId: params.accountId ?? null,
  });

  return {
    listingId: params.listingId ?? null,
    promotionIdentityKey: gate.promotionIdentityKey,
    resolver: gate.resolverName,
    truthStatus: gate.truthStatus,
    candidatePrice: gate.candidatePrice,
    candidateProvenance: gate.candidateProvenance,
    rejectionReasons: gate.rejectionReasons,
    finalOfficialPrice: gate.officialPriceBrl,
    manualPriceRecordPresent: gate.manualPriceRecordPresent,
    canAutoSimulate: gate.canAutoSimulate,
    displayState: gate.displayState,
    miniCardDeliveredPriceBrl: params.miniCardDeliveredPriceBrl ?? gate.miniCardPriceBrl,
    classicPremiumSalePriceBrl: params.classicPremiumSalePriceBrl ?? gate.salePriceForFinance,
  };
}

/**
 * @param {FinalPromotionTruthPresentation} audit
 */
export function logPromotionFailClosedRuntimeEnforcement(audit) {
  if (typeof console === "undefined" || typeof console.info !== "function") return;
  console.info("[S7_PROMOTION_FAIL_CLOSED_RUNTIME_ENFORCEMENT_S4_3_6_17]", audit);
}
