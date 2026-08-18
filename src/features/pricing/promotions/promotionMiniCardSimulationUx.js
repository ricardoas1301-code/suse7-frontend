// ======================================================
// S4.3.6.5 — Simulação inline mini card (Decimal, somente UX/sessão).
// Não altera PromotionDisplayPriceTruth nem resolvers oficiais.
// ======================================================

import Decimal from "decimal.js";

import { formatarPrecoRealExibicao } from "../../../components/pricing/precoInicialAnuncioPrecificacao.js";
import { resolverPrecoOriginalPromocaoMonetario } from "../../../components/pricing/pricingPromotionCardContract.js";
import {
  formatarDecimalBrlExibicao,
  isValidDecimalMoneyString,
} from "./promotionManualSimulationPrice.js";
import {
  promocaoBetaOfertaConfiguravel,
  resolverEstadoBetaPrecoApresentacao,
} from "./promotionBetaPricePresentation.js";
import { buildFinalPromotionTruthPresentation } from "./promotionFinalTruthPresentationGate.js";
import {
  calcularPercentualDescontoExato,
  calcularPrecoAPartirPercentualDescontoExato,
  formatarPercentualDescontoExatoExibicao,
} from "./promotionDiscountSemantics.js";
import {
  resolverRotuloDescontoMiniCardPromocao,
  resolverRotuloDescontoReaisMiniCardPromocao,
} from "../../../components/pricing/pricingPromotionMiniCardUi.js";
import { resolverPrecoVendaPromocaoPainelExibicao } from "../../../components/pricing/pricingPromotionMoneyUi.js";

const ROUND = Decimal.ROUND_HALF_UP;

export const PROMO_MINI_CARD_TOOLTIP_CONFIGURAVEL =
  "Esta promoção permite ajustar o valor ou o percentual de desconto para simular.";

export const PROMO_MINI_CARD_TOOLTIP_SEM_PRECO =
  "O Mercado Livre não retornou o preço final desta promoção. Informe o valor de venda para simular.";

export const PROMO_MINI_CARD_ERRO_ACIMA_ORIGINAL =
  "O valor da promoção não pode superar o preço atual.";

export const PROMO_MINI_CARD_ERRO_ACIMA_TETO_PREFIXO =
  "O preço não pode ser maior que o valor inicial da promoção:";

export const PROMO_MINI_CARD_PRECO_ZERO = "R$ 0,00";

export const PROMO_MINI_CARD_DESCONTO_ZERO = "Desconto de 0%";

export const PROMO_MINI_CARD_DESCONTO_REAIS_ZERO = "R$ 0,00 de desconto";

