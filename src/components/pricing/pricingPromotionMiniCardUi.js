// ======================================================
// PI — Promoções: normalização visual dos mini cards (padrão ML).
// Somente apresentação — adapter Mercado Livre; componentes consomem campos normalizados.
// ======================================================

import Decimal from "decimal.js";

import {
  cardHeadingLabel,
  resolveRaioxCardVigenciaLine,
} from "../mercadoLivrePricingScenarioCompareShared.js";
import { interpretarPrecoUnitarioBrlBruto } from "./precoInicialAnuncioPrecificacao.js";
import { obterContratoPrecoMiniCardPromocao } from "./pricingPromotionCardContract.js";
import { formatarBrlExibicao } from "./pricingScenarioLocalSimulation.js";
import { resolvePromotionOfficialFinalPrice } from "../../features/pricing/promotions/resolvePromotionOfficialFinalPrice.js";

const SEM_DATA_INFORMADA = "SEM DATA INFORMADA";
const POR_TEMPO_LIMITADO = "POR TEMPO LIMITADO";
export const OFERTA_RELAMPAGO_LABEL = "Oferta relâmpago";

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function parseContagemInteira(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (value == null) return null;
  const s = String(value).trim();
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * @param {Record<string, unknown>} src
 * @param {string[]} keys
 * @returns {number | null}
 */
function pickContagem(src, keys) {
  for (const key of keys) {
    const n = parseContagemInteira(src[key]);
    if (n != null) return n;
  }
  return null;
}

/**
 * @param {unknown} scenario
 * @returns {Record<string, unknown>[]}
 */
function fontesPromocaoScenario(scenario) {
  if (scenario == null || typeof scenario !== "object") return [];
  const r = /** @type {Record<string, unknown>} */ (scenario);
  /** @type {Record<string, unknown>[]} */
  const out = [r];

  if (r.promotion != null && typeof r.promotion === "object") {
    out.push(/** @type {Record<string, unknown>} */ (r.promotion));
  }
  if (r.sale_xray_pricing != null && typeof r.sale_xray_pricing === "object") {
    out.push(/** @type {Record<string, unknown>} */ (r.sale_xray_pricing));
  }
  if (r.ml_financial_audit != null && typeof r.ml_financial_audit === "object") {
    out.push(/** @type {Record<string, unknown>} */ (r.ml_financial_audit));
  }
  if (r.raw_json != null && typeof r.raw_json === "object") {
    const raw = /** @type {Record<string, unknown>} */ (r.raw_json);
    out.push(raw);
    if (raw._suse7_seller_promotion_details != null && typeof raw._suse7_seller_promotion_details === "object") {
      out.push(/** @type {Record<string, unknown>} */ (raw._suse7_seller_promotion_details));
    }
  }

  return out;
}

/**
 * @param {string} nome
 * @returns {boolean}
 */
function ehNomeTokenLightning(nome) {
  const normalized = nome
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (normalized === "lightning") return true;
  if (normalized === "lightning deal") return true;
  if (normalized === "deal lightning") return true;
  return false;
}

/**
 * Traduz tokens lightning para rótulo pt-BR — somente camada UI.
 *
 * @param {unknown} scenario
 * @param {boolean} [isRelampago=false]
 * @returns {string}
 */
export function normalizarNomePromocaoExibicaoUi(scenario, isRelampago = false) {
  const raw = cardHeadingLabel(scenario);
  const nome = raw != null && String(raw).trim() !== "" ? String(raw).trim() : "Promoção";
  const lc = nome.toLowerCase();
  if (lc.includes("oferta relâmpago") || lc.includes("oferta relampago")) return nome;
  if (ehNomeTokenLightning(nome)) return OFERTA_RELAMPAGO_LABEL;

  if (scenario != null && typeof scenario === "object") {
    const r = /** @type {Record<string, unknown>} */ (scenario);
    const typeRaw = r.promotion_type ?? r.scenario_type ?? null;
    if (typeRaw != null && ehNomeTokenLightning(String(typeRaw)) && nome === String(typeRaw).trim()) {
      return OFERTA_RELAMPAGO_LABEL;
    }
  }

  if (isRelampago && ehNomeTokenLightning(nome)) return OFERTA_RELAMPAGO_LABEL;
  return nome;
}

/**
 * @param {string | null | undefined} iso
 * @returns {string | null}
 */
function formatarParteDataMlUpper(iso) {
  if (iso == null || String(iso).trim() === "") return null;
  const t = Date.parse(String(iso));
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const dia = d.getDate();
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" })
    .format(d)
    .toUpperCase()
    .replace(/\.$/, "");
  return `${dia} DE ${mes}`;
}

/**
 * @param {string | null | undefined} startIso
 * @param {string | null | undefined} endIso
 * @returns {string | null}
 */
function formatarPeriodoMlUpperFromIso(startIso, endIso) {
  const inicio = startIso ? formatarParteDataMlUpper(startIso) : null;
  const fim = endIso ? formatarParteDataMlUpper(endIso) : null;
  if (inicio && fim) return `DE ${inicio} A ${fim}`;
  if (inicio) return `DE ${inicio}`;
  if (fim) return `ATÉ ${fim}`;
  return null;
}

/**
 * @param {Record<string, unknown>} r
 * @returns {{ startRaw: string; endRaw: string }}
 */
function pickDatasPromocao(r) {
  const contract =
    r.promotion_offer_contract != null && typeof r.promotion_offer_contract === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion_offer_contract)
      : null;
  const pick = (...vals) => {
    for (const v of vals) {
      if (v == null) continue;
      const s = String(v).trim();
      if (s !== "") return s;
    }
    return "";
  };
  const prom =
    r.promotion != null && typeof r.promotion === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion)
      : null;
  const startRaw = pick(
    contract?.start_date,
    r.starts_at,
    r.promotion_start_date,
    r.start_date,
    r.date_from,
    prom?.promotion_start_date,
    prom?.start_date,
    prom?.date_from,
  );
  const endRaw = pick(
    contract?.end_date,
    r.ends_at,
    r.promotion_end_date,
    r.finish_date,
    r.end_date,
    r.date_to,
    prom?.promotion_end_date,
    prom?.finish_date,
    prom?.end_date,
    prom?.date_to,
  );
  return { startRaw, endRaw };
}

