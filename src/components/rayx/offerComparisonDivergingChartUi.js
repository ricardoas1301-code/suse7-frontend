// ======================================================
// S4.3.6.24 — Helpers do gráfico divergente do Comparativo.
// Apresentação apenas: Decimal para sinal/escala/ordem; sem recalcular negócio.
// ======================================================

import Decimal from "decimal.js";

/** Rótulo canônico do baseline no Comparativo. */
export const OFFER_COMPARE_BASELINE_LABEL = "Preço atual do anúncio";

/** Largura mínima (%) da meia-trilha para lucro ≠ 0 (percepção). */
export const DIVERGING_BAR_MIN_WIDTH_PCT = 4;

/** Padding interno mínimo (px) para caber o texto dentro da barra. */
export const DIVERGING_TEXT_IN_PADDING_PX = 16;

/** Estimativa de largura por caractere do resumo (fallback sem DOM). */
export const DIVERGING_TEXT_ESTIMATED_CHAR_PX = 6.8;

/**
 * @param {unknown} raw
 * @returns {Decimal | null}
 */
export function parseLucroDecimalComparativo(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  try {
    const d = new Decimal(String(raw).trim().replace(",", "."));
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/**
 * @param {Decimal | null | undefined} profitDec
 * @returns {"positive" | "negative" | "zero" | "pending"}
 */
export function resolverLadoLucroDivergente(profitDec) {
  if (profitDec == null || !(profitDec instanceof Decimal) || !profitDec.isFinite()) {
    return "pending";
  }
  if (profitDec.isZero()) return "zero";
  if (profitDec.isNeg()) return "negative";
  return "positive";
}

/**
 * Maior |lucro| do conjunto (Decimal).
 * @param {(Decimal | null | undefined)[]} profits
 * @returns {Decimal}
 */
export function calcularMaxAbsLucroDivergente(profits) {
  let max = new Decimal(0);
  for (const p of profits) {
    if (p == null || !(p instanceof Decimal) || !p.isFinite()) continue;
    const abs = p.abs();
    if (abs.greaterThan(max)) max = abs;
  }
  return max;
}

/**
 * Largura da barra em % da meia-trilha (0–100). Zero → 0 (marcador, não barra).
 * @param {Decimal | null | undefined} profitDec
 * @param {Decimal} maxAbs
 * @param {number} [minPct]
 */
export function calcularLarguraMeiaBarraDivergentePct(
  profitDec,
  maxAbs,
  minPct = DIVERGING_BAR_MIN_WIDTH_PCT,
) {
  if (profitDec == null || !(profitDec instanceof Decimal) || !profitDec.isFinite()) return 0;
  if (profitDec.isZero()) return 0;
  if (!(maxAbs instanceof Decimal) || !maxAbs.isFinite() || maxAbs.lte(0)) {
    return Math.max(0, minPct);
  }
  const pct = profitDec.abs().div(maxAbs).times(100);
  const n = Number(pct.toFixed(4));
  if (!Number.isFinite(n)) return minPct;
  return Math.max(minPct, Math.min(100, n));
}

/** Padding mínimo (px) nas extremidades para modo inside cobrir o bloco inteiro. */
export const OFFER_COMPARE_METRICS_INNER_PADDING_PX = DIVERGING_TEXT_IN_PADDING_PX;

/** Histerese (px) para evitar flicker inside/outside no resize. */
export const OFFER_COMPARE_METRICS_CONTRAST_HYSTERESIS_PX = 4;

/**
 * Decisão inside/outside por medição real (ou estimativa).
 * @param {{
 *   side: "positive" | "negative" | "zero" | "pending";
 *   barWidthPx: number;
 *   textWidthPx: number;
 *   paddingPx?: number;
 * }} p
 * @returns {"in" | "out"}
 */
export function decidirTextoDentroOuForaBarraDivergente({
  side,
  barWidthPx,
  textWidthPx,
  paddingPx = DIVERGING_TEXT_IN_PADDING_PX,
}) {
  const mode = resolveOfferComparisonMetricsContrastMode({
    side,
    barWidthPx,
    metricsWidthPx: textWidthPx,
    innerPaddingPx: paddingPx,
  });
  return mode === "inside" ? "in" : "out";
}

/**
 * S4.3.6.27 — modo INSIDE/OUTSIDE do bloco de métricas (layout/medição).
 * S4.3.6.29 — não controla mais cor textual (valores/labels ficam sempre escuros no CSS).
 * @param {{
 *   side: "positive" | "negative" | "zero" | "pending";
 *   barWidthPx: number;
 *   metricsWidthPx: number;
 *   innerPaddingPx?: number;
 *   previousMode?: "inside" | "outside" | null;
 *   hysteresisPx?: number;
 * }} p
 * @returns {"inside" | "outside"}
 */
export function resolveOfferComparisonMetricsContrastMode({
  side,
  barWidthPx,
  metricsWidthPx,
  innerPaddingPx = OFFER_COMPARE_METRICS_INNER_PADDING_PX,
  previousMode = null,
  hysteresisPx = OFFER_COMPARE_METRICS_CONTRAST_HYSTERESIS_PX,
}) {
  if (side === "zero" || side === "pending") return "outside";
  if (!(barWidthPx > 0) || !(metricsWidthPx > 0)) return "outside";

  const need = metricsWidthPx + Math.max(0, innerPaddingPx);
  const hyst = Math.max(0, hysteresisPx);

  if (previousMode === "inside") {
    return barWidthPx + hyst >= need ? "inside" : "outside";
  }
  if (previousMode === "outside") {
    return barWidthPx >= need + hyst ? "inside" : "outside";
  }
  return barWidthPx >= need ? "inside" : "outside";
}

/**
 * Estimativa determinística da largura do texto (sem DOM).
 * @param {string} text
 * @param {number} [charPx]
 */
export function estimarLarguraTextoResumoPx(text, charPx = DIVERGING_TEXT_ESTIMATED_CHAR_PX) {
  const s = text != null ? String(text) : "";
  if (s === "") return 0;
  return Math.ceil(s.length * charPx);
}

/**
 * Classifica disponibilidade financeira (não inferir por R$ 0,00 formatado).
 * @param {{
 *   pending?: boolean;
 *   error?: boolean;
 *   financialAvailability?: "RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED";
 *   canonicalSource?: string | null;
 *   scenarioStatus?: string | null;
 *   profitDec?: Decimal | null;
 * }} lane
 * @returns {"RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED"}
 */
export function classificarDisponibilidadeFinanceiraLane(lane) {
  if (lane?.financialAvailability != null) return lane.financialAvailability;
  if (lane?.pending === true) return "PENDING";
  if (lane?.error === true) return "ERROR_FAIL_CLOSED";
  const src = lane?.canonicalSource != null ? String(lane.canonicalSource) : "";
  const st = lane?.scenarioStatus != null ? String(lane.scenarioStatus) : "";
  if (
    src === "zero_canonico" ||
    st === "UNCONFIRMED_EMPTY" ||
    st === "EMPTY" ||
    src === "fail_closed"
  ) {
    return "NO_FINANCIAL_DATA";
  }
  if (lane?.profitDec == null) return "NO_FINANCIAL_DATA";
  return "RESOLVED_NUMERIC";
}

/** @param {"RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED"} avail */
function grupoOrdenacaoDisponibilidade(avail) {
  if (avail === "RESOLVED_NUMERIC") return 0;
  return 1;
}

/**
 * Ordena: RESOLVED_NUMERIC por lucro Decimal desc; depois NO_DATA/PENDING/ERROR (estável).
 * Zero financeiro real permanece no grupo resolvido.
 * @template {{
 *   profitDec: Decimal | null;
 *   isBaseline?: boolean;
 *   originIndex?: number;
 *   pending?: boolean;
 *   error?: boolean;
 *   financialAvailability?: "RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED";
 *   canonicalSource?: string | null;
 *   scenarioStatus?: string | null;
 * }} T
 * @param {T[]} series
 * @returns {T[]}
 */
export function ordenarSeriesDivergentePorLucroDesc(series) {
  return [...series]
    .map((item, idx) => ({
      item,
      idx: item.originIndex != null && Number.isFinite(item.originIndex) ? item.originIndex : idx,
      avail: classificarDisponibilidadeFinanceiraLane(item),
    }))
    .sort((a, b) => {
      const ga = grupoOrdenacaoDisponibilidade(a.avail);
      const gb = grupoOrdenacaoDisponibilidade(b.avail);
      if (ga !== gb) return ga - gb;

      if (ga !== 0) {
        return desempateEstavelDivergente(a.item, b.item, a.idx, b.idx);
      }

      const av = a.item.profitDec;
      const bv = b.item.profitDec;
      if (av == null && bv == null) {
        return desempateEstavelDivergente(a.item, b.item, a.idx, b.idx);
      }
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = bv.comparedTo(av);
      if (cmp !== 0) return cmp;
      return desempateEstavelDivergente(a.item, b.item, a.idx, b.idx);
    })
    .map((x) => x.item);
}

/**
 * @param {{ isBaseline?: boolean }} a
 * @param {{ isBaseline?: boolean }} b
 * @param {number} ai
 * @param {number} bi
 */
function desempateEstavelDivergente(a, b, ai, bi) {
  const ab = a.isBaseline === true;
  const bb = b.isBaseline === true;
  if (ab !== bb) return ab ? -1 : 1;
  return ai - bi;
}

/**
 * @param {{ saleLabel: string; profitLabel: string; marginLabel: string }} p
 */
export function montarTextoResumoBarraHorizontal({ saleLabel, profitLabel, marginLabel }) {
  const sale = saleLabel != null && String(saleLabel).trim() !== "" ? String(saleLabel).trim() : "—";
  const profit = profitLabel != null && String(profitLabel).trim() !== "" ? String(profitLabel).trim() : "—";
  const margin =
    marginLabel != null && String(marginLabel).trim() !== "" ? String(marginLabel).trim() : "—";
  return `${sale} | ${profit} | ${margin}`;
}

/**
 * @param {{
 *   name: string;
 *   saleLabel: string;
 *   profitLabel: string;
 *   marginLabel: string;
 *   statusLabel: string;
 *   side: "positive" | "negative" | "zero" | "pending";
 *   profitAbsLabel?: string;
 *   marginAbsLabel?: string;
 * }} p
 */
export function montarAriaLabelLaneDivergente({
  name,
  saleLabel,
  profitLabel,
  marginLabel,
  statusLabel,
  side,
  profitAbsLabel,
  marginAbsLabel,
  financialAvailability,
}) {
  const n = name != null && String(name).trim() !== "" ? String(name).trim() : "Oferta";
  const sale = saleLabel != null && String(saleLabel).trim() !== "" ? String(saleLabel).trim() : "—";
  const status =
    statusLabel != null && String(statusLabel).trim() !== "" ? String(statusLabel).trim() : "indefinido";

  if (
    financialAvailability === "NO_FINANCIAL_DATA" ||
    financialAvailability === "ERROR_FAIL_CLOSED"
  ) {
    return `${n}. Oferta sem valor financeiro confirmado. Valor de venda ${sale}. Resultado ${status}.`;
  }

  if (side === "pending" || financialAvailability === "PENDING") {
    return `${n}. Valor de venda ${sale}. Resultado financeiro pendente.`;
  }

  if (side === "negative") {
    const prejuizo =
      profitAbsLabel != null && String(profitAbsLabel).trim() !== ""
        ? String(profitAbsLabel).trim()
        : profitLabel;
    const margemNeg =
      marginAbsLabel != null && String(marginAbsLabel).trim() !== ""
        ? String(marginAbsLabel).trim()
        : marginLabel;
    return `${n}. Valor de venda ${sale}. Prejuízo ${prejuizo}. Margem negativa de ${margemNeg}. Resultado ${status}.`;
  }

  const lucro = profitLabel != null && String(profitLabel).trim() !== "" ? String(profitLabel).trim() : "—";
  const margem = marginLabel != null && String(marginLabel).trim() !== "" ? String(marginLabel).trim() : "—";
  return `${n}. Valor de venda ${sale}. Lucro ${lucro}. Margem ${margem}. Resultado ${status}.`;
}

/**
 * Extrai preço de venda já presente no cenário (sem recalcular).
 * @param {Record<string, unknown>} scenario
 * @param {Record<string, unknown> | null} result
 * @returns {string}
 */
export function pickSalePriceRawForCompareChart(scenario, result) {
  const meta =
    scenario._offer_comparison_financial != null &&
    typeof scenario._offer_comparison_financial === "object"
      ? /** @type {Record<string, unknown>} */ (scenario._offer_comparison_financial)
      : null;
  if (meta?.sale_price_brl != null && String(meta.sale_price_brl).trim() !== "") {
    return String(meta.sale_price_brl).trim();
  }
  const marketplace =
    scenario.marketplace != null && typeof scenario.marketplace === "object"
      ? /** @type {Record<string, unknown>} */ (scenario.marketplace)
      : null;
  if (marketplace?.sale_price_brl != null && String(marketplace.sale_price_brl).trim() !== "") {
    return String(marketplace.sale_price_brl).trim();
  }
  if (result?.sale_price_brl != null && String(result.sale_price_brl).trim() !== "") {
    return String(result.sale_price_brl).trim();
  }
  if (scenario.sale_price_brl != null && String(scenario.sale_price_brl).trim() !== "") {
    return String(scenario.sale_price_brl).trim();
  }
  return "";
}

/**
 * Formata margem compacta a partir da string API (sem recalcular).
 * @param {string | null | undefined} s
 */
export function formatMarginCompactFromApiString(s) {
  if (s == null || String(s).trim() === "") return "—";
  return `${String(s).replace(".", ",")}%`;
}

/**
 * Valor absoluto formatado para aria (remove sinal).
 * @param {string} formatted
 */
export function stripLeadingMoneySign(formatted) {
  const s = formatted != null ? String(formatted).trim() : "";
  if (s === "" || s === "—") return s;
  return s.replace(/^-/, "").replace(/^−/, "").trim();
}