/** @param {unknown} v @returns {Decimal | null} */
function toDec(v) {
  if (v == null || v === "") return null;
  try {
    const d = new Decimal(String(v).trim().replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** @param {Decimal | null} d */
function decStr2(d) {
  return d == null ? null : d.toDecimalPlaces(2, ROUND).toFixed(2);
}

/** @param {Decimal} dec */
export function formatarPercentualSimulacaoExibicao(dec) {
  // S4.3.6.18 — exibição do % exato (não arredonda para o inteiro visual do ML).
  return formatarPercentualDescontoExatoExibicao(dec) ?? "0";
}

/**
 * @param {string | null | undefined} originalBrl
 * @param {string | null | undefined} priceBrl
 */
export function calcularDescontoSimulacaoAPartirPreco(originalBrl, priceBrl) {
  const hit = calcularPercentualDescontoExato(originalBrl, priceBrl);
  if (hit.ok === false) {
    if (hit.error === "sale_above_base") {
      return { ok: false, error: PROMO_MINI_CARD_ERRO_ACIMA_ORIGINAL };
    }
    return null;
  }
  return {
    ok: true,
    priceBrl: hit.salePriceBrl,
    amountBrl: hit.discountAmountBrl,
    percentDec: hit.exactDec,
    percentDisplay: hit.exactDiscountPercentageDisplay,
  };
}

/**
 * @param {string | null | undefined} originalBrl
 * @param {string | number | null | undefined} percentRaw
 */
export function calcularDescontoSimulacaoAPartirPercentual(originalBrl, percentRaw) {
  const hit = calcularPrecoAPartirPercentualDescontoExato(originalBrl, percentRaw);
  if (hit.ok === false) {
    if (hit.error === "sale_not_positive") {
      return { ok: false, error: PROMO_MINI_CARD_ERRO_ACIMA_ORIGINAL };
    }
    return null;
  }
  return {
    ok: true,
    priceBrl: hit.salePriceBrl,
    amountBrl: hit.discountAmountBrl,
    percentDec: hit.exactDec,
    percentDisplay: hit.exactDiscountPercentageDisplay,
  };
}

/** @param {unknown} scenario */
function obterCardContrato(scenario) {
  if (scenario == null || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  return r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
    ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
    : null;
}

/** @param {unknown} scenario @param {Record<string, unknown> | null | undefined} catalogRow */
function obterOriginalBrl(scenario, catalogRow) {
  const hit = resolverPrecoOriginalPromocaoMonetario(scenario, catalogRow);
  if (hit?.valor > 0) return decStr2(toDec(hit.valor));
  const card = obterCardContrato(scenario);
  return card?.original_price_brl != null ? String(card.original_price_brl) : null;
}

/** @param {unknown} scenario */
function obterPrecoProgramadoExibicao(scenario) {
  const card = obterCardContrato(scenario);
  const brl =
    card?.selected_final_price ??
    card?.real_promotion_final_price_brl ??
    card?.official_promotion_display_price_brl ??
    null;
  if (brl == null || String(brl).trim() === "") return null;
  return formatarDecimalBrlExibicao(String(brl));
}

/**
 * @param {{
 *   scenario: unknown;
 *   manualPriceRecord?: import("./promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   statusKind?: string;
 *   temFundingMl?: boolean;
 * }} params
 */
export function resolverExibicaoFinanceiraMiniCardBeta({
  scenario,
  manualPriceRecord = null,
  catalogRow = null,
  statusKind = "disponivel",
  temFundingMl = false,
}) {
  const betaState = resolverEstadoBetaPrecoApresentacao(scenario, manualPriceRecord);
  const gate = buildFinalPromotionTruthPresentation({ scenario, manualPriceRecord });
  const confirmado = gate.truthStatus === "CONFIRMED_OFFICIAL" && gate.officialPriceBrl != null;
  const configuravel = !confirmado && promocaoBetaOfertaConfiguravel(scenario);
  const programado = statusKind === "programada";
  const originalBrl = obterOriginalBrl(scenario, catalogRow);
  const manualReady = gate.displayState === "MANUAL";
  const manualEmpty = gate.displayState === "EMPTY";

  /** @type {"programado" | "confirmado" | "configuravel" | "vazio" | "manual"} */
  let modo = "vazio";
  if (programado) modo = "programado";
  else if (confirmado) modo = "confirmado";
  else if (manualReady) modo = "manual";
  // S4.3.6.17 — configurável sem manual permanece VAZIO (sentinel R$ 0,00).
  // Candidato suggested_initial NÃO vira preço de exibição/simulação.
  else if (manualEmpty || configuravel) modo = "vazio";

  const permiteEdicao =
    !temFundingMl && !programado && !confirmado && (configuravel || manualEmpty || manualReady);

  let precoExibicao = PROMO_MINI_CARD_PRECO_ZERO;
  /** @type {string | null} */
  let precoBrl = null;
  /** @type {string | null} */
  let descontoPctLinha = PROMO_MINI_CARD_DESCONTO_ZERO;
  /** @type {string | null} */
  let descontoReaisLinha = PROMO_MINI_CARD_DESCONTO_REAIS_ZERO;
  /** @type {string | null} */
  let percentualBrl = "0";

  let tooltipPreco = PROMO_MINI_CARD_TOOLTIP_SEM_PRECO;
  if (configuravel || manualReady) tooltipPreco = PROMO_MINI_CARD_TOOLTIP_CONFIGURAVEL;

  if (temFundingMl) {
    return {
      modo: "vazio",
      precoExibicao: null,
      precoBrl: null,
      descontoPctLinha: null,
      descontoReaisLinha: null,
      percentualBrl: null,
      permiteEdicaoPreco: false,
      permiteEdicaoPercentual: false,
      tooltipPreco: null,
      originalBrl,
    };
  }

  if (programado) {
    const card = obterCardContrato(scenario);
    precoExibicao =
      obterPrecoProgramadoExibicao(scenario) ??
      resolverPrecoVendaPromocaoPainelExibicao(scenario) ??
      PROMO_MINI_CARD_PRECO_ZERO;
    precoBrl =
      card?.selected_final_price != null
        ? String(card.selected_final_price)
        : card?.real_promotion_final_price_brl != null
          ? String(card.real_promotion_final_price_brl)
          : null;

    // S4.3.6.18 — % exato a partir do preço; discount_percent_display do ML é só visual.
    if (originalBrl && precoBrl) {
      const calcProg = calcularDescontoSimulacaoAPartirPreco(originalBrl, precoBrl);
      if (calcProg?.ok) {
        descontoPctLinha = `Desconto de ${calcProg.percentDisplay}%`;
        percentualBrl = calcProg.percentDisplay;
        descontoReaisLinha = `${formatarPrecoRealExibicao(Number(calcProg.amountBrl))} de desconto`;
      }
    }
    if (descontoPctLinha === PROMO_MINI_CARD_DESCONTO_ZERO) {
      descontoPctLinha =
        resolverRotuloDescontoMiniCardPromocao(scenario) ?? PROMO_MINI_CARD_DESCONTO_ZERO;
    }
    if (descontoReaisLinha === PROMO_MINI_CARD_DESCONTO_REAIS_ZERO) {
      if (card?.discount_amount_brl != null && isValidDecimalMoneyString(String(card.discount_amount_brl))) {
        descontoReaisLinha = `${formatarDecimalBrlExibicao(String(card.discount_amount_brl))} de desconto`;
      } else {
        descontoReaisLinha =
          resolverRotuloDescontoReaisMiniCardPromocao(scenario) ?? PROMO_MINI_CARD_DESCONTO_REAIS_ZERO;
      }
    }
    return {
      modo,
      precoExibicao,
      precoBrl,
      descontoPctLinha,
      descontoReaisLinha,
      percentualBrl,
      permiteEdicaoPreco: false,
      permiteEdicaoPercentual: false,
      tooltipPreco: null,
      originalBrl,
    };
  }

  if (confirmado) {
    precoBrl = gate.officialPriceBrl;
    precoExibicao =
      (precoBrl != null ? formatarDecimalBrlExibicao(precoBrl) : null) ??
      resolverPrecoVendaPromocaoPainelExibicao(scenario) ??
      PROMO_MINI_CARD_PRECO_ZERO;
    // S4.3.6.18 — % exato derivado do preço oficial (SSOT); nunca o inteiro visual do ML.
    const exact = calcularDescontoSimulacaoAPartirPreco(originalBrl, precoBrl);
    descontoPctLinha =
      exact?.ok === true && exact.percentDisplay != null
        ? `Desconto de ${exact.percentDisplay}%`
        : resolverRotuloDescontoMiniCardPromocao(scenario);
    descontoReaisLinha = resolverRotuloDescontoReaisMiniCardPromocao(scenario);
    if (exact?.ok === true && exact.percentDisplay != null) {
      percentualBrl = exact.percentDisplay;
    }
    return {
      modo,
      precoExibicao,
      precoBrl,
      descontoPctLinha,
      descontoReaisLinha,
      percentualBrl,
      permiteEdicaoPreco: false,
      permiteEdicaoPercentual: false,
      tooltipPreco: null,
      originalBrl,
    };
  }

  if (manualReady && isValidDecimalMoneyString(gate.miniCardPriceBrl ?? betaState.manualPriceBrl)) {
    precoBrl = gate.miniCardPriceBrl ?? betaState.manualPriceBrl;
    precoExibicao = formatarDecimalBrlExibicao(precoBrl) ?? PROMO_MINI_CARD_PRECO_ZERO;
    const calc = calcularDescontoSimulacaoAPartirPreco(originalBrl, precoBrl);
    if (calc?.ok) {
      descontoPctLinha = `Desconto de ${calc.percentDisplay}%`;
      descontoReaisLinha = `${formatarPrecoRealExibicao(Number(calc.amountBrl))} de desconto`;
      percentualBrl = calc.percentDisplay;
    }
    tooltipPreco = configuravel ? PROMO_MINI_CARD_TOOLTIP_CONFIGURAVEL : tooltipPreco;
    return {
      modo,
      precoExibicao,
      precoBrl,
      descontoPctLinha,
      descontoReaisLinha,
      percentualBrl,
      permiteEdicaoPreco: permiteEdicao,
      permiteEdicaoPercentual: permiteEdicao,
      tooltipPreco,
      originalBrl,
    };
  }

  // EMPTY fail-closed: sentinel visual R$ 0,00 — salePrice interno permanece null.
  if (configuravel) tooltipPreco = PROMO_MINI_CARD_TOOLTIP_CONFIGURAVEL;
  return {
    modo: "vazio",
    precoExibicao: PROMO_MINI_CARD_PRECO_ZERO,
    precoBrl: null,
    descontoPctLinha: PROMO_MINI_CARD_DESCONTO_ZERO,
    descontoReaisLinha: PROMO_MINI_CARD_DESCONTO_REAIS_ZERO,
    percentualBrl: "0",
    permiteEdicaoPreco: permiteEdicao,
    permiteEdicaoPercentual: permiteEdicao,
    tooltipPreco,
    originalBrl,
  };
}

/** @param {string | null | undefined} percentDisplay */
export function percentualSimulacaoParaNumeroPopover(percentDisplay) {
  if (percentDisplay == null || String(percentDisplay).trim() === "") return null;
  const dec = toDec(String(percentDisplay).replace(",", "."));
  if (dec == null) return null;
  return Number(dec.toFixed(2));
}

/**
 * @param {string | null | undefined} originalBrl
 * @param {string | null | undefined} precoAtualBrl
 */
export function resolverLimitesSliderPrecoPromocional(originalBrl, precoAtualBrl) {
  const original = toDec(originalBrl);
  if (original == null || !original.gt(0)) {
    return { min: 1, max: 1000, habilitado: false };
  }
  const max = Number(original.toDecimalPlaces(2, ROUND).toFixed(2));
  const min = Math.min(1, max);
  const atual = toDec(precoAtualBrl);
  const fallback = atual != null && atual.gt(0) ? Number(atual.toFixed(2)) : max;
  return { min, max, habilitado: true, valorInicial: Math.min(max, Math.max(min, fallback)) };
}

/** @param {unknown} scenario @param {import("./promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null | undefined} [manualPriceRecord] */
export function resolverPrecoSimulacaoPromocaoMonetario(scenario, manualPriceRecord = null) {
  const gate = buildFinalPromotionTruthPresentation({ scenario, manualPriceRecord });
  // S4.3.6.17 — somente oficial confirmado ou manual explícito. Teto/candidato NÃO simulam.
  if (gate.salePriceForFinance != null && isValidDecimalMoneyString(gate.salePriceForFinance)) {
    return gate.salePriceForFinance;
  }
  return null;
}

/**
 * Metadados do desconto inicial exato (teto) — preserva centavos ao redigitar % exibido.
 * @param {string | null | undefined} baseBrl
 * @param {string | null | undefined} ceilingBrl
 */
export function resolverMetadadosDescontoInicialPromocao(baseBrl, ceilingBrl) {
  const calc = calcularDescontoSimulacaoAPartirPreco(baseBrl, ceilingBrl);
  if (calc?.ok !== true || calc.percentDec == null) return null;
  return {
    initialDiscountPercentDec: calc.percentDec.toFixed(6),
    initialDiscountPercentDisplay: calc.percentDisplay,
  };
}

/**
 * @param {{
 *   baseBrl: string | null | undefined;
 *   ceilingBrl: string | null | undefined;
 *   discountRaw: string;
 *   initialDiscountPercentDec?: string | null;
 *   initialDiscountPercentDisplay?: string | null;
 * }} params
 */
export function validarDescontoPromocionalContraMinimo({
  baseBrl,
  ceilingBrl,
  discountRaw,
  initialDiscountPercentDec = null,
  initialDiscountPercentDisplay = null,
}) {
  const gatePct = validarPercentualManualSimulacao(discountRaw);
  if (!gatePct.ok) return gatePct;

  const digitado = gatePct.percent;
  const displayInicial =
    initialDiscountPercentDisplay != null && String(initialDiscountPercentDisplay).trim() !== ""
      ? String(initialDiscountPercentDisplay).trim()
      : null;

  if (
    displayInicial != null &&
    ceilingBrl != null &&
    isValidDecimalMoneyString(ceilingBrl) &&
    (digitado === displayInicial ||
      digitado.replace(",", ".") === displayInicial.replace(",", ".") ||
      Number(digitado.replace(",", ".")) === Number(displayInicial.replace(",", ".")))
  ) {
    return {
      ok: true,
      priceBrl: decStr2(toDec(ceilingBrl)),
      percentDisplay: displayInicial,
      restoredFromCeiling: true,
    };
  }

  const calc = calcularDescontoSimulacaoAPartirPercentual(baseBrl, digitado);
  if (calc?.ok === false) {
    return { ok: false, error: calc.error ?? "Informe um percentual válido." };
  }
  if (calc?.ok !== true || calc.priceBrl == null) {
    return { ok: false, error: "Informe um percentual válido." };
  }

  if (initialDiscountPercentDec != null && String(initialDiscountPercentDec).trim() !== "") {
    const minDec = toDec(initialDiscountPercentDec);
    const pctDec = calc.percentDec ?? toDec(digitado);
    if (minDec != null && pctDec != null && pctDec.lt(minDec)) {
      const exibicaoMin =
        displayInicial ??
        formatarPercentualSimulacaoExibicao(minDec.toDecimalPlaces(2, ROUND));
      return {
        ok: false,
        error: `O desconto não pode ser menor que o desconto inicial da promoção: ${exibicaoMin}%.`,
        code: "BELOW_INITIAL_DISCOUNT",
      };
    }
  }

  if (ceilingBrl != null && String(ceilingBrl).trim() !== "") {
    const gatePreco = validarPrecoPromocionalContraTeto(ceilingBrl, calc.priceBrl, baseBrl);
    if (!gatePreco.ok) return gatePreco;
    return {
      ok: true,
      priceBrl: gatePreco.priceBrl ?? calc.priceBrl,
      percentDisplay: calc.percentDisplay,
    };
  }

  if (!isValidDecimalMoneyString(calc.priceBrl)) {
    return { ok: false, error: "Informe um percentual válido." };
  }
  return { ok: true, priceBrl: calc.priceBrl, percentDisplay: calc.percentDisplay };
}

/** Passo monetário do slider promocional (R$). */
export const PRECO_STEP_PROMOCIONAL = 1;

/** @deprecated S4.3.6.11 — substituído por PRECO_STEP_PROMOCIONAL / teto imutável S4.3.6.12 */
export const PRECO_STEP_OFFSET_PROMOCIONAL = PRECO_STEP_PROMOCIONAL;

/** Piso monetário canônico já adotado na Promo Beta (R$ 1,00). */
export const PRECO_PISO_PROMOCIONAL_BRL = "1";

/**
 * Preço inicial da promoção (teto máximo editável) — não confundir com preço-base do anúncio.
 * S4.3.6.17 — UNCONFIRMED: nunca usa suggested/real/selected rejeitados como teto
 * (bloquearia entrada manual correta, ex.: Relâmpago 140,57 > candidato 138,25).
 * @param {unknown} scenario
 */
export function resolverPrecoInicialPromocaoTeto(scenario) {
  const gate = buildFinalPromotionTruthPresentation({ scenario, manualPriceRecord: null });
  if (gate.truthStatus === "CONFIRMED_OFFICIAL" && isValidDecimalMoneyString(gate.officialPriceBrl)) {
    return gate.officialPriceBrl;
  }

  // Fail-closed: teto seguro = preço-base do anúncio (permite desconto manual livre até o piso).
  const card = obterCardContrato(scenario);
  const original = card?.original_price_brl ?? null;
  if (isValidDecimalMoneyString(String(original ?? ""))) return String(original);

  return null;
}

/**
 * @param {string | null | undefined} tetoBrl
 * @param {string | null | undefined} priceBrl
 */
export function precoPromocionalNoTeto(tetoBrl, priceBrl) {
  const teto = toDec(tetoBrl);
  const price = toDec(priceBrl);
  if (teto == null || price == null || !teto.gt(0)) return false;
  return price.toDecimalPlaces(2, ROUND).eq(teto.toDecimalPlaces(2, ROUND));
}

/**
 * @param {string | null | undefined} priceBrl
 * @param {string | null | undefined} [pisoBrl]
 */
export function precoPromocionalNoPiso(priceBrl, pisoBrl = PRECO_PISO_PROMOCIONAL_BRL) {
  const price = toDec(priceBrl);
  const piso = toDec(pisoBrl) ?? new Decimal(1);
  if (price == null || !price.gt(0)) return false;
  return price.toDecimalPlaces(2, ROUND).lte(piso.toDecimalPlaces(2, ROUND));
}

/**
 * Faixa absoluta do slider promocional: piso canônico → teto imutável.
 * @param {string | null | undefined} tetoBrl
 * @param {string | null | undefined} precoAtualBrl
 */
export function resolverLimitesSliderTetoPromocional(tetoBrl, precoAtualBrl) {
  const teto = toDec(tetoBrl);
  if (teto == null || !teto.gt(0)) {
    return {
      min: 1,
      max: 1,
      habilitado: false,
      noTeto: false,
      noPiso: false,
    };
  }
  const piso = toDec(PRECO_PISO_PROMOCIONAL_BRL) ?? new Decimal(1);
  const min = Number(piso.toDecimalPlaces(2, ROUND).toFixed(2));
  const max = Number(teto.toDecimalPlaces(2, ROUND).toFixed(2));
  const atual = toDec(precoAtualBrl);
  const valorAtual =
    atual != null && atual.gt(0) ? Number(atual.toDecimalPlaces(2, ROUND).toFixed(2)) : max;
  return {
    min,
    max,
    habilitado: max >= min,
    valorAtual: Math.min(max, Math.max(min, valorAtual)),
    noTeto: precoPromocionalNoTeto(tetoBrl, precoAtualBrl),
    noPiso: precoPromocionalNoPiso(precoAtualBrl),
  };
}

/**
 * @param {string | null | undefined} tetoBrl
 */
export function formatarErroAcimaTetoPromocional(tetoBrl) {
  const exibicao = formatarDecimalBrlExibicao(String(tetoBrl ?? "")) ?? String(tetoBrl ?? "").trim();
  return `${PROMO_MINI_CARD_ERRO_ACIMA_TETO_PREFIXO} ${exibicao}.`;
}

/**
 * @param {string | null | undefined} tetoBrl
 * @param {string | null | undefined} priceBrl
 * @param {string | null | undefined} baseBrl
 */
export function validarPrecoPromocionalContraTeto(tetoBrl, priceBrl, baseBrl) {
  if (!isValidDecimalMoneyString(priceBrl)) {
    return { ok: false, error: "Informe um preço válido." };
  }
  const teto = toDec(tetoBrl);
  const price = toDec(priceBrl);
  if (teto == null || price == null || !teto.gt(0)) {
    return { ok: false, error: "Informe um preço válido." };
  }
  if (price.toDecimalPlaces(2, ROUND).gt(teto.toDecimalPlaces(2, ROUND))) {
    return { ok: false, error: formatarErroAcimaTetoPromocional(tetoBrl), code: "ABOVE_CEILING" };
  }
  const calc = calcularDescontoSimulacaoAPartirPreco(baseBrl, priceBrl);
  if (calc?.ok === false) {
    return { ok: false, error: calc.error ?? PROMO_MINI_CARD_ERRO_ACIMA_ORIGINAL };
  }
  return { ok: true, priceBrl: decStr2(price) };
}

/**
 * @param {string | null | undefined} priceBrl
 * @param {number} deltaSteps
 * @param {string | null | undefined} tetoBrl
 * @param {string | null | undefined} [pisoBrl]
 * @returns {string | null}
 */
export function ajustarPrecoPromocionalComStep(priceBrl, deltaSteps, tetoBrl, pisoBrl = PRECO_PISO_PROMOCIONAL_BRL) {
  const price = toDec(priceBrl);
  const teto = toDec(tetoBrl);
  const piso = toDec(pisoBrl) ?? new Decimal(1);
  if (price == null || teto == null || !Number.isFinite(deltaSteps)) return null;
  const step = new Decimal(PRECO_STEP_PROMOCIONAL);
  let next = price.plus(step.times(deltaSteps)).toDecimalPlaces(2, ROUND);
  if (next.gt(teto.toDecimalPlaces(2, ROUND))) next = teto.toDecimalPlaces(2, ROUND);
  if (next.lt(piso.toDecimalPlaces(2, ROUND))) next = piso.toDecimalPlaces(2, ROUND);
  if (!next.gt(0)) return null;
  return next.toFixed(2);
}

/** Passo do slider centralizado de promoções (R$). — legado S4.3.6.11 */

/** @param {Decimal} candidate @param {Decimal} min @param {Decimal | null} original */
function limitarPrecoCandidatePromocional(candidate, min, original) {
  let out = candidate.toDecimalPlaces(2, ROUND);
  if (!out.gt(0)) return null;
  if (out.lt(min)) out = min.toDecimalPlaces(2, ROUND);
  if (original != null && original.gt(0) && out.gt(original)) {
    out = original.toDecimalPlaces(2, ROUND);
  }
  return out;
}

/**
 * Preço candidato a partir de âncora + offset relativo (Decimal).
 * @param {string | null | undefined} anchorBrl
 * @param {number} offset
 * @param {string | null | undefined} originalBrl
 * @returns {string | null}
 */
export function calcularPrecoAPartirOffsetPromocional(anchorBrl, offset, originalBrl) {
  const anchor = toDec(anchorBrl);
  if (anchor == null || !anchor.gt(0)) return null;
  if (!Number.isFinite(offset)) return null;
  const step = new Decimal(PRECO_STEP_OFFSET_PROMOCIONAL);
  const min = new Decimal(1);
  const original = toDec(originalBrl);
  const candidate = anchor.plus(step.times(offset));
  const limitado = limitarPrecoCandidatePromocional(candidate, min, original);
  return limitado != null ? limitado.toFixed(2) : null;
}

/**
 * Limites simétricos ±N passos ao redor do preço âncora (centro visual do slider).
 * @param {string | null | undefined} anchorBrl
 * @param {string | null | undefined} originalBrl
 */
export function resolverLimitesOffsetSimetricoPromocional(anchorBrl, originalBrl) {
  const anchor = toDec(anchorBrl);
  const original = toDec(originalBrl);
  if (anchor == null || !anchor.gt(0) || original == null || !original.gt(0)) {
    return {
      offsetMin: 0,
      offsetMax: 0,
      habilitado: false,
      step: PRECO_STEP_OFFSET_PROMOCIONAL,
      simetricoN: 0,
    };
  }
  const step = new Decimal(PRECO_STEP_OFFSET_PROMOCIONAL);
  const min = new Decimal(1);
  const maxUp = original.minus(anchor).div(step).floor();
  const maxDown = anchor.minus(min).div(step).floor();
  const maxUpN = Math.max(0, Number(maxUp.toFixed(0)));
  const maxDownN = Math.max(0, Number(maxDown.toFixed(0)));
  const simetricoN = Math.min(maxUpN, maxDownN);
  return {
    offsetMin: -simetricoN,
    offsetMax: simetricoN,
    habilitado: simetricoN > 0,
    step: PRECO_STEP_OFFSET_PROMOCIONAL,
    simetricoN,
  };
}

/**
 * @param {string | null | undefined} originalBrl
 * @param {string | null | undefined} priceBrl
 */
export function resolverDescontoPctNumPopover(originalBrl, priceBrl) {
  const calc = calcularDescontoSimulacaoAPartirPreco(originalBrl, priceBrl);
  if (calc?.ok !== true || calc.percentDec == null) return null;
  // Mantém precisão contratada (4 casas) para edição bidirecional sem drift para o % ML.
  return Number(calc.percentDec.toDecimalPlaces(4, ROUND).toFixed(4));
}

/**
 * @param {number | null | undefined} num
 * @returns {string | null}
 */
export function numeroSimulacaoParaPrecoBrl(num) {
  if (num == null || !Number.isFinite(num)) return null;
  try {
    const d = new Decimal(num).toDecimalPlaces(2, ROUND);
    if (!d.isFinite() || !d.gt(0)) return null;
    return d.toFixed(2);
  } catch {
    return null;
  }
}

/**
 * @param {string} raw
 * @returns {{ ok: true; percent: string } | { ok: false; error: string }}
 */
export function validarPercentualManualSimulacao(raw) {
  if (raw == null || String(raw).trim() === "") {
    return { ok: false, error: "Informe um percentual válido." };
  }
  const t = String(raw).trim().replace("%", "").replace(",", ".");
  try {
    const d = new Decimal(t);
    if (!d.isFinite() || d.isNaN() || d.lt(0) || d.gt(100)) {
      return { ok: false, error: "Informe um percentual válido." };
    }
    return { ok: true, percent: formatarPercentualSimulacaoExibicao(d) };
  } catch {
    return { ok: false, error: "Informe um percentual válido." };
  }
}
