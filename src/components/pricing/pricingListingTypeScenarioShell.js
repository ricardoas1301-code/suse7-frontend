// ======================================================
// Cenário Clássico/Premium estrutural — card completo mesmo sem tarifa ML oficial.
// ======================================================

import { listingTypePillLabel } from "./pricingListingTypeUi.js";

/** @typedef {import("./pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

const AVISO_DADOS_ML_PENDENTES =
  "Alguns dados do cenário Clássico ainda dependem de sincronização.";

const AVISO_DADOS_ML_PENDENTES_PREMIUM =
  "Alguns dados do cenário Premium ainda dependem de sincronização.";

/**
 * @param {unknown} obj
 */
function clonarCenarioProfundo(obj) {
  if (obj == null || typeof obj !== "object") return null;
  return /** @type {Record<string, unknown>} */ (JSON.parse(JSON.stringify(obj)));
}

/**
 * Espelha temporariamente o cenário Premium no card Clássico (validação visual P_3.X.9).
 * @param {Record<string, unknown>} origem
 * @param {ListingTypeChoice} tipoDestino
 * @param {{ valorApi: string | null }} preco
 */
function espelharCenarioListingTypeParaVisual(origem, tipoDestino, preco) {
  const s = clonarCenarioProfundo(origem);
  if (s == null) return null;

  const label = listingTypePillLabel(tipoDestino);
  s.scenario_id = tipoDestino === "premium" ? "gold_pro" : "gold_special";
  s.scenario_key = s.scenario_id;
  s.scenario_type = "listing_type";
  s.kind = "listing_type";
  s.is_baseline = false;

  const m =
    s.marketplace != null && typeof s.marketplace === "object"
      ? { .../** @type {Record<string, unknown>} */ (s.marketplace) }
      : {};
  m.listing_type_label = label;
  s.marketplace = m;

  const sx =
    s.sale_xray_pricing != null && typeof s.sale_xray_pricing === "object"
      ? { .../** @type {Record<string, unknown>} */ (s.sale_xray_pricing) }
      : {};
  sx.fee_type_label = label;
  s.sale_xray_pricing = sx;

  s._pi_cenario_estrutural = true;
  s._pi_espelho_visual_temporario = true;
  s._pi_dados_ml_pendentes = false;

  return aplicarPrecoRealNoCenario(s, preco);
}

/**
 * @param {Record<string, unknown>} scenario
 */
function limparCamposFinanceirosMlPendentes(scenario) {
  const m =
    scenario.marketplace != null && typeof scenario.marketplace === "object"
      ? { .../** @type {Record<string, unknown>} */ (scenario.marketplace) }
      : {};
  delete m.sale_fee_amount_brl;
  delete m.sale_fee_net_display_brl;
  delete m.charged_fee_brl;
  delete m.charged_fee_gross_brl;
  delete m.charged_fee_net_brl;
  delete m.marketplace_payout_amount_brl;
  delete m.ml_card_payout_amount_brl;
  delete m.ml_card_payout_brl;
  delete m.shipping_cost_amount_brl;
  delete m.ml_card_shipping_amount_brl;
  delete m.ml_card_shipping_brl;
  delete m.preview_fee_gross_brl;
  delete m.preview_fee_net_brl;
  scenario.marketplace = m;

  const sx =
    scenario.sale_xray_pricing != null && typeof scenario.sale_xray_pricing === "object"
      ? { .../** @type {Record<string, unknown>} */ (scenario.sale_xray_pricing) }
      : null;
  if (sx) {
    delete sx.fee_amount_brl;
    delete sx.charged_fee_gross_brl;
    delete sx.charged_fee_net_brl;
    delete sx.net_receivable_brl;
    scenario.sale_xray_pricing = sx;
  }

  const res =
    scenario.result != null && typeof scenario.result === "object"
      ? { .../** @type {Record<string, unknown>} */ (scenario.result) }
      : {};
  delete res.profit_brl;
  delete res.margin_pct;
  scenario.result = res;
}

/**
 * @param {unknown} scenario
 * @param {{ valorApi: string | null }} preco
 */
export function aplicarPrecoRealNoCenario(scenario, preco) {
  if (scenario == null || typeof scenario !== "object" || preco.valorApi == null) {
    return scenario;
  }
  const s = /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (scenario) });
  const m =
    s.marketplace != null && typeof s.marketplace === "object"
      ? { .../** @type {Record<string, unknown>} */ (s.marketplace) }
      : {};
  m.sale_price_brl = preco.valorApi;
  s.marketplace = m;

  const sx =
    s.sale_xray_pricing != null && typeof s.sale_xray_pricing === "object"
      ? { .../** @type {Record<string, unknown>} */ (s.sale_xray_pricing) }
      : {};
  sx.sale_price_brl = preco.valorApi;
  s.sale_xray_pricing = sx;

  s._pi_preco_real_aplicado = true;
  return s;
}