/**
 * @param {string} line
 * @returns {string}
 */
function normalizarTextoPeriodoUpper(line) {
  const t = line.trim();
  if (t === "") return SEM_DATA_INFORMADA;
  const lc = t.toLowerCase();
  if (lc === "sem data informada") return SEM_DATA_INFORMADA;
  if (lc.includes("tempo limitado")) return POR_TEMPO_LIMITADO;
  if (/^de\s/i.test(t)) return t.toLocaleUpperCase("pt-BR");
  if (/\s+a\s+/i.test(t)) {
    const parts = t.split(/\s+a\s+/i);
    if (parts.length === 2) {
      const a = parts[0].trim();
      const b = parts[1].trim();
      return `DE ${a.toLocaleUpperCase("pt-BR")} A ${b.toLocaleUpperCase("pt-BR")}`;
    }
  }
  return t.toLocaleUpperCase("pt-BR");
}

/**
 * @param {unknown} scenario
 * @param {boolean} isRelampago
 * @returns {string}
 */
export function resolverPeriodoMiniCardPromocao(scenario, isRelampago = false) {
  if (scenario == null || typeof scenario !== "object") {
    return isRelampago ? POR_TEMPO_LIMITADO : SEM_DATA_INFORMADA;
  }
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const { startRaw, endRaw } = pickDatasPromocao(r);
  const fromIso = formatarPeriodoMlUpperFromIso(startRaw || null, endRaw || null);
  if (fromIso) return fromIso;

  const vigencia = resolveRaioxCardVigenciaLine(scenario);
  const line = vigencia.line != null ? String(vigencia.line).trim() : "";
  if (line !== "") {
    return normalizarTextoPeriodoUpper(line);
  }

  if (isRelampago) return POR_TEMPO_LIMITADO;
  return SEM_DATA_INFORMADA;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function flagRelampagoTruthy(value) {
  if (value === true || value === 1) return true;
  const s = value != null ? String(value).trim().toLowerCase() : "";
  return s === "true" || s === "1" || s === "yes";
}

/**
 * @param {unknown} typeValue
 * @returns {boolean}
 */
function tipoIndicaRelampago(typeValue) {
  const s = typeValue != null ? String(typeValue).trim().toLowerCase() : "";
  if (s === "") return false;
  return (
    s.includes("lightning") ||
    s.includes("relampago") ||
    s.includes("relâmpago") ||
    s.includes("flash_deal") ||
    s.includes("flash-deal") ||
    s === "lightning" ||
    s === "deal_lightning"
  );
}

/**
 * @param {unknown} scenario
 * @returns {boolean}
 */
export function resolverPromocaoRelampago(scenario) {
  if (scenario == null || typeof scenario !== "object") return false;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const prom =
    r.promotion != null && typeof r.promotion === "object"
      ? /** @type {Record<string, unknown>} */ (r.promotion)
      : null;

  const flagKeys = ["is_lightning", "lightning", "isLightning", "lightning_deal", "is_lightning_deal"];
  for (const src of [r, prom]) {
    if (!src) continue;
    for (const key of flagKeys) {
      if (flagRelampagoTruthy(src[key])) return true;
    }
  }

  const typeKeys = ["promotion_type", "scenario_type", "sub_type", "deal_type", "campaign_type", "type"];
  for (const src of [r, prom]) {
    if (!src) continue;
    for (const key of typeKeys) {
      if (tipoIndicaRelampago(src[key])) return true;
    }
  }

  const nome = cardHeadingLabel(scenario).toLowerCase();
  if (nome.includes("relâmpago") || nome.includes("relampago") || nome.includes("oferta relâmpago")) {
    return true;
  }
  if (ehNomeTokenLightning(cardHeadingLabel(scenario))) return true;

  return false;
}

const ELEGIVEIS_KEYS = [
  "eligible_count",
  "eligible_items_count",
  "items_eligible",
  "eligible_quantity",
  "eligible_listings_count",
  "eligibleCount",
  "elegiveis_count",
  "candidates_count",
  "total_eligible",
];

const PARTICIPANDO_KEYS = [
  "participating_count",
  "participating_items_count",
  "items_participating",
  "participation_count",
  "participating_listings_count",
  "participatingCount",
  "participando_count",
  "enrolled_count",
  "selected_count",
  "total_participating",
];

/**
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function resolverElegibilidadeMiniCardPromocao(scenario) {
  const fontes = fontesPromocaoScenario(scenario);
  if (fontes.length === 0) return null;

  let elegiveis = null;
  let participando = null;

  for (const src of fontes) {
    if (elegiveis == null) elegiveis = pickContagem(src, ELEGIVEIS_KEYS);
    if (participando == null) participando = pickContagem(src, PARTICIPANDO_KEYS);
  }

  if (elegiveis != null && participando != null) {
    return `${elegiveis} elegíveis | ${participando} participando`;
  }
  if (elegiveis != null) return `${elegiveis} elegíveis`;
  if (participando != null) return `${participando} participando`;

  const textKeys = [
    "eligibility_text",
    "eligibility_summary",
    "eligibility_label",
    "participation_hint",
    "participation_deadline_label",
    "deadline_text",
  ];
  for (const src of fontes) {
    for (const key of textKeys) {
      const v = src[key];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
  }

  return null;
}

/**
 * Parse percentual de promoção vindo da API (ponto decimal: "12.00", "12.5").
 * Não usar parseNumeroBrlApi — ele trata ponto como separador de milhar.
 *
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
export function parsePercentualPromocaoApiDecimal(raw) {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return null;
    try {
      const dec = new Decimal(raw);
      return dec.lte(0) ? null : dec;
    } catch {
      return null;
    }
  }

  let s = String(raw).trim();
  if (s === "" || /[,.]$/.test(s)) return null;
  s = s.replace(/%/g, "").trim();
  if (s === "") return null;

  if (s.includes(",") && !s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",") && s.includes(".")) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  }

  try {
    const dec = new Decimal(s);
    if (!dec.isFinite() || dec.lte(0)) return null;
    return dec;
  } catch {
    return null;
  }
}

/**
 * @param {Decimal} dec
 * @returns {Decimal}
 */
export function normalizarPercentualPromocaoExibicao(dec) {
  if (dec.lt(1)) {
    const scaled = dec.times(100);
    if (scaled.gte(1) && scaled.lte(95)) return scaled;
  }
  return dec;
}

/**
 * @param {Decimal} dec — percentual já normalizado (ex.: 12, 12.5)
 * @returns {string}
 */
export function formatarPercentualPromocaoPtBr(dec) {
  const arredondado = dec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const valor = arredondado.toNumber();
  if (arredondado.mod(1).eq(0)) {
    return String(Math.round(valor));
  }
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

/**
 * @param {unknown} scenario
 * @returns {Record<string, unknown> | null}
 */
function obterContratoPromocaoCanonica(scenario) {
  return obterContratoPrecoMiniCardPromocao(scenario);
}

/** @param {unknown} scenario */
function resolverDescontoDerivadoDoPrecoFinal(scenario) {
  const contract = obterContratoPromocaoCanonica(scenario);
  if (contract?.original_price_brl == null) return null;
  const originalParsed = interpretarPrecoUnitarioBrlBruto(contract.original_price_brl);
  const finalBrl = resolvePromotionOfficialFinalPrice({ scenario }).final_price_brl;
  const finalParsed = finalBrl != null ? interpretarPrecoUnitarioBrlBruto(finalBrl) : null;
  if (!originalParsed.ok || finalParsed == null || !finalParsed.ok) return null;
  try {
    const original = new Decimal(originalParsed.valor);
    const final = new Decimal(finalParsed.valor);
    if (!original.gt(final)) return null;
    const amount = original.minus(final).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const percent = amount.div(original).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    if (!amount.gt(0) || !percent.gt(0)) return null;
    return { amount, percent };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} scenario
 * @returns {Decimal | null}
 */
export function resolverPercentualDescontoPromocaoNormalizado(scenario) {
  if (scenario == null || typeof scenario !== "object") return null;
  const derivado = resolverDescontoDerivadoDoPrecoFinal(scenario);
  if (derivado?.percent != null && derivado.percent.gt(0) && derivado.percent.lte(100)) {
    return derivado.percent;
  }
  const contract = obterContratoPromocaoCanonica(scenario);
  const brutoExibicao = contract?.discount_percent_display;
  if (brutoExibicao == null || String(brutoExibicao).trim() === "") {
    if (import.meta.env.DEV && contract != null) {
      console.warn("[S7_PI_PROMO_UI] discount_percent_display ausente no contrato canônico", {
        promotion_id: contract.promotion_id ?? null,
        promotion_name: contract.promotion_name ?? null,
        source_warnings: contract.source_warnings ?? null,
      });
    }
    return null;
  }
  const parsed = parsePercentualPromocaoApiDecimal(brutoExibicao);
  if (parsed == null) return null;
  const normalizado = normalizarPercentualPromocaoExibicao(parsed);
  if (normalizado.gt(0) && normalizado.lte(100)) return normalizado;
  return null;
}

/**
 * Rótulo de desconto para mini cards — ex.: "Desconto de 12%".
 *
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function resolverRotuloDescontoMiniCardPromocao(scenario) {
  const pct = resolverPercentualDescontoPromocaoNormalizado(scenario);
  if (pct == null) return null;
  return `Desconto de ${formatarPercentualPromocaoPtBr(pct)}%`;
}

/**
 * Rótulo de desconto em R$ para mini cards — ex.: "R$ 44,99 de desconto".
 *
 * @param {unknown} scenario
 * @returns {string | null}
 */
export function resolverRotuloDescontoReaisMiniCardPromocao(scenario) {
  const derivado = resolverDescontoDerivadoDoPrecoFinal(scenario);
  if (derivado?.amount != null && derivado.amount.gt(0)) {
    return `${formatarBrlExibicao(Number(derivado.amount.toFixed(2)))} de desconto`;
  }
  const contract = obterContratoPromocaoCanonica(scenario);
  const bruto = contract?.discount_amount_brl;
  if (bruto == null || String(bruto).trim() === "") return null;
  const parsed = interpretarPrecoUnitarioBrlBruto(bruto);
  if (!parsed.ok || !(parsed.valor > 0)) return null;
  return `${formatarBrlExibicao(parsed.valor)} de desconto`;
}
