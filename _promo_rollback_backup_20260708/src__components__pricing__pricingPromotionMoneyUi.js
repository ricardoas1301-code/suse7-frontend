// ======================================================

// PI — Promoções: normalização segura de valores monetários (somente exibição/simulação UI).

// Reutiliza interpretarPrecoUnitarioBrlBruto (centavos × reais) — sem Number/float cru solto.

// ======================================================



import {

  formatarPrecoRealExibicao,

  interpretarPrecoUnitarioBrlBruto,

} from "./precoInicialAnuncioPrecificacao.js";

import { obterContratoPrecoMiniCardPromocao } from "./pricingPromotionCardContract.js";

import { formatarBrlExibicao } from "./pricingScenarioLocalSimulation.js";



/**

 * @param {unknown} scenario

 * @returns {{ candidatos: unknown[]; originalPrice: unknown; discountSellerBrl: unknown; contract: Record<string, unknown> | null }}

 */

function extrairCamposPrecoPromocao(scenario) {

  if (scenario == null || typeof scenario !== "object") {

    return { candidatos: [], originalPrice: null, discountSellerBrl: null, contract: null };

  }



  const contract = obterContratoPrecoMiniCardPromocao(scenario);

  if (contract != null) {

    const finalRaw = contract.real_promotion_final_price_brl;

    return {

      candidatos: finalRaw != null ? [finalRaw] : [],

      originalPrice: contract.original_price_brl ?? null,

      discountSellerBrl: contract.discount_amount_brl ?? null,

      contract,

    };

  }



  return { candidatos: [], originalPrice: null, discountSellerBrl: null, contract: null };

}



/**

 * @param {unknown} scenario

 * @returns {{ valor: number; parsePath: string } | null}

 */

export function resolverPrecoPromocaoMonetario(scenario) {

  const { contract } = extrairCamposPrecoPromocao(scenario);

  if (contract?.real_promotion_final_price_brl != null) {

    const raw = contract.real_promotion_final_price_brl;

    const parsed = interpretarPrecoUnitarioBrlBruto(raw);

    if (parsed.ok && parsed.valor > 0) {

      return { valor: parsed.valor, parsePath: "promotion_card_contract.real_promotion_final_price_brl" };

    }

  }

  return null;

}



/**

 * @param {unknown} scenario

 * @returns {string | null}

 */

export function resolverPrecoVendaPromocaoPainelExibicao(scenario) {

  const hit = resolverPrecoPromocaoMonetario(scenario);

  if (hit != null) return formatarPrecoRealExibicao(hit.valor);

  const contract = obterContratoPrecoMiniCardPromocao(scenario);

  if (contract != null) return "Preço indisponível";

  return null;

}



/**

 * @param {unknown} scenario

 * @returns {number | null}

 */

export function resolverPrecoPromocaoNumericoNormalizado(scenario) {

  const hit = resolverPrecoPromocaoMonetario(scenario);

  return hit != null ? hit.valor : null;

}



/**

 * @param {unknown} scenario

 * @returns {boolean}

 */

export function promocaoTemDescontoSeller(scenario) {

  if (scenario == null || typeof scenario !== "object") return false;

  const { discountSellerBrl, contract } = extrairCamposPrecoPromocao(scenario);



  if (discountSellerBrl != null && String(discountSellerBrl).trim() !== "") {

    const parsed = interpretarPrecoUnitarioBrlBruto(discountSellerBrl);

    if (parsed.ok && parsed.valor > 0) return true;

  }



  const pctRaw = contract?.discount_percent_display;

  if (pctRaw == null || String(pctRaw).trim() === "") return false;

  const pctParsed = interpretarPrecoUnitarioBrlBruto(String(pctRaw).replace("%", "").trim());

  return pctParsed.ok && pctParsed.valor > 0;

}



/**

 * @param {unknown} scenario

 * @returns {string | null}

 */

export function resolverDescontoSellerPromocaoExibicao(scenario) {

  const { discountSellerBrl } = extrairCamposPrecoPromocao(scenario);

  if (discountSellerBrl == null || String(discountSellerBrl).trim() === "") return null;

  const parsed = interpretarPrecoUnitarioBrlBruto(discountSellerBrl);

  if (!parsed.ok || !(parsed.valor > 0)) return null;

  return formatarBrlExibicao(parsed.valor);

}


