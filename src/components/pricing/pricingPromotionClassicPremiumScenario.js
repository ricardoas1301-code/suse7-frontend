// ======================================================
// PI — Promoções: cenário Clássico/Premium a partir da promoção selecionada.
// Metadados da promoção + contrato financeiro recalculado pela simulação oficial (sem stale).
// ======================================================

import { obterContratoPrecoMiniCardPromocao, resolverNomePromocaoContratoPreco } from "./pricingPromotionCardContract.js";
import { resolverPrecoPromocaoNumericoNormalizado } from "./pricingPromotionMoneyUi.js";
import {
  formatarPercentualPromocaoPtBr,
  normalizarNomePromocaoExibicaoUi,
  normalizarPercentualPromocaoExibicao,
  parsePercentualPromocaoApiDecimal,
  resolverPromocaoRelampago,
} from "./pricingPromotionMiniCardUi.js";
import {
  extrairAjustesFinanceirosPromocaoSelecionada,
  reidratarReducaoTarifaNoCenarioFinal,
  sanitizarCenarioSimuladoBrutoPromocao,
} from "../../features/pricing/promotions/aplicarReducaoTarifaPromocaoNoCenario.js";
import { buildFinalPromotionTruthPresentation } from "../../features/pricing/promotions/promotionFinalTruthPresentationGate.js";

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

/**
 * @param {unknown} scenario
 * @returns {number | null}
 */
export function resolverPrecoPromocaoNumerico(scenario) {
  return resolverPrecoPromocaoNumericoNormalizado(scenario);
}

/**
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function resolverNomePromocaoExibicao(scenario) {
  const nomeContrato = resolverNomePromocaoContratoPreco(scenario);
  if (nomeContrato != null && String(nomeContrato).trim() !== "") {
    return normalizarNomePromocaoExibicaoUi(
      {
        .../** @type {Record<string, unknown>} */ (scenario ?? {}),
        promotion_name: nomeContrato,
        label: nomeContrato,
      },
      resolverPromocaoRelampago(scenario),
    );
  }
  return normalizarNomePromocaoExibicaoUi(scenario, resolverPromocaoRelampago(scenario));
}

/**
 * @param {unknown} promocaoFonte
 */
export function extrairContextoSelecaoPromocao(promocaoFonte) {
  if (promocaoFonte == null || typeof promocaoFonte !== "object") {
    return {
      promotion_id: null,
      promotion_name: null,
      promotion_type: null,
      selected_final_price: null,
      selected_discount_amount: null,
      selected_rule: null,
      source_trace: null,
    };
  }
  const promo = /** @type {Record<string, unknown>} */ (promocaoFonte);
  const card = obterContratoPrecoMiniCardPromocao(promo);
  const cardRec =
    card != null && typeof card === "object" ? /** @type {Record<string, unknown>} */ (card) : null;

  const gate = buildFinalPromotionTruthPresentation({ scenario: promocaoFonte });
  const confirmedPrice =
    gate.truthStatus === "CONFIRMED_OFFICIAL" && gate.officialPriceBrl != null
      ? gate.officialPriceBrl
      : null;

  return {
    promotion_id:
      cardRec?.promotion_id != null
        ? String(cardRec.promotion_id)
        : promo.promotion_id != null
          ? String(promo.promotion_id)
          : null,
    promotion_name:
      cardRec?.promotion_name != null
        ? String(cardRec.promotion_name)
        : promo.promotion_name != null
          ? String(promo.promotion_name)
          : promo.label != null
            ? String(promo.label)
            : null,
    promotion_type:
      cardRec?.promotion_type != null
        ? String(cardRec.promotion_type)
        : promo.promotion_type != null
          ? String(promo.promotion_type)
          : null,
    // S4.3.6.17 — selected_final_price só com oficial confirmado (nunca real_/candidato rejeitado).
    selected_final_price: confirmedPrice,
    selected_discount_amount:
      confirmedPrice != null && cardRec?.discount_amount_brl != null
        ? String(cardRec.discount_amount_brl)
        : confirmedPrice != null && cardRec?.selected_discount_amount != null
          ? String(cardRec.selected_discount_amount)
          : null,
    selected_rule: cardRec?.selected_rule != null ? String(cardRec.selected_rule) : null,
    source_trace: cardRec?.source_trace ?? null,
  };
}

