// ======================================================
// PI — Promoções Beta: policy de apresentação (não substitui PromotionDisplayPriceTruth).
// CONFIRMED = contrato seguro utilizável; UNCONFIRMED_* = simulação manual opcional.
// ======================================================

import Decimal from "decimal.js";

import { resolvePromotionPriceTruthFailClosed } from "./promotionPriceTruthFailClosed.js";
import { isValidDecimalMoneyString } from "./promotionManualSimulationPrice.js";

/** @typedef {"CONFIRMED" | "UNCONFIRMED_EMPTY" | "UNCONFIRMED_MANUAL_READY"} PromotionBetaPricePresentationState */

/**
 * @typedef {{
 *   identityKey: string;
 *   priceBrl: string;
 *   source: "USER_PROVIDED_SIMULATION_PRICE";
 *   createdAt: string;
 *   identity?: Record<string, unknown>;
 * }} ManualPromotionSimulationPriceRecord
 */

export const PROMOTION_BETA_TAB_HELPER =
  "Promoções, status e vigências são sincronizados. Preços e simulações são exibidos somente quando confirmados.";

export const PROMOTION_BETA_BANNER_ARIA = "Aviso Beta Promoções";

export const PROMOTION_BETA_MINI_CARD_PRICE_LABEL = "Preço final não confirmado";

export const PROMOTION_BETA_MINI_CARD_HELPER_COMPACT =
  "A API retornou uma condição promocional, mas o preço final não pôde ser confirmado.";

export const PROMOTION_BETA_MINI_CARD_HELPER_EXPANDED =
  "A API retornou uma condição promocional, mas o preço final não pôde ser confirmado. Informe o valor para simular.";

export const PROMOTION_BETA_CONFIGURABLE_INITIAL_PRICE_LABEL = "Valor inicial";

export const PROMOTION_BETA_CONFIGURABLE_EDITABLE_HINT = "Editável";

export const PROMOTION_BETA_LIGHTNING_CONFIG_HELPER = "Informe os dados para simular";

export const PROMOTION_BETA_MANUAL_BADGE = "Informado por você";

export const PROMOTION_BETA_VIGENCIA_AUSENTE = "Vigência não informada";

export const PROMOTION_BETA_CENTRAL_TITLE = "Simule com o preço da promoção";

export const PROMOTION_BETA_CENTRAL_MESSAGE =
  "Consulte o preço final no Mercado Livre e informe-o no card da promoção para analisar lucro e margem.";

/** @deprecated S4.3.6.15 — substituído por rodapé interno do card promocional */
export const PROMOTION_BETA_CENTRAL_MANUAL_INDICATOR = "Preço informado por você";

export const PROMOTION_CARD_MANUAL_SALE_PRICE_FOOTER = "Valor de venda informado por você";

/**
 * Rodapé de proveniência manual — somente após registro canônico USER_PROVIDED_SIMULATION_PRICE.
 * @param {ManualPromotionSimulationPriceRecord | null | undefined} manualPriceRecord
 */
export function promocaoExibeRodapePrecoManualInformado(manualPriceRecord = null) {
  return (
    manualPriceRecord?.source === "USER_PROVIDED_SIMULATION_PRICE" &&
    isValidDecimalMoneyString(manualPriceRecord.priceBrl)
  );
}

/** @deprecated Use PROMOTION_BETA_BANNER_ARIA — título visual removido no compacto S4.3.6 */
export const PROMOTION_BETA_BANNER_TITLE = PROMOTION_BETA_BANNER_ARIA;

/** @deprecated Use PROMOTION_BETA_MINI_CARD_PRICE_LABEL */
export const PROMOTION_BETA_PRICE_BADGE = "Preço não confirmado";

/** @deprecated Use PROMOTION_BETA_MINI_CARD_HELPER_COMPACT */
export const PROMOTION_BETA_MINI_CARD_HELPER =
  "A promoção foi identificada, mas o preço final ainda não pôde ser validado com segurança pela integração.";