/**
 * @param {{
 *   tipo: ListingTypeChoice;
 *   baselineScenario: Record<string, unknown>;
 *   preco: { valorApi: string | null };
 *   cenarioApiMl?: Record<string, unknown> | null;
 * }} input
 */
export function montarCenarioListingTypeEstrutural(input) {
  const { tipo, baselineScenario, preco, cenarioApiMl } = input;
  const label = listingTypePillLabel(tipo);

  if (cenarioApiMl != null) {
    const merged = aplicarPrecoRealNoCenario({ ...cenarioApiMl }, preco);
    if (merged != null && typeof merged === "object") {
      return /** @type {Record<string, unknown>} */ ({
        .../** @type {Record<string, unknown>} */ (merged),
        _pi_cenario_estrutural: false,
        _pi_dados_ml_pendentes: false,
      });
    }
  }

  const ic =
    baselineScenario.internal_costs != null && typeof baselineScenario.internal_costs === "object"
      ? { .../** @type {Record<string, unknown>} */ (baselineScenario.internal_costs) }
      : {};

  const precoStr =
    preco.valorApi ??
    (baselineScenario.marketplace != null &&
    typeof baselineScenario.marketplace === "object" &&
    /** @type {Record<string, unknown>} */ (baselineScenario.marketplace).sale_price_brl != null
      ? String(/** @type {Record<string, unknown>} */ (baselineScenario.marketplace).sale_price_brl)
      : "0.00");
  const m = {
    sale_price_brl: precoStr,
    listing_type_label: label === "PREMIUM" ? "Premium" : "Clássico",
  };

  const shell = {
    scenario_id: tipo === "premium" ? "gold_pro" : "gold_special",
    scenario_key: tipo === "premium" ? "gold_pro" : "gold_special",
    scenario_type: "listing_type",
    kind: "listing_type",
    is_baseline: false,
    marketplace: m,
    sale_xray_pricing: {
      sale_price_brl: precoStr,
      fee_type_label: m.listing_type_label,
    },
    result: {},
    internal_costs: ic,
    _pi_cenario_estrutural: true,
    _pi_dados_ml_pendentes: true,
  };

  limparCamposFinanceirosMlPendentes(shell);
  return shell;
}

/**
 * @param {ListingTypeChoice} tipo
 * @param {boolean} dadosMlPendentes
 */
export function avisoRodapeCenarioListingType(tipo, dadosMlPendentes) {
  if (!dadosMlPendentes) return null;
  return tipo === "classic" ? AVISO_DADOS_ML_PENDENTES : AVISO_DADOS_ML_PENDENTES_PREMIUM;
}

/**
 * @param {{
 *   cards: {
 *     type: ListingTypeChoice;
 *     title: string;
 *     scenario: unknown;
 *     group: string;
 *     isAtual: boolean;
 *     papel?: string;
 *     cenarioDisponivel?: boolean;
 *   }[];
 *   baselineRow?: { scenario: unknown; group: string } | null;
 *   preco: { valorApi: string | null };
 * }} input
 */
export function enrichListingTypeCardsComPrecoEstrutural(input) {
  const baselineScenario =
    input.baselineRow?.scenario != null && typeof input.baselineRow.scenario === "object"
      ? /** @type {Record<string, unknown>} */ (input.baselineRow.scenario)
      : null;

  if (baselineScenario == null) return input.cards;

  const premiumCard = input.cards.find((c) => c.type === "premium");
  const cenarioPremiumRef =
    premiumCard?.cenarioDisponivel === true &&
    premiumCard.scenario != null &&
    typeof premiumCard.scenario === "object"
      ? /** @type {Record<string, unknown>} */ (premiumCard.scenario)
      : baselineScenario;

  return input.cards.map((card) => {
    const apiScenario =
      card.scenario != null && typeof card.scenario === "object"
        ? /** @type {Record<string, unknown>} */ (card.scenario)
        : null;
    const temApiMl = card.cenarioDisponivel === true && apiScenario != null;

    let scenario;
    let dadosMlPendentes = !temApiMl;

    if (!temApiMl && card.type === "classic") {
      const espelhado = espelharCenarioListingTypeParaVisual(cenarioPremiumRef, "classic", input.preco);
      scenario = espelhado ?? montarCenarioListingTypeEstrutural({
        tipo: card.type,
        baselineScenario,
        preco: input.preco,
        cenarioApiMl: null,
      });
      dadosMlPendentes = false;
    } else {
      scenario = montarCenarioListingTypeEstrutural({
        tipo: card.type,
        baselineScenario,
        preco: input.preco,
        cenarioApiMl: apiScenario,
      });
    }

    return {
      ...card,
      scenario,
      cenarioDisponivel: temApiMl || card.type === "classic",
      cenarioEstruturalSemMl: dadosMlPendentes,
      avisoRodape: avisoRodapeCenarioListingType(card.type, dadosMlPendentes),
    };
  });
}