/**
 * @param {Record<string, unknown>} mSim
 * @param {Record<string, unknown> | null} cardContract
 */
function propagarPercentualDescontoContratoNoMarketplace(mSim, cardContract) {
  if (cardContract == null) return;
  const bruto = cardContract.discount_percent_display;
  if (bruto == null || String(bruto).trim() === "") return;
  const parsed = parsePercentualPromocaoApiDecimal(bruto);
  if (parsed == null) return;
  const normalizado = normalizarPercentualPromocaoExibicao(parsed);
  mSim.seller_discount_percent = formatarPercentualPromocaoPtBr(normalizado);
}

/**
 * Mescla metadados da promoção ML no cenário simulado oficial.
 * A simulação é SSOT para tarifa, frete, repasse, custos internos e resultado.
 *
 * @param {unknown} cenarioSimulado
 * @param {unknown} promocaoFonte
 * @param {{ precoPromocionalAtualBrl?: string | null }} [ctx]
 * @returns {Record<string, unknown> | null}
 */
export function mesclarMetadadosPromocaoNoCenario(cenarioSimulado, promocaoFonte, ctx = {}) {
  if (cenarioSimulado == null || typeof cenarioSimulado !== "object") {
    return null;
  }
  if (promocaoFonte == null || typeof promocaoFonte !== "object") {
    return /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (cenarioSimulado) });
  }

  const sim = /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (cenarioSimulado) });
  const promo = /** @type {Record<string, unknown>} */ (promocaoFonte);

  const chavesPromo = [
    "promotion_name",
    "promotion_id",
    "promotion_type",
    "offer_id",
    "starts_at",
    "ends_at",
    "ml_promotion_raw_status",
    "promotion_active",
    "scenario_type",
    "kind",
    "_sale_xray_ux_group",
    "promotion_stable_key",
    "promotion_vigencia_text",
    "promotion_card_contract",
    "promotion_offer_contract",
    "promotion_funding",
    "promotion_financial_adjustments",
    "promotion_fee_discount",
    "ml_financial_audit",
    "ml_official_identity_key",
    "promotion_calc_card_selection_contract",
  ];
  for (const chave of chavesPromo) {
    if (promo[chave] != null) sim[chave] = promo[chave];
  }

  const nomeAmigavel = resolverNomePromocaoExibicao(promo);
  if (nomeAmigavel != null && nomeAmigavel.trim() !== "") {
    sim.promotion_name = nomeAmigavel;
    sim.label = nomeAmigavel;
  } else if (promo.label != null) {
    sim.label = promo.label;
  }

  const mSim =
    sim.marketplace != null && typeof sim.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (sim.marketplace) })
      : /** @type {Record<string, unknown>} */ ({});
  const mPromo =
    promo.marketplace != null && typeof promo.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (promo.marketplace)
      : /** @type {Record<string, unknown>} */ ({});

  const cardContract = obterContratoPrecoMiniCardPromocao(promo);
  const contract =
    promo.promotion_offer_contract != null && typeof promo.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (promo.promotion_offer_contract)
      : null;

  if (cardContract != null) {
    if (cardContract.real_promotion_final_price_brl != null) {
      const contractPrice = String(cardContract.real_promotion_final_price_brl);
      const precoAtual =
        ctx.precoPromocionalAtualBrl != null && String(ctx.precoPromocionalAtualBrl).trim() !== ""
          ? String(ctx.precoPromocionalAtualBrl).trim()
          : null;
      const simSale =
        mSim.sale_price_brl != null && String(mSim.sale_price_brl).trim() !== ""
          ? String(mSim.sale_price_brl).trim()
          : null;
      const preservarPrecoSimulado =
        precoAtual != null &&
        contractPrice !== precoAtual &&
        simSale != null &&
        simSale === precoAtual;

      if (!preservarPrecoSimulado) {
        mSim.sale_price_brl = contractPrice;
        sim.sale_price_brl = contractPrice;
      }
    }
    if (cardContract.original_price_brl != null) {
      mSim.original_price_brl = cardContract.original_price_brl;
    }
    if (cardContract.discount_amount_brl != null) {
      mSim.seller_discount_amount_brl = cardContract.discount_amount_brl;
    }
    propagarPercentualDescontoContratoNoMarketplace(mSim, cardContract);
  } else if (contract != null) {
    if (contract.buyer_final_price_brl != null || contract.final_price_brl != null) {
      const finalStr = String(contract.buyer_final_price_brl ?? contract.final_price_brl);
      mSim.sale_price_brl = finalStr;
      sim.sale_price_brl = finalStr;
    }
    if (contract.original_price_brl != null) {
      mSim.original_price_brl = contract.original_price_brl;
    }
    if (contract.discount_amount_brl != null) {
      mSim.seller_discount_amount_brl = contract.discount_amount_brl;
    }
    if (contract.discount_percent_display != null) {
      propagarPercentualDescontoContratoNoMarketplace(mSim, contract);
    }
    if (contract.freight_cost_brl != null && mSim.shipping_cost_amount_brl == null) {
      mSim.shipping_cost_amount_brl = contract.freight_cost_brl;
    }
  } else {
    const chavesDescontoSeller = ["seller_discount_amount_brl", "seller_discount_percent"];
    for (const chave of chavesDescontoSeller) {
      if (
        (mSim[chave] == null || String(mSim[chave]).trim() === "") &&
        mPromo[chave] != null &&
        String(mPromo[chave]).trim() !== ""
      ) {
        mSim[chave] = mPromo[chave];
      }
    }
  }

  sim.marketplace = mSim;
  sim.is_baseline = false;

  const ajustesAutoritativos = extrairAjustesFinanceirosPromocaoSelecionada(promo);
  if (ajustesAutoritativos != null) {
    sim.promotion_financial_adjustments = ajustesAutoritativos;
  }

  return sim;
}

