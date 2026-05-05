// ======================================================
// Precificação Inteligente (página) — leitura de campos da API + ordenação/destaque só UX.
// Não recalcula comissão, frete, imposto, repasse nem margem: apenas parse e comparação de números já expostos.
// ======================================================

import { formatCatalogBRL } from "../../utils/productCatalogRow";
import {
  cardHeadingLabel,
  getOfferStatusFromMargin,
  resolveRaioxListingBadge,
} from "../mercadoLivrePricingScenarioCompareShared.js";
import { resolveMlScenarioTabId } from "../MercadoLivrePricingScenarioRaiox.jsx";

/** @typedef {"loss" | "low_margin" | "healthy"} ScenarioHealthStatus */

/** @param {unknown} scenario */
function scenarioRecord(scenario) {
  return scenario && typeof scenario === "object" ? /** @type {Record<string, unknown>} */ (scenario) : null;
}

/** @param {unknown} scenario */
function scenarioResult(scenario) {
  const r = scenarioRecord(scenario);
  if (!r) return null;
  return r.result != null && typeof r.result === "object" ? /** @type {Record<string, unknown>} */ (r.result) : null;
}

/**
 * Lucro em R$ já calculado no cenário (API) — só parse para ordenação / comparação visual.
 * @param {unknown} scenario
 * @returns {number | null}
 */
export function parseScenarioProfitBrlNumber(scenario) {
  const r = scenarioRecord(scenario);
  if (!r) return null;
  const res = scenarioResult(scenario);
  const raw =
    res?.profit_brl != null && String(res.profit_brl).trim() !== ""
      ? String(res.profit_brl)
      : r.profit_brl != null && String(r.profit_brl).trim() !== ""
        ? String(r.profit_brl)
        : "";
  if (raw === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Margem % do cenário (API) — só parse.
 * @param {unknown} scenario
 * @returns {number | null}
 */
export function parseScenarioMarginPctNumber(scenario) {
  const r = scenarioRecord(scenario);
  if (!r) return null;
  const res = scenarioResult(scenario);
  const raw =
    res?.margin_pct != null && String(res.margin_pct).trim() !== ""
      ? String(res.margin_pct)
      : r.margin_pct != null && String(r.margin_pct).trim() !== ""
        ? String(r.margin_pct)
        : "";
  if (raw === "") return null;
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Melhor cenário por maior lucro líquido **estritamente positivo**.
 * Se nenhum lucro > 0, retorna `null`.
 *
 * @param {unknown[]} scenarios
 * @returns {string | null} `resolveMlScenarioTabId` (ou `"baseline"`)
 */
export function getBestScenarioId(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return null;
  const ranked = scenarios
    .filter((s) => s != null && typeof s === "object")
    .map((s) => {
      const p = parseScenarioProfitBrlNumber(s);
      const id = resolveMlScenarioTabId(s) || "baseline";
      return { scenario: s, profit: p, id };
    })
    .filter((x) => x.profit != null && x.profit > 0)
    .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0));
  if (ranked.length === 0) return null;
  return ranked[0].id;
}

/**
 * Cor semântica alinhada ao gráfico (Crítico / Regular / Bom+): prejuízo explícito por lucro < 0;
 * laranja para margem “Regular”; verde para demais com lucro não negativo.
 *
 * @param {unknown} scenario
 * @returns {ScenarioHealthStatus}
 */
export function getScenarioHealthStatus(scenario) {
  const profit = parseScenarioProfitBrlNumber(scenario);
  if (profit != null && profit < 0) return "loss";
  const res = scenarioResult(scenario);
  const tone = getOfferStatusFromMargin(res?.margin_pct);
  const color = tone?.color != null ? String(tone.color) : "";
  if (color === "regular" || color === "critical") return "low_margin";
  return "healthy";
}

/**
 * Tier só para ordenação visual na sidebar: baseline → ativa → programada → disponível → demais.
 *
 * @param {{ scenario: unknown; group: string }} row
 * @returns {number}
 */
function sidebarPromoStatusTier(row) {
  const { scenario, group } = row;
  const r = scenarioRecord(scenario);
  if (!r) return 4;
  if (r.is_baseline === true || String(r.scenario_id ?? "").toLowerCase() === "baseline") return 0;
  const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
  if (kind === "base") return 0;
  if (group === "baseline") return 0;

  const badge = resolveRaioxListingBadge(scenario);
  const label = badge.label != null ? String(badge.label).trim().toLowerCase() : "";
  if (label.includes("program")) return 2;
  if (label.includes("ativa") || group === "participating") return 1;
  if (label.includes("dispon")) return 3;
  if (group === "participating") return 1;
  if (group === "available") return 3;
  return 4;
}

/**
 * Ordenação só para UI (ids e objetos intactos).
 *
 * 1. Baseline (“Preço de venda”) primeiro
 * 2. Promoções ATIVAS
 * 3. Promoções PROGRAMADAS
 * 4. Promoções DISPONÍVEIS
 * 5. Demais (estável pela ordem original)
 *
 * Dentro do mesmo tier: lucro desc, depois índice original.
 *
 * @param {{ scenario: unknown; group: string }[]} rows — ex.: saída de `buildOrderedScenarioRows`
 * @returns {{ scenario: unknown; group: string }[]}
 */
export function sortPricingScenariosForUi(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .map((row, idx) => ({
      row,
      idx,
      tier: sidebarPromoStatusTier(row),
      profit: parseScenarioProfitBrlNumber(row.scenario) ?? -Infinity,
    }))
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      if (a.profit !== b.profit) return b.profit - a.profit;
      return a.idx - b.idx;
    })
    .map((x) => x.row);
}

