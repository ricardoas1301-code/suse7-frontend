// ======================================================
// KPIs do comparativo Clássico × Premium (Precificação Inteligente).
// ======================================================

import { resolveVoceRecebeExibicaoRaw } from "../mercadoLivrePricingScenarioCompareShared.js";

const DASH = "—";

/**
 * @param {unknown} raw
 */
function formatarBrlExibicaoApi(raw) {
  if (raw == null || String(raw).trim() === "") return DASH;
  const n = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) return String(raw);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * @param {unknown} scenario
 */
function lerLucroLiquido(scenario) {
  if (scenario == null || typeof scenario !== "object") return { texto: DASH, valor: null };
  const res =
    /** @type {Record<string, unknown>} */ (scenario).result != null &&
    typeof /** @type {Record<string, unknown>} */ (scenario).result === "object"
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (scenario).result)
      : null;
  const raw = res?.profit_brl;
  if (raw == null || String(raw).trim() === "") return { texto: DASH, valor: null };
  return { texto: formatarBrlExibicaoApi(raw), valor: Number(String(raw).replace(",", ".")) };
}

/**
 * @param {unknown} scenario
 */
function lerMargemPct(scenario) {
  if (scenario == null || typeof scenario !== "object") return { texto: DASH, valor: null };
  const res =
    /** @type {Record<string, unknown>} */ (scenario).result != null &&
    typeof /** @type {Record<string, unknown>} */ (scenario).result === "object"
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (scenario).result)
      : null;
  const raw = res?.margin_pct;
  if (raw == null || String(raw).trim() === "") return { texto: DASH, valor: null };
  const n = Number(String(raw).replace(",", ".").replace("%", ""));
  const texto = Number.isFinite(n) ? `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %` : DASH;
  return { texto, valor: Number.isFinite(n) ? n : null };
}

/**
 * @param {unknown} scenario
 */
function lerVoceRecebe(scenario) {
  if (scenario == null || typeof scenario !== "object") return { texto: DASH, valor: null };
  const s = /** @type {Record<string, unknown>} */ (scenario);
  const m =
    s.marketplace != null && typeof s.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (s.marketplace)
      : {};
  const sx =
    s.sale_xray_pricing != null && typeof s.sale_xray_pricing === "object"
      ? /** @type {Record<string, unknown>} */ (s.sale_xray_pricing)
      : null;
  const pick = resolveVoceRecebeExibicaoRaw(m, sx, s);
  if (pick.raw == null || String(pick.raw).trim() === "") return { texto: DASH, valor: null };
  return { texto: formatarBrlExibicaoApi(pick.raw), valor: Number(String(pick.raw).replace(",", ".")) };
}

export const METRICAS_GRAFICO_LISTING_TYPE = [
  { id: "lucro", titulo: "Lucro", ler: lerLucroLiquido },
  { id: "margem", titulo: "Margem %", ler: lerMargemPct },
  { id: "recebe", titulo: "Você recebe", ler: lerVoceRecebe },
];

/**
 * Escala simétrica com zero (mesma régua do gráfico ML).
 * @param {(number | null)[]} valores
 */
export function escalaSimetricaListingType(valores) {
  const nums = valores.filter((v) => v != null && Number.isFinite(v));
  if (nums.length === 0) {
    return { min: 0, max: 1, span: 1, zeroFromBottomPct: 50 };
  }

  const temPositivo = nums.some((n) => n > 0);
  const temNegativo = nums.some((n) => n < 0);

  let minV = Math.min(0, .../** @type {number[]} */ (nums));
  let maxV = Math.max(0, .../** @type {number[]} */ (nums));

  /* Sinais mistos: zero proporcional entre lucro e prejuízo reais (ex.: +51,61 / −49,16). */
  if (temPositivo && temNegativo) {
    minV = Math.min(.../** @type {number[]} */ (nums));
    maxV = Math.max(.../** @type {number[]} */ (nums));
  } else if (temNegativo && !temPositivo) {
    minV = Math.min(.../** @type {number[]} */ (nums));
    maxV = 0;
  } else {
    minV = 0;
    maxV = Math.max(.../** @type {number[]} */ (nums));
  }

  const span = maxV - minV > 0 ? maxV - minV : 1;
  return {
    min: minV,
    max: maxV,
    span,
    zeroFromBottomPct: ((0 - minV) / span) * 100,
  };
}

/**
 * Geometria visual com baseline fixa na base inferior (linha tracejada dos rótulos).
 * Não altera valores exibidos — só posicionamento das barras.
 * @param {number | null} valor
 * @param {ReturnType<typeof escalaSimetricaListingType>} escala
 */
export function geometriaBarraListingTypeBaseInferior(valor, escala) {
  const maxAbs = Math.max(Math.abs(escala.min), Math.abs(escala.max), 1);

  if (valor == null || !Number.isFinite(valor)) {
    return {
      magnetBottomPct: 0,
      magnetHeightPct: 3,
      growClass: "s7-ml-scenario-chart__bar-fill-inner--grow-up",
      isNegative: false,
      ancoraBaseInferior: true,
    };
  }

  const magnitudePct = (Math.abs(valor) / maxAbs) * 100;
  const magnetHeightPct = Math.max(magnitudePct, valor === 0 ? 2 : 4);
  const isNegative = valor < 0;

  return {
    magnetBottomPct: 0,
    magnetHeightPct,
    growClass: isNegative
      ? "s7-ml-scenario-chart__bar-fill-inner--grow-down"
      : "s7-ml-scenario-chart__bar-fill-inner--grow-up",
    isNegative,
    ancoraBaseInferior: true,
  };
}

/**
 * Geometria da barra (% da trilha) — positivo sobe, negativo desce.
 * @param {number | null} valor
 * @param {ReturnType<typeof escalaSimetricaListingType>} escala
 */
export function geometriaBarraListingType(valor, escala) {
  const { min, span, zeroFromBottomPct } = escala;
  const spanSafe = span > 0 ? span : 1;

  if (valor == null || !Number.isFinite(valor)) {
    return {
      magnetBottomPct: zeroFromBottomPct,
      magnetHeightPct: 2,
      growClass: "s7-ml-scenario-chart__bar-fill-inner--grow-up",
      isNegative: false,
    };
  }

  const vPct = ((valor - min) / spanSafe) * 100;
  const isNegative = valor < 0;
  const low = Math.min(zeroFromBottomPct, vPct);
  const high = Math.max(zeroFromBottomPct, vPct);
  const growClass = isNegative
    ? "s7-ml-scenario-chart__bar-fill-inner--grow-down"
    : "s7-ml-scenario-chart__bar-fill-inner--grow-up";

  return {
    magnetBottomPct: low,
    magnetHeightPct: Math.max(high - low, valor === 0 ? 2 : 4),
    growClass,
    isNegative,
  };
}