/**
 * @param {unknown} promocaoScenario
 * @param {import("./pricingListingTypeUi.js").ListingTypeChoice} listingType
 * @param {unknown} cenarioSimuladoOficial
 * @param {string | null | undefined} [listingExternalId]
 * @param {string | null | undefined} [precoPromocionalAtualBrl]
 * @returns {Record<string, unknown> | null}
 */
export function resolverCenarioPromocaoPorListingType(
  promocaoScenario,
  listingType,
  cenarioSimuladoOficial,
  listingExternalId = null,
  precoPromocionalAtualBrl = null,
) {
  if (cenarioSimuladoOficial == null || typeof cenarioSimuladoOficial !== "object") {
    return null;
  }
  const simBruto = sanitizarCenarioSimuladoBrutoPromocao(cenarioSimuladoOficial);
  if (simBruto == null) return null;

  if (promocaoScenario == null || typeof promocaoScenario !== "object") {
    return /** @type {Record<string, unknown>} */ ({ ...simBruto });
  }

  const merged = mesclarMetadadosPromocaoNoCenario(simBruto, promocaoScenario, {
    precoPromocionalAtualBrl,
  });
  if (merged == null) return null;

  return reidratarReducaoTarifaNoCenarioFinal(
    merged,
    /** @type {Record<string, unknown>} */ (promocaoScenario),
    { listingType, listingExternalId, precoPromocionalAtualBrl },
  );
}