/**
 * Seleção inicial página: melhor lucro → ativo → baseline → primeiro.
 *
 * @param {{ scenario: unknown; group: string }[]} orderedRows
 * @returns {string}
 */
export function pickPageDefaultScenarioTabId(orderedRows) {
  if (!Array.isArray(orderedRows) || orderedRows.length === 0) return "";
  const tabIdOf = (scenario) => resolveMlScenarioTabId(scenario) || "baseline";
  const scenarios = orderedRows.map((r) => r.scenario);
  const best = getBestScenarioId(scenarios);
  if (best != null && best !== "") return best;

  for (const { scenario, group } of orderedRows) {
    if (group === "participating") return tabIdOf(scenario);
  }
  for (const { scenario, group } of orderedRows) {
    if (group === "baseline") return tabIdOf(scenario);
  }
  return tabIdOf(orderedRows[0].scenario);
}

/**
 * Baseline (“Preço de venda”) nas linhas já ordenadas/classificadas.
 * @param {{ scenario: unknown; group: string }[]} rows
 * @returns {unknown | null}
 */
export function findBaselineScenarioFromRows(rows) {
  if (!Array.isArray(rows)) return null;
  const hit = rows.find((r) => r.group === "baseline");
  return hit?.scenario ?? null;
}

/**
 * Δ lucro e Δ margem (pontos %) vs baseline — só subtração de números já exibidos pela API.
 *
 * @param {unknown} scenario
 * @param {unknown | null} baselineScenario
 * @returns {{ profitLine: string | null; marginLine: string | null }}
 */
export function formatScenarioDeltaVsBaseline(scenario, baselineScenario) {
  if (!baselineScenario || !scenario) return { profitLine: null, marginLine: null };
  const tabIdOf = (s) => resolveMlScenarioTabId(s) || "baseline";
  if (tabIdOf(scenario) === tabIdOf(baselineScenario)) {
    return { profitLine: null, marginLine: null };
  }

  const p0 = parseScenarioProfitBrlNumber(baselineScenario);
  const p1 = parseScenarioProfitBrlNumber(scenario);
  const m0 = parseScenarioMarginPctNumber(baselineScenario);
  const m1 = parseScenarioMarginPctNumber(scenario);

  /** @type {string | null} */
  let profitLine = null;
  if (p0 != null && p1 != null) {
    const d = p1 - p0;
    const sign = d >= 0 ? "+" : "−";
    profitLine = `${sign} ${formatCatalogBRL(Math.abs(d))} lucro vs atual`;
  }

  /** @type {string | null} */
  let marginLine = null;
  if (m0 != null && m1 != null) {
    const d = m1 - m0;
    const sign = d >= 0 ? "+" : "−";
    const abs = Math.abs(d);
    const absStr = abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    marginLine = `${sign} ${absStr} p.p. margem vs atual`;
  }

  return { profitLine, marginLine };
}

/** @param {unknown} scenario */
export function scenarioIsBaselineLike(scenario) {
  const r = scenarioRecord(scenario);
  if (!r) return false;
  if (r.is_baseline === true) return true;
  if (String(r.scenario_id ?? "").toLowerCase() === "baseline") return true;
  const kind = String(r.kind ?? r.scenario_kind ?? "").toLowerCase();
  return kind === "base";
}

/**
 * Título curto do cenário para o KPI (respeita override de baseline).
 * @param {unknown} scenario
 * @param {string | null} baselineHeadingOverride
 */
export function scenarioHeadingForUi(scenario, baselineHeadingOverride = null) {
  if (
    scenarioIsBaselineLike(scenario) &&
    baselineHeadingOverride != null &&
    String(baselineHeadingOverride).trim() !== ""
  ) {
    return String(baselineHeadingOverride).trim();
  }
  return cardHeadingLabel(scenario);
}

/**
 * Tom só visual do lucro (API) + margem “colada em zero” (−1% .. +1%) → alerta laranja.
 * @param {unknown} scenario
 * @returns {"loss" | "caution" | "healthy"}
 */
export function getProfitDisplayTone(scenario) {
  const p = parseScenarioProfitBrlNumber(scenario);
  if (p != null && p < 0) return "loss";
  const m = parseScenarioMarginPctNumber(scenario);
  if (p != null && p >= 0 && m != null && m >= -1 && m <= 1) return "caution";
  return "healthy";
}

/**
 * Tom só visual da margem % (API): &gt;5% verde, 0–5% laranja, &lt;0% vermelho.
 * @param {unknown} scenario
 * @returns {"high" | "mid" | "low" | "none"} high = margem acima de 5%.
 */
export function getMarginDisplayTone(scenario) {
  const m = parseScenarioMarginPctNumber(scenario);
  if (m == null) return "none";
  if (m < 0) return "low";
  if (m > 5) return "high";
  return "mid";
}

/**
 * Tom do status da oferta (`result.offer_status_semantic` da API).
 * @param {unknown} scenario
 * @returns {"great" | "regular" | "critical" | "none"}
 */
export function getOfferSemanticUiTone(scenario) {
  const res = scenarioResult(scenario);
  const sem = res?.offer_status_semantic != null ? String(res.offer_status_semantic).trim().toLowerCase() : "";
  if (sem === "great" || sem === "excellent") return "great";
  if (sem === "acceptable" || sem === "regular") return "regular";
  if (sem === "critical" || sem === "danger") return "critical";
  return "none";
}
