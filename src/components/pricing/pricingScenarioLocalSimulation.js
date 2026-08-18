// ======================================================
// Projeção local de cenário (Precificação Inteligente) — sem API / sem persistência.
// Usa coeficientes extraídos do cenário baseline retornado pelo servidor.
// ======================================================

import { interpretarPrecoUnitarioBrlBruto } from "./precoInicialAnuncioPrecificacao.js";
import { S7_CUSTOS_OPERACIONAIS_LABEL } from "../../utils/s7CustosOperacionaisLabel.js";
import { pickSaleXrayYouReceiveRawString } from "../mercadoLivrePricingScenarioCompareShared.js";

/** @typedef {"classic" | "premium"} ListingTypeChoice */

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parseNumeroBrlApi(raw) {
  if (raw == null) return null;
  const s = String(raw)
    .trim()
    .replace(/[R$r$\s]/g, "")
    .replace(/[^\d,.-]/g, "");
  if (s === "" || s === "-") return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
export function parseNumeroPctApi(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (t === "" || /[,.]$/.test(t)) return null;
  const s = t.replace("%", "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {number} n
 */
export function formatarBrlApiNumero(n) {
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

/**
 * @param {number} n
 */
export function formatarPctApiNumero(n) {
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

/**
 * @param {number} n
 */
export function formatarBrlExibicao(n) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {number} n
 */
export function formatarPctExibicao(n) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/** Percentual em linha secundária (mesmo padrão “Premium 13,50%” da Tarifa de venda). */
export function formatarPctLinhaContingencia(n) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * @param {unknown} scenario
 */
function lerFreteAbsoluto(scenario) {
  const m =
    scenario != null && typeof scenario === "object" && scenario.marketplace != null
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const sx =
    scenario != null && typeof scenario === "object" && scenario.sale_xray_pricing != null
      ? /** @type {Record<string, unknown>} */ (scenario.sale_xray_pricing)
      : {};
  const candidatos = [
    m.shipping_cost_amount_brl,
    m.ml_card_shipping_amount_brl,
    m.ml_card_shipping_brl,
    sx.shipping_cost_amount_brl,
    sx.ml_card_shipping_amount_brl,
  ];
  for (const c of candidatos) {
    const n = parseNumeroBrlApi(c);
    if (n != null && n !== 0) return Math.abs(n);
  }
  return 0;
}

/**
 * @param {unknown} scenario
 */
function lerTarifaAbsoluta(scenario) {
  const m =
    scenario != null && typeof scenario === "object" && scenario.marketplace != null
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const sx =
    scenario != null && typeof scenario === "object" && scenario.sale_xray_pricing != null
      ? /** @type {Record<string, unknown>} */ (scenario.sale_xray_pricing)
      : {};
  const candidatos = [
    m.sale_fee_amount_brl,
    m.charged_fee_net_brl,
    sx.fee_amount_brl,
    sx.charged_fee_net_brl,
  ];
  for (const c of candidatos) {
    const n = parseNumeroBrlApi(c);
    if (n != null && n !== 0) return Math.abs(n);
  }
  return 0;
}

/**
 * @param {unknown} scenario
 */
function lerReceitaLiquida(scenario) {
  if (scenario == null || typeof scenario !== "object") return 0;
  const m =
    scenario.marketplace != null && typeof scenario.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const sx =
    scenario.sale_xray_pricing != null && typeof scenario.sale_xray_pricing === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.sale_xray_pricing)
      : null;
  const pick = pickSaleXrayYouReceiveRawString(m, sx, scenario);
  return parseNumeroBrlApi(pick.raw) ?? 0;
}

/**
 * @param {unknown} scenario
 */
function somarCustosInternos(scenario) {
  const ic =
    scenario != null && typeof scenario === "object" && scenario.internal_costs != null
      ? /** @type {Record<string, unknown>} */ (scenario.internal_costs)
      : {};
  const chaves = ["product_cost_brl", "tax_amount_brl", "operational_packaging_total_brl"];
  let total = 0;
  for (const k of chaves) {
    const n = parseNumeroBrlApi(ic[k]);
    if (n != null) total += Math.abs(n);
  }
  return total;
}

/**
 * @param {unknown} scenario
 */
const coeficientesCenarioVazios = {
  precoVenda: 0,
  tarifa: 0,
  frete: 0,
  voceRecebe: 0,
  custosInternos: 0,
  lucro: 0,
  margem: 0,
  beneficio: 0,
  taxaTarifa: 0,
};

export function extrairCoeficientesCenarioBaseline(scenario) {
  if (scenario == null || typeof scenario !== "object") {
    return { ...coeficientesCenarioVazios };
  }

  const m =
    scenario.marketplace != null && typeof scenario.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const res =
    scenario.result != null && typeof scenario.result === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.result)
      : {};

  // Cenário simulado localmente carrega os coeficientes EXATOS (decimais) em
  // `_simulacao_local`. Quando presentes, usamos esses números direto, evitando
  // tanto a heurística de "centavos" do parser de preço (que dividiria 13500,00
  // por 100) quanto a divergência de formato dos demais parsers de string.
  const simLocal =
    /** @type {Record<string, unknown>} */ (scenario)._simulacao_local != null &&
    typeof (/** @type {Record<string, unknown>} */ (scenario)._simulacao_local) === "object"
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (scenario)._simulacao_local)
      : null;
  const numSim = (/** @type {unknown} */ v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const precoSimulado = simLocal != null ? numSim(simLocal.preco_venda) : null;

  if (simLocal != null && precoSimulado != null && precoSimulado > 0) {
    const precoVenda = precoSimulado;
    const tarifa = Math.abs(numSim(simLocal.tarifa_brl) ?? lerTarifaAbsoluta(scenario));
    const frete = Math.abs(numSim(simLocal.frete_brl) ?? lerFreteAbsoluto(scenario));
    const voceRecebe = numSim(simLocal.voce_recebe_brl) ?? lerReceitaLiquida(scenario);
    const custosInternos = Math.abs(numSim(simLocal.custos_internos_brl) ?? somarCustosInternos(scenario));
    const lucro = numSim(simLocal.lucro_brl) ?? 0;
    const margem =
      numSim(simLocal.margem_pct) ?? (precoVenda > 0 ? (lucro / precoVenda) * 100 : 0);
    const beneficioBruto = voceRecebe - precoVenda + tarifa + frete;
    const voceRecebePlausivel = precoVenda > 0 && voceRecebe > 0 && voceRecebe <= precoVenda;
    const beneficio = voceRecebePlausivel ? beneficioBruto : 0;
    const taxaTarifa = precoVenda > 0 ? tarifa / precoVenda : 0;
    return { precoVenda, tarifa, frete, voceRecebe, custosInternos, lucro, margem, beneficio, taxaTarifa };
  }

  const parsedPreco = interpretarPrecoUnitarioBrlBruto(m.sale_price_brl);
  const precoVenda = parsedPreco.ok ? parsedPreco.valor : 0;
  const tarifa = lerTarifaAbsoluta(scenario);
  const frete = lerFreteAbsoluto(scenario);
  const voceRecebe = lerReceitaLiquida(scenario);
  const custosInternos = somarCustosInternos(scenario);
  const lucro = parseNumeroBrlApi(res.profit_brl) ?? 0;
  const margem = parseNumeroPctApi(res.margin_pct) ?? (precoVenda > 0 ? (lucro / precoVenda) * 100 : 0);

  // Benefício/ajuste fixo do ML (ex.: custo fixo por item) = "Você recebe" − (preço − tarifa − frete).
  // Blindagem da projeção LOCAL: se o baseline trouxer "Você recebe" implausível
  // (agregado, > preço bruto ou <= 0), neutralizamos o benefício para que a simulação
  // use a estrutura preço − tarifa − frete. Não altera o cálculo oficial nem o payload.
  const beneficioBruto = voceRecebe - precoVenda + tarifa + frete;
  const voceRecebePlausivel = precoVenda > 0 && voceRecebe > 0 && voceRecebe <= precoVenda;
  const beneficio = voceRecebePlausivel ? beneficioBruto : 0;
  const taxaTarifa = precoVenda > 0 ? tarifa / precoVenda : 0;

  return {
    precoVenda,
    tarifa,
    frete,
    voceRecebe,
    custosInternos,
    lucro,
    margem,
    beneficio,
    taxaTarifa,
  };
}

/**
 * @param {{
 *   mlAdsEnabled?: boolean;
 *   mlAdsPct?: string;
 *   reserveEnabled?: boolean;
 *   reservePct?: string;
 *   plannedPromoEnabled?: boolean;
 *   plannedPromoPct?: string;
 *   affiliatesEnabled?: boolean;
 *   affiliatesPct?: string;
 * }} params
 */
export function taxaContingenciaTotal(params) {
  let t = 0;
  if (params.mlAdsEnabled) {
    const n = parseNumeroPctApi(params.mlAdsPct);
    if (n != null && n > 0) t += n / 100;
  }
  if (params.reserveEnabled) {
    const n = parseNumeroPctApi(params.reservePct);
    if (n != null && n > 0) t += n / 100;
  }
  return t;
}

/**
 * Reserva estratégica — forma preço ideal; não entra no Raio-X da venda.
 * @param {{
 *   plannedPromoEnabled?: boolean;
 *   plannedPromoPct?: string;
 *   affiliatesEnabled?: boolean;
 *   affiliatesPct?: string;
 * }} params
 */
export function taxaReservaEstrategicaTotal(params) {
  let t = 0;
  if (params.plannedPromoEnabled) {
    const n = parseNumeroPctApi(params.plannedPromoPct);
    if (n != null && n > 0) t += n / 100;
  }
  if (params.affiliatesEnabled) {
    const n = parseNumeroPctApi(params.affiliatesPct);
    if (n != null && n > 0) t += n / 100;
  }
  return t;
}

/**
 * @param {ReturnType<typeof extrairCoeficientesCenarioBaseline>} coef
 * @param {number} precoVenda
 * @param {number} taxaMl
 * @param {number} taxaRes
 * @param {number} taxaPromo
 * @param {number} taxaAffiliates
 */
function projetarPorPrecoVenda(coef, precoVenda, taxaMl, taxaRes, taxaPromo, taxaAffiliates) {
  const tarifa = precoVenda * coef.taxaTarifa;
  const voceRecebe = precoVenda - tarifa - coef.frete + coef.beneficio;
  const mlAdsBrl = precoVenda * taxaMl;
  const reserveBrl = precoVenda * taxaRes;
  const promoBrl = precoVenda * taxaPromo;
  const affiliatesBrl = precoVenda * taxaAffiliates;
  const reservaEstrategicaTotal = promoBrl + affiliatesBrl;
  const contingenciaOperacional = mlAdsBrl + reserveBrl;
  const contingenciaTotal = contingenciaOperacional + reservaEstrategicaTotal;
  const lucro = voceRecebe - coef.custosInternos - contingenciaTotal;
  const margem = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;
  return {
    precoVenda,
    tarifa,
    frete: coef.frete,
    voceRecebe,
    custosInternos: coef.custosInternos,
    contingenciaTotal,
    contingenciaOperacional,
    reservaEstrategicaTotal,
    mlAdsBrl,
    reserveBrl,
    promoBrl,
    affiliatesBrl,
    lucro,
    margem,
  };
}

/**
 * @param {ReturnType<typeof extrairCoeficientesCenarioBaseline>} coef
 * @param {number} margemPct
 * @param {number} taxaMl
 * @param {number} taxaRes
 * @param {number} taxaPromo
 * @param {number} taxaAffiliates
 */
function projetarPorMargem(coef, margemPct, taxaMl, taxaRes, taxaPromo, taxaAffiliates) {
  const m = margemPct / 100;
  const taxaContingencia = taxaMl + taxaRes + taxaPromo + taxaAffiliates;
  const denom = m - 1 + coef.taxaTarifa + taxaContingencia;
  const numer = -coef.frete + coef.beneficio - coef.custosInternos;
  if (Math.abs(denom) < 1e-8) return null;
  const precoVenda = numer / denom;
  // Sem teto artificial: a margem desejada recalcula o preço em tempo real
  // para qualquer preço válido (> 0). Mantém apenas a validação de positividade.
  if (!Number.isFinite(precoVenda) || precoVenda <= 0) return null;
  return projetarPorPrecoVenda(coef, precoVenda, taxaMl, taxaRes, taxaPromo, taxaAffiliates);
}

/**
 * @param {unknown} scenarioBase
 * @param {{
 *   precoVenda?: number | null;
 *   margemPct?: number | null;
 *   origemEdicao?: "preco" | "margem";
 *   configuracaoFinanceira?: {
 *     mlAdsEnabled?: boolean;
 *     mlAdsPct?: string;
 *     reserveEnabled?: boolean;
 *     reservePct?: string;
 *     plannedPromoEnabled?: boolean;
 *     plannedPromoPct?: string;
 *     plannedPromoLabel?: string;
 *     affiliatesEnabled?: boolean;
 *     affiliatesPct?: string;
 *     affiliatesLabel?: string;
 *   };
 * }} opts
 */
export function projetarCenarioPrecificacaoLocal(scenarioBase, opts = {}) {
  if (scenarioBase == null || typeof scenarioBase !== "object") return scenarioBase;
  const coef = extrairCoeficientesCenarioBaseline(scenarioBase);
  const cfg = opts.configuracaoFinanceira ?? {};
  const taxaMl = taxaContingenciaTotal({
    mlAdsEnabled: cfg.mlAdsEnabled,
    mlAdsPct: cfg.mlAdsPct,
    reserveEnabled: false,
    reservePct: "0",
  });
  const taxaRes = taxaContingenciaTotal({
    mlAdsEnabled: false,
    mlAdsPct: "0",
    reserveEnabled: cfg.reserveEnabled,
    reservePct: cfg.reservePct,
  });
  const taxaPromo = cfg.plannedPromoEnabled
    ? taxaReservaEstrategicaTotal({ plannedPromoEnabled: true, plannedPromoPct: cfg.plannedPromoPct })
    : 0;
  const taxaAffiliates = cfg.affiliatesEnabled
    ? taxaReservaEstrategicaTotal({ affiliatesEnabled: true, affiliatesPct: cfg.affiliatesPct })
    : 0;
  let proj = null;
  if (opts.origemEdicao === "margem" && opts.margemPct != null && Number.isFinite(opts.margemPct)) {
    proj = projetarPorMargem(coef, opts.margemPct, taxaMl, taxaRes, taxaPromo, taxaAffiliates);
  } else if (opts.precoVenda != null && Number.isFinite(opts.precoVenda)) {
    proj = projetarPorPrecoVenda(coef, opts.precoVenda, taxaMl, taxaRes, taxaPromo, taxaAffiliates);
  }

  if (proj == null) return scenarioBase;

  const mlAdsBrl = cfg.mlAdsEnabled && proj.mlAdsBrl > 0 ? proj.mlAdsBrl : null;
  const reserveBrl = cfg.reserveEnabled && proj.reserveBrl > 0 ? proj.reserveBrl : null;
  const promoBrl = cfg.plannedPromoEnabled && proj.promoBrl > 0 ? proj.promoBrl : null;
  const affiliatesBrl = cfg.affiliatesEnabled && proj.affiliatesBrl > 0 ? proj.affiliatesBrl : null;

  const base = /** @type {Record<string, unknown>} */ (scenarioBase);
  const m0 =
    base.marketplace != null && typeof base.marketplace === "object"
      ? { .../** @type {Record<string, unknown>} */ (base.marketplace) }
      : {};
  const r0 =
    base.result != null && typeof base.result === "object"
      ? { .../** @type {Record<string, unknown>} */ (base.result) }
      : {};
  const sx0 =
    base.sale_xray_pricing != null && typeof base.sale_xray_pricing === "object"
      ? { .../** @type {Record<string, unknown>} */ (base.sale_xray_pricing) }
      : null;

  const precoStr = formatarBrlApiNumero(proj.precoVenda);
  const tarifaNeg = -Math.abs(proj.tarifa);
  const tarifaStr = formatarBrlApiNumero(tarifaNeg);
  const voceRecebeStr = formatarBrlApiNumero(proj.voceRecebe);

  // Atualiza TODOS os campos lidos pelo Raio-X para manter a simulação consistente
  // (preço de venda, tarifa e "Você recebe"), incluindo os campos do card ML.
  m0.sale_price_brl = precoStr;
  m0.sale_fee_amount_brl = tarifaStr;
  m0.charged_fee_net_brl = tarifaStr;
  m0.fee_amount_brl = tarifaStr;
  m0.marketplace_payout_amount_brl = voceRecebeStr;
  m0.ml_card_payout_amount_brl = voceRecebeStr;
  m0.ml_card_payout_brl = voceRecebeStr;
  m0.net_receivable_brl = voceRecebeStr;

  if (sx0 != null) {
    sx0.sale_price_brl = precoStr;
    sx0.charged_fee_net_brl = tarifaStr;
    sx0.fee_amount_brl = tarifaStr;
    sx0.marketplace_payout_amount_brl = voceRecebeStr;
    sx0.ml_card_payout_amount_brl = voceRecebeStr;
    sx0.ml_card_payout_brl = voceRecebeStr;
    sx0.net_receivable_brl = voceRecebeStr;
  }

  r0.profit_brl = formatarBrlApiNumero(proj.lucro);
  r0.margin_pct = formatarPctApiNumero(proj.margem);

  return {
    ...base,
    marketplace: m0,
    result: r0,
    ...(sx0 != null ? { sale_xray_pricing: sx0 } : {}),
    _simulacao_local: {
      preco_venda: proj.precoVenda,
      margem_pct: proj.margem,
      lucro_brl: proj.lucro,
      voce_recebe_brl: proj.voceRecebe,
      // Coeficientes exatos da projeção — relidos diretamente por
      // extrairCoeficientesCenarioBaseline, sem passar pelos parsers de string
      // (evita qualquer divergência de escala/formato no round-trip).
      tarifa_brl: proj.tarifa,
      frete_brl: proj.frete,
      custos_internos_brl: proj.custosInternos,
      ml_ads_brl: mlAdsBrl,
      reserve_brl: reserveBrl,
      promo_brl: promoBrl,
      affiliates_brl: affiliatesBrl,
    },
  };
}

/**
 * Preço unitário de venda para contingência — nunca faturamento agregado.
 * @param {unknown} scenario
 * @param {number | null | undefined} precoUnitarioOverride
 */
function resolverPrecoUnitarioContingencia(scenario, precoUnitarioOverride) {
  if (precoUnitarioOverride != null && Number.isFinite(precoUnitarioOverride) && precoUnitarioOverride > 0) {
    return precoUnitarioOverride;
  }

  const sim =
    scenario != null &&
    typeof scenario === "object" &&
    /** @type {Record<string, unknown>} */ (scenario)._simulacao_local != null &&
    typeof /** @type {Record<string, unknown>} */ (scenario)._simulacao_local === "object"
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (scenario)._simulacao_local)
      : null;
  if (sim?.preco_venda != null) {
    const n = Number(sim.preco_venda);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const m =
    scenario != null && typeof scenario === "object" && scenario.marketplace != null
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : {};
  const candidatos = [m.sale_price_brl];
  const sx =
    scenario != null && typeof scenario === "object" && scenario.sale_xray_pricing != null
      ? /** @type {Record<string, unknown>} */ (scenario.sale_xray_pricing)
      : null;
  if (sx?.sale_price_brl != null) candidatos.push(sx.sale_price_brl);

  for (const raw of candidatos) {
    const parsed = interpretarPrecoUnitarioBrlBruto(raw);
    if (parsed.ok) return parsed.valor;
  }

  const coef = extrairCoeficientesCenarioBaseline(scenario);
  return coef.precoVenda > 0 ? coef.precoVenda : 0;
}

/**
 * @param {{
 *   label: string;
 *   enabled?: boolean;
 *   pctRaw?: string;
 *   preco: number;
 *   exibirInativa?: boolean;
 * }} params
 * @returns {{ label: string; subtitlePct: string | null; amountBrl: string; ativo: boolean } | null}
 */
function montarLinhaParametroSimulacao({ label, enabled, pctRaw, preco, exibirInativa }) {
  const ativo = enabled === true;
  if (!ativo && !exibirInativa) return null;

  const pct = ativo ? (parseNumeroPctApi(pctRaw) ?? 0) : 0;
  const brl = preco > 0 && pct > 0 ? (preco * pct) / 100 : 0;

  return {
    label,
    subtitlePct: exibirInativa
      ? formatarPctLinhaContingencia(ativo ? pct : 0)
      : ativo && pct > 0
        ? formatarPctLinhaContingencia(pct)
        : null,
    amountBrl: formatarBrlExibicao(-Math.abs(brl)),
    ativo,
  };
}

/**
 * @param {unknown} scenario
 * @param {{
 *   mlAdsEnabled?: boolean;
 *   mlAdsPct?: string;
 *   mlAdsLabel?: string;
 *   reserveEnabled?: boolean;
 *   reservePct?: string;
 *   reserveLabel?: string;
 *   precoUnitarioBrl?: number | null;
 *   exibirLinhasInativas?: boolean;
 * }} cfg
 * @returns {{ lines: { label: string; subtitlePct: string | null; amountBrl: string; ativo: boolean }[]; hasBlock: boolean }}
 */
export function montarLinhasMargemContingencia(scenario, cfg) {
  if (scenario == null || typeof scenario !== "object") {
    return { lines: [], hasBlock: false };
  }

  const preco = resolverPrecoUnitarioContingencia(scenario, cfg.precoUnitarioBrl);
  const exibirInativas = cfg.exibirLinhasInativas === true;

  /** @type {{ label: string; subtitlePct: string | null; amountBrl: string; ativo: boolean }[]} */
  const lines = [];

  const linhaMlAds = montarLinhaParametroSimulacao({
    label:
      cfg.mlAdsLabel != null && String(cfg.mlAdsLabel).trim() !== "" ? String(cfg.mlAdsLabel).trim() : "ML Ads",
    enabled: cfg.mlAdsEnabled,
    pctRaw: cfg.mlAdsPct,
    preco,
    exibirInativa: exibirInativas,
  });
  if (linhaMlAds) lines.push(linhaMlAds);

  const linhaCustosOperacionais = montarLinhaParametroSimulacao({
    label:
      cfg.reserveLabel != null && String(cfg.reserveLabel).trim() !== ""
        ? String(cfg.reserveLabel).trim()
        : S7_CUSTOS_OPERACIONAIS_LABEL,
    enabled: cfg.reserveEnabled,
    pctRaw: cfg.reservePct,
    preco,
    exibirInativa: exibirInativas,
  });
  if (linhaCustosOperacionais) lines.push(linhaCustosOperacionais);

  return { lines, hasBlock: lines.length > 0 };
}

/**
 * Linhas de reserva estratégica — só na simulação da Precificação Inteligente (não Raio-X).
 * @param {unknown} scenario
 * @param {{
 *   plannedPromoEnabled?: boolean;
 *   plannedPromoPct?: string;
 *   plannedPromoLabel?: string;
 *   affiliatesEnabled?: boolean;
 *   affiliatesPct?: string;
 *   affiliatesLabel?: string;
 *   precoUnitarioBrl?: number | null;
 *   exibirLinhasInativas?: boolean;
 * }} cfg
 * @returns {{ lines: { label: string; subtitlePct: string | null; amountBrl: string; ativo: boolean }[]; hasBlock: boolean }}
 */
export function montarLinhasReservaEstrategica(scenario, cfg) {
  if (scenario == null || typeof scenario !== "object") {
    return { lines: [], hasBlock: false };
  }

  const preco = resolverPrecoUnitarioContingencia(scenario, cfg.precoUnitarioBrl);
  const exibirInativas = cfg.exibirLinhasInativas === true;

  /** @type {{ label: string; subtitlePct: string | null; amountBrl: string; ativo: boolean }[]} */
  const lines = [];

  const linhaPromocao = montarLinhaParametroSimulacao({
    label:
      cfg.plannedPromoLabel != null && String(cfg.plannedPromoLabel).trim() !== ""
        ? String(cfg.plannedPromoLabel).trim()
        : "Promoção",
    enabled: cfg.plannedPromoEnabled,
    pctRaw: cfg.plannedPromoPct,
    preco,
    exibirInativa: exibirInativas,
  });
  if (linhaPromocao) lines.push(linhaPromocao);

  const linhaAfiliados = montarLinhaParametroSimulacao({
    label:
      cfg.affiliatesLabel != null && String(cfg.affiliatesLabel).trim() !== ""
        ? String(cfg.affiliatesLabel).trim()
        : "Afiliados",
    enabled: cfg.affiliatesEnabled,
    pctRaw: cfg.affiliatesPct,
    preco,
    exibirInativa: exibirInativas,
  });
  if (linhaAfiliados) lines.push(linhaAfiliados);

  return { lines, hasBlock: lines.length > 0 };
}