/**
 * Policy Beta local e determinística — deriva do contrato fail-closed S4.3.6.16.
 * @param {unknown} scenario
 * @returns {{
 *   promotion_beta_price_state: "CONFIRMED" | "UNCONFIRMED";
 *   isConfirmed: boolean;
 *   isUnconfirmed: boolean;
 *   finalPriceBrl: string | null;
 * }}
 */
export function resolverEstadoBetaPrecoPromocao(scenario = null) {
  const failClosed = resolvePromotionPriceTruthFailClosed({ scenario });
  const confirmed =
    failClosed.status === "CONFIRMED_OFFICIAL" && isValidDecimalMoneyString(failClosed.priceBrl);

  if (confirmed) {
    return {
      promotion_beta_price_state: "CONFIRMED",
      isConfirmed: true,
      isUnconfirmed: false,
      finalPriceBrl: failClosed.priceBrl,
    };
  }

  return {
    promotion_beta_price_state: "UNCONFIRMED",
    isConfirmed: false,
    isUnconfirmed: true,
    finalPriceBrl: null,
  };
}

/** @param {unknown} scenario */
export function promocaoBetaParticipacaoPermitida(scenario) {
  if (!promocaoBetaPrecoConfirmado(scenario)) return false;
  const cap = extrairOfferCapability(scenario);
  if (
    cap?.offer_capability === "CONFIGURABLE_DISCOUNT_OFFER" ||
    cap?.offer_capability === "CONFIGURABLE_STOCK_AND_DISCOUNT_OFFER" ||
    cap?.offer_capability === "PUBLIC_API_CANDIDATE_TIER"
  ) {
    return false;
  }
  return true;
}

/**
 * Estado de apresentação Beta incluindo simulação manual local.
 * @param {unknown} scenario
 * @param {ManualPromotionSimulationPriceRecord | null | undefined} manualPriceRecord
 */
export function resolverEstadoBetaPrecoApresentacao(scenario = null, manualPriceRecord = null) {
  const base = resolverEstadoBetaPrecoPromocao(scenario);

  if (base.isConfirmed) {
    return {
      ...base,
      promotion_beta_price_state: /** @type {const} */ ("CONFIRMED"),
      manualPriceBrl: null,
      isManualSimulation: false,
      permiteSimulacao: true,
      aguardandoPrecoManual: false,
    };
  }

  const manualValid =
    manualPriceRecord?.source === "USER_PROVIDED_SIMULATION_PRICE" &&
    isValidDecimalMoneyString(manualPriceRecord.priceBrl);

  if (manualValid) {
    return {
      promotion_beta_price_state: /** @type {const} */ ("UNCONFIRMED_MANUAL_READY"),
      isConfirmed: false,
      isUnconfirmed: true,
      finalPriceBrl: null,
      manualPriceBrl: manualPriceRecord.priceBrl,
      isManualSimulation: true,
      permiteSimulacao: true,
      aguardandoPrecoManual: false,
    };
  }

  return {
    promotion_beta_price_state: /** @type {const} */ ("UNCONFIRMED_EMPTY"),
    isConfirmed: false,
    isUnconfirmed: true,
    finalPriceBrl: null,
    manualPriceBrl: null,
    isManualSimulation: false,
    permiteSimulacao: false,
    aguardandoPrecoManual: true,
  };
}

/** @param {unknown} scenario */
export function promocaoBetaPrecoConfirmado(scenario) {
  return resolverEstadoBetaPrecoPromocao(scenario).isConfirmed === true;
}

/** @param {unknown} scenario */
export function promocaoBetaPermiteSimulacao(scenario) {
  return promocaoBetaPrecoConfirmado(scenario);
}

/**
 * Simulação efetiva: preço oficial confirmado ou manual válido na sessão.
 * S4.3.6.17 — suggested_initial / configurável NÃO libera auto-simulação.
 * @param {unknown} scenario
 * @param {ManualPromotionSimulationPriceRecord | null | undefined} manualPriceRecord
 */
