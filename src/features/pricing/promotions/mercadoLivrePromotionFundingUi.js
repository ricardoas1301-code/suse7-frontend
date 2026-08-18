// ======================================================
// PI — Promoções ML: UI funding (subsídio de preço) vs redução de tarifa.
// Somente apresentação — lê contratos normalizados pelo backend.
// ======================================================

import { formatarPrecoRealExibicao } from "../../../components/pricing/precoInicialAnuncioPrecificacao.js";
import { obterAjustesFinanceirosPromocao } from "./aplicarReducaoTarifaPromocaoNoCenario.js";
import { resolverPrecoVendaPromocaoPainelExibicao } from "../../../components/pricing/pricingPromotionMoneyUi.js";
import {
  resolverRotuloDescontoMiniCardPromocao,
  resolverRotuloDescontoReaisMiniCardPromocao,
} from "../../../components/pricing/pricingPromotionMiniCardUi.js";

/**
 * @param {unknown} scenario
 * @returns {Record<string, unknown> | null}
 */
export function obterFundingPromocaoDoCenario(scenario) {
  if (scenario == null || typeof scenario !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.promotion_funding != null && typeof r.promotion_funding === "object") {
    return /** @type {Record<string, unknown>} */ (r.promotion_funding);
  }
  const card =
    r.promotion_card_contract != null && typeof r.promotion_card_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_card_contract)
      : null;
  if (card?.promotion_funding != null && typeof card.promotion_funding === "object") {
    return /** @type {Record<string, unknown>} */ (card.promotion_funding);
  }
  const offer =
    r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
      : null;
  if (offer?.promotion_funding != null && typeof offer.promotion_funding === "object") {
    return /** @type {Record<string, unknown>} */ (offer.promotion_funding);
  }
  return null;
}

/** @param {unknown} bruto @returns {string | null} */
function formatarBrlFunding(bruto) {
  if (bruto == null || String(bruto).trim() === "") return null;
  const parsed = Number(String(bruto).replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  return formatarPrecoRealExibicao(parsed);
}

/**
 * Linhas compactas para mini cards laterais.
 *
 * @param {unknown} scenario
 * @returns {{
 *   temFundingEspecial: boolean;
 *   linhas: string[];
 *   chipCentral: string | null;
 * }}
 */
export function resolverLinhasFundingMiniCardPromocao(scenario) {
  const ajustes =
    scenario != null && typeof scenario === "object"
      ? obterAjustesFinanceirosPromocao(/** @type {Record<string, unknown>} */ (scenario))
      : null;

  const funding = obterFundingPromocaoDoCenario(scenario);
  const temSubsidiPreco =
    ajustes?.has_marketplace_price_subsidy === true ||
    (funding?.has_marketplace_subsidy === true && ajustes?.has_marketplace_fee_discount !== true);
  const temReducaoTarifa = ajustes?.has_marketplace_fee_discount === true;

  if (temSubsidiPreco && funding != null) {
    const comprador = formatarBrlFunding(funding.buyer_final_price_brl);
    const sellerDesc = formatarBrlFunding(funding.seller_discount_brl);
    const mlSub = formatarBrlFunding(funding.marketplace_subsidy_brl);
    const efetivo = formatarBrlFunding(funding.seller_effective_price_brl);

    /** @type {string[]} */
    const linhas = [];
    if (comprador != null) linhas.push(`Comprador ${comprador}`);
    if (sellerDesc != null) linhas.push(`Seller −${sellerDesc}`);
    if (mlSub != null) linhas.push(`ML +${mlSub}`);
    if (efetivo != null) linhas.push(`Efetivo ${efetivo}`);

    return { temFundingEspecial: linhas.length > 0, linhas, chipCentral: null };
  }

  if (temReducaoTarifa) {
    /** @type {string[]} */
    const linhas = [];
    const comprador = resolverPrecoVendaPromocaoPainelExibicao(scenario);
    const descontoPct = resolverRotuloDescontoMiniCardPromocao(scenario);
    const descontoReais = resolverRotuloDescontoReaisMiniCardPromocao(scenario);
    const tarifa = formatarBrlFunding(ajustes?.marketplace_fee_discount_brl);

    if (comprador != null && String(comprador).trim() !== "") linhas.push(`Comprador ${comprador}`);
    if (descontoPct != null && String(descontoPct).trim() !== "") linhas.push(String(descontoPct).trim());
    if (descontoReais != null && String(descontoReais).trim() !== "") linhas.push(String(descontoReais).trim());
    if (tarifa != null) linhas.push(`Reduz tarifa +${tarifa}`);

    return { temFundingEspecial: linhas.length > 0, linhas, chipCentral: null };
  }

  return { temFundingEspecial: false, linhas: [], chipCentral: null };
}
