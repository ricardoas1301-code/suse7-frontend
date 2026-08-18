// ======================================================
// Comparativo de Ofertas S7 — adapter financeiro (somente leitura/seleção).
// Não recalcula lucro/margem no React: transporta resultados do motor oficial.
// ======================================================

import { inferListingTypeFromCatalogRow } from "../pricing/pricingListingTypeUi.js";
import {
  isBaselineOfferComparisonScenario,
  resolverPrecoVerdadeComparativoOfertas,
} from "./offerComparisonPromotionTruth.js";

export { isBaselineOfferComparisonScenario };
/**
 * Parse decimal API (ponto ou vírgula) — somente para auditoria/testes, sem recomposição.
 * @param {unknown} raw
 */
function parseDecimalApiString(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** @typedef {import("../pricing/pricingListingTypeUi.js").ListingTypeChoice} ListingTypeChoice */

/**
 * @param {unknown} catalogRow
 * @returns {{ ok: true; listingType: ListingTypeChoice } | { ok: false; reason: string }}
 */
export function resolverListingTypeComparativoOfertas(catalogRow) {
  if (catalogRow == null || typeof catalogRow !== "object") {
    return { ok: false, reason: "catalog_row_indisponivel" };
  }
  const row = /** @type {Record<string, unknown>} */ (catalogRow);
  const pcm =
    row.product_card_metrics != null && typeof row.product_card_metrics === "object"
      ? /** @type {Record<string, unknown>} */ (row.product_card_metrics)
      : null;
  const hints = [pcm?.listingType, row.listingTypeLabel, row.listing_type_label]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).trim());
  if (hints.length === 0) {
    return { ok: false, reason: "listing_type_indisponivel" };
  }
  const joined = hints.join(" ");
  const norm = joined
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (norm.includes("PREMIUM") || norm.includes("GOLD_PRO") || norm === "GOLD PRO") {
    return { ok: true, listingType: "premium" };
  }
  if (norm.includes("CLASSICO") || norm.includes("GOLD_SPECIAL") || norm === "GOLD SPECIAL") {
    return { ok: true, listingType: "classic" };
  }
  return { ok: false, reason: "listing_type_ambiguo" };
}

/**
 * @param {unknown} scenario
 * @returns {{ profit_brl: string | null; margin_pct: string | null }}
 */
export function extrairLucroMargemCanonico(scenario) {
  if (scenario == null || typeof scenario !== "object") {
    return { profit_brl: null, margin_pct: null };
  }
  const r = /** @type {Record<string, unknown>} */ (scenario);
  const res =
    r.result != null && typeof r.result === "object"
      ? /** @type {Record<string, unknown>} */ (r.result)
      : null;
  const profitRaw =
    res?.profit_brl != null && String(res.profit_brl).trim() !== ""
      ? String(res.profit_brl).trim()
      : r.profit_brl != null && String(r.profit_brl).trim() !== ""
        ? String(r.profit_brl).trim()
        : null;
  const marginRaw =
    res?.margin_pct != null && String(res.margin_pct).trim() !== ""
      ? String(res.margin_pct).trim()
      : r.margin_pct != null && String(r.margin_pct).trim() !== ""
        ? String(r.margin_pct).trim()
        : null;
  return { profit_brl: profitRaw, margin_pct: marginRaw };
}

/**
 * Seleciona resultado canônico entre cenários Clássico/Premium já resolvidos (sem math).
 *
 * @param {{
 *   classicScenario?: unknown;
 *   premiumScenario?: unknown;
 *   listingType: ListingTypeChoice;
 * }} params
 * @returns {{ scenario: Record<string, unknown> | null; selected_model: ListingTypeChoice; source: string }}
 */
export function selecionarResultadoFinanceiroPorListingType({
  classicScenario = null,
  premiumScenario = null,
  listingType,
}) {
  if (listingType === "premium") {
    if (premiumScenario != null && typeof premiumScenario === "object") {
      return {
        scenario: /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (premiumScenario) }),
        selected_model: "premium",
        source: "premium_scenario",
      };
    }
    return { scenario: null, selected_model: "premium", source: "premium_indisponivel" };
  }
  if (classicScenario != null && typeof classicScenario === "object") {
    return {
      scenario: /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (classicScenario) }),
      selected_model: "classic",
      source: "classic_scenario",
    };
  }
  return { scenario: null, selected_model: "classic", source: "classic_indisponivel" };
}

/**
 * @param {unknown} sourceScenario
 * @param {unknown} canonicalScenario
 * @param {ListingTypeChoice} listingType
 * @returns {Record<string, unknown> | null}
 */
export function adaptarCenarioGraficoComparativo(sourceScenario, canonicalScenario, listingType) {
  if (sourceScenario == null || typeof sourceScenario !== "object") return null;
  if (canonicalScenario == null || typeof canonicalScenario !== "object") return null;
  const src = /** @type {Record<string, unknown>} */ (sourceScenario);
  const canon = /** @type {Record<string, unknown>} */ (canonicalScenario);
  const canonResult =
    canon.result != null && typeof canon.result === "object"
      ? /** @type {Record<string, unknown>} */ ({ .../** @type {Record<string, unknown>} */ (canon.result) })
      : null;
  if (canonResult == null) return null;
  return {
    ...src,
    result: canonResult,
    _offer_comparison_financial: {
      listing_type: listingType,
      selected_model: listingType,
      canonical_source: "pricing-simulate-scenario",
    },
  };
}

/**
 * S4.3.6.21 — preço do Comparativo via gate da aba Promoções.
 * @param {{
 *   sourceScenario: unknown;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown } | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   manualPriceRecord?: import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null;
 * }} params
 * @returns {number | null}
 */
export function resolverPrecoSimulacaoComparativo({
  sourceScenario,
  mlScenariosPayload = null,
  baselineRow = null,
  catalogRow = null,
  manualPriceRecord = null,
}) {
  const hit = resolverPrecoVerdadeComparativoOfertas({
    sourceScenario,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    manualPriceRecord,
  });
  return hit.isFinanciallySimulated && hit.salePrice != null && hit.salePrice > 0 ? hit.salePrice : null;
}

/**
 * Bucket de saúde alinhado à legenda do gráfico (Crítico / Regular / Bom ou melhor).
 * @param {unknown} marginPctRaw
 * @returns {"critical" | "regular" | "good" | null}
 */
export function classificarSaudeMargemComparativo(marginPctRaw) {
  const m = parseDecimalApiString(marginPctRaw);
  if (m == null) return null;
  if (m < 0) return "critical";
  if (m < 5) return "regular";
  return "good";
}

/**
 * @param {Record<string, unknown>} entry
 */
export function logOfferComparisonFinancialTrace(entry) {
  if (!import.meta.env.DEV) return;
  console.info("[S7_OFFER_COMPARISON_FINANCIAL_TRACE]", entry);
}

/**
 * Extrai lucro/margem numéricos para testes (parse apenas — sem recomposição financeira).
 *
 * @param {unknown} scenario
 */
export function extrairLucroMargemNumericoComparativo(scenario) {
  const { profit_brl, margin_pct } = extrairLucroMargemCanonico(scenario);
  return {
    profit: parseDecimalApiString(profit_brl),
    margin: parseDecimalApiString(margin_pct),
  };
}

/** @deprecated Preferir resolverListingTypeComparativoOfertas (sem fallback silencioso). */
export function inferListingTypeComparativoFromRow(catalogRow) {
  return inferListingTypeFromCatalogRow(catalogRow);
}