export function promocaoBetaPermiteSimulacaoEfetiva(scenario, manualPriceRecord = null) {
  if (promocaoBetaPrecoConfirmado(scenario)) return true;
  if (
    manualPriceRecord?.source === "USER_PROVIDED_SIMULATION_PRICE" &&
    isValidDecimalMoneyString(manualPriceRecord.priceBrl)
  ) {
    return true;
  }
  // S4.3.6.17 — fail-closed: candidato configurável rejeitado não alimenta Classic/Premium.
  return false;
}

/** @param {unknown} scenario */
function extrairOfferCapability(scenario) {
  const r =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : {};
  const card =
    r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
      : null;
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

/** @param {unknown} scenario */
export function resolverRotuloPrecoBetaPromocao(scenario) {
  const cap = extrairOfferCapability(scenario);
  if (cap?.offer_capability === "CONFIGURABLE_DISCOUNT_OFFER") {
    return PROMOTION_BETA_CONFIGURABLE_INITIAL_PRICE_LABEL;
  }
  if (cap?.offer_capability === "CONFIGURABLE_STOCK_AND_DISCOUNT_OFFER") {
    return PROMOTION_BETA_LIGHTNING_CONFIG_HELPER;
  }
  return PROMOTION_BETA_MINI_CARD_PRICE_LABEL;
}

/** @param {unknown} scenario @param {boolean} [isSelected] */
export function resolverHelperPrecoBetaPromocao(scenario, isSelected = false) {
  const cap = extrairOfferCapability(scenario);
  if (cap?.offer_capability === "CONFIGURABLE_STOCK_AND_DISCOUNT_OFFER") {
    return isSelected ? PROMOTION_BETA_MINI_CARD_HELPER_EXPANDED : PROMOTION_BETA_LIGHTNING_CONFIG_HELPER;
  }
  return isSelected ? PROMOTION_BETA_MINI_CARD_HELPER_EXPANDED : PROMOTION_BETA_MINI_CARD_HELPER_COMPACT;
}

/** @param {unknown} scenario */
export function resolverValorInicialConfiguravelBeta(scenario) {
  const cap = extrairOfferCapability(scenario);
  const brl = cap?.suggested_initial_price_brl ?? cap?.api_reference_price_brl ?? null;
  if (brl == null || String(brl).trim() === "") return null;
  return isValidDecimalMoneyString(String(brl)) ? String(brl) : null;
}

/** @param {unknown} scenario */
export function resolverDescontoConfiguravelInicialBeta(scenario) {
  const cap = extrairOfferCapability(scenario);
  if (cap?.offer_capability !== "CONFIGURABLE_DISCOUNT_OFFER") return null;
  const initialBrl = cap?.suggested_initial_price_brl ?? null;
  if (!isValidDecimalMoneyString(String(initialBrl ?? ""))) return null;

  const r =
    scenario != null && typeof scenario === "object"
      ? /** @type {Record<string, unknown>} */ (scenario)
      : {};
  const card =
    r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
      : null;
  const originalRaw = card?.original_price_brl ?? null;
  if (originalRaw == null) return null;

  try {
    const original = new Decimal(String(originalRaw).replace(",", "."));
    const initial = new Decimal(String(initialBrl).replace(",", "."));
    if (!original.gt(initial)) return null;
    const amount = original.minus(initial).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const percent = amount.div(original).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const displayInt = Math.round(percent.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber());
    return {
      amountBrl: amount.toFixed(2),
      percentDisplay: String(displayInt),
    };
  } catch {
    return null;
  }
}

/** @param {unknown} scenario */
export function promocaoBetaOfertaConfiguravel(scenario) {
  const cap = extrairOfferCapability(scenario);
  return (
    cap?.offer_capability === "CONFIGURABLE_DISCOUNT_OFFER" ||
    cap?.offer_capability === "CONFIGURABLE_STOCK_AND_DISCOUNT_OFFER"
  );
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidDecimalMoney(value) {
  if (value == null || String(value).trim() === "") return false;
  try {
    const d = new Decimal(String(value).trim().replace(",", "."));
    return d.isFinite() && d.gt(0);
  } catch {
    return false;
  }
}
