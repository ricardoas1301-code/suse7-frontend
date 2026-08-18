// ======================================================
// S4.3.6.21 — Verdade promocional do Comparativo de Ofertas.
// Reutiliza o gate fail-closed da aba Promoções (S4.3.6.17).
// Precedência: oficial confirmado → simulação explícita do seller → zero canônico.
// ======================================================

import { buildFinalPromotionTruthPresentation } from "../../features/pricing/promotions/promotionFinalTruthPresentationGate.js";
import { resolverPrecoSimulacaoPromocaoMonetario } from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";
import { decimalBrlParaNumeroSimulacao } from "../../features/pricing/promotions/promotionManualSimulationPrice.js";
import { resolverPrecoRealAnuncioPrecificacao } from "../pricing/precoInicialAnuncioPrecificacao.js";

/**
 * @param {unknown} scenario
 * @returns {boolean}
 */
export function isBaselineOfferComparisonScenario(scenario) {
  if (scenario == null || typeof scenario !== "object") return false;
  const r = /** @type {Record<string, unknown>} */ (scenario);
  if (r.is_baseline === true) return true;
  const sid = String(r.scenario_id ?? r.scenario_key ?? "").trim().toLowerCase();
  return sid === "baseline";
}

/** @typedef {import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord} ManualPromotionSimulationPriceRecord */

/**
 * @typedef {{
 *   kind: "baseline" | "promotion";
 *   truthStatus: "BASELINE" | "CONFIRMED_OFFICIAL" | "UNCONFIRMED_EMPTY" | "MANUAL_SIMULATION";
 *   salePrice: number | null;
 *   salePriceBrl: string | null;
 *   isFinanciallySimulated: boolean;
 *   displayState: "CONFIRMED" | "EMPTY" | "MANUAL" | "BASELINE";
 *   provenance: string;
 *   rejectionReasons: string[];
 *   candidatePrice: string | null;
 *   candidateProvenance: string | null;
 * }} OfferComparisonPromotionPriceResolution
 */

/**
 * Resolve preço promocional do Comparativo com a mesma verdade do card.
 *
 * @param {{
 *   sourceScenario: unknown;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown } | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   manualPriceRecord?: ManualPromotionSimulationPriceRecord | null;
 *   baselineSalePriceOverride?: number | null;
 * }} params
 * @returns {OfferComparisonPromotionPriceResolution}
 */
export function resolverPrecoVerdadeComparativoOfertas({
  sourceScenario,
  mlScenariosPayload = null,
  baselineRow = null,
  catalogRow = null,
  manualPriceRecord = null,
  baselineSalePriceOverride = null,
}) {
  if (isBaselineOfferComparisonScenario(sourceScenario)) {
    // S4.3.6.25/28 — SSOT BASELINE da Precificação (nunca preço promocional).
    // Proibido: selectedPromotionPrice / lastEditedPromotion / fallback promocional.
    if (
      baselineSalePriceOverride != null &&
      Number.isFinite(baselineSalePriceOverride) &&
      baselineSalePriceOverride > 0
    ) {
      const v = Math.round(baselineSalePriceOverride * 100) / 100;
      return {
        kind: "baseline",
        truthStatus: "BASELINE",
        salePrice: v,
        salePriceBrl: String(v),
        isFinanciallySimulated: true,
        displayState: "BASELINE",
        provenance: "precificacao_financial_ssot_baseline",
        rejectionReasons: [],
        candidatePrice: null,
        candidateProvenance: null,
      };
    }
    const preco = resolverPrecoRealAnuncioPrecificacao({
      catalogRow: catalogRow ?? null,
      payload: mlScenariosPayload,
      baselineRow: baselineRow ?? null,
    });
    if (preco.valor > 0) {
      return {
        kind: "baseline",
        truthStatus: "BASELINE",
        salePrice: preco.valor,
        salePriceBrl: String(preco.valor),
        isFinanciallySimulated: true,
        displayState: "BASELINE",
        provenance: "listing_sale_price",
        rejectionReasons: [],
        candidatePrice: null,
        candidateProvenance: null,
      };
    }
    return {
      kind: "baseline",
      truthStatus: "BASELINE",
      salePrice: null,
      salePriceBrl: null,
      isFinanciallySimulated: false,
      displayState: "EMPTY",
      provenance: "baseline_price_unavailable",
      rejectionReasons: ["baseline_price_unavailable"],
      candidatePrice: null,
      candidateProvenance: null,
    };
  }

  const gate = buildFinalPromotionTruthPresentation({
    scenario: sourceScenario,
    manualPriceRecord: manualPriceRecord ?? null,
  });
  const monetario = resolverPrecoSimulacaoPromocaoMonetario(sourceScenario, manualPriceRecord ?? null);
  const salePrice = monetario != null ? decimalBrlParaNumeroSimulacao(monetario) : null;

  if (gate.displayState === "CONFIRMED" && salePrice != null && salePrice > 0) {
    return {
      kind: "promotion",
      truthStatus: "CONFIRMED_OFFICIAL",
      salePrice,
      salePriceBrl: gate.salePriceForFinance,
      isFinanciallySimulated: true,
      displayState: "CONFIRMED",
      provenance: gate.resolverName || "CONFIRMED_OFFICIAL",
      rejectionReasons: [],
      candidatePrice: gate.candidatePrice,
      candidateProvenance: gate.candidateProvenance,
    };
  }

  if (gate.displayState === "MANUAL" && salePrice != null && salePrice > 0) {
    return {
      kind: "promotion",
      truthStatus: "MANUAL_SIMULATION",
      salePrice,
      salePriceBrl: gate.salePriceForFinance,
      isFinanciallySimulated: true,
      displayState: "MANUAL",
      provenance: "USER_PROVIDED_SIMULATION_PRICE",
      rejectionReasons: gate.rejectionReasons ?? [],
      candidatePrice: gate.candidatePrice,
      candidateProvenance: gate.candidateProvenance,
    };
  }

  return {
    kind: "promotion",
    truthStatus: "UNCONFIRMED_EMPTY",
    salePrice: null,
    salePriceBrl: null,
    isFinanciallySimulated: false,
    displayState: "EMPTY",
    provenance: "zero_canonico",
    rejectionReasons: gate.rejectionReasons ?? [],
    candidatePrice: gate.candidatePrice,
    candidateProvenance: gate.candidateProvenance,
  };
}

/**
 * Cenário neutro UNCONFIRMED_EMPTY — não executa fórmula com venda R$ 0,00.
 * Substitui qualquer result stale do payload.
 *
 * @param {unknown} sourceScenario
 * @param {OfferComparisonPromotionPriceResolution} [resolution]
 * @returns {Record<string, unknown> | null}
 */
export function montarCenarioComparativoZeroCanonico(sourceScenario, resolution = null) {
  if (sourceScenario == null || typeof sourceScenario !== "object") return null;
  const src = /** @type {Record<string, unknown>} */ (sourceScenario);
  return {
    ...src,
    result: {
      profit_brl: "0.00",
      margin_pct: "0.00",
    },
    _offer_comparison_financial: {
      scenario_status: "UNCONFIRMED_EMPTY",
      is_financially_simulated: false,
      pending: false,
      canonical_source: "zero_canonico",
      truth_status: resolution?.truthStatus ?? "UNCONFIRMED_EMPTY",
      provenance: resolution?.provenance ?? "zero_canonico",
      candidate_price: resolution?.candidatePrice ?? null,
      candidate_provenance: resolution?.candidateProvenance ?? null,
      rejection_reasons: resolution?.rejectionReasons ?? [],
    },
  };
}

/**
 * Preço autorizado conhecido, resultado ainda não reconciliado — NÃO é zero definitivo.
 * @param {unknown} sourceScenario
 * @param {OfferComparisonPromotionPriceResolution} resolution
 * @returns {Record<string, unknown> | null}
 */
export function montarCenarioComparativoPendente(sourceScenario, resolution) {
  if (sourceScenario == null || typeof sourceScenario !== "object") return null;
  const src = /** @type {Record<string, unknown>} */ (sourceScenario);
  const rest = { ...src };
  delete rest.result;
  return {
    ...rest,
    result: {
      profit_brl: null,
      margin_pct: null,
    },
    _offer_comparison_financial: {
      scenario_status: "PENDING_RECONCILE",
      is_financially_simulated: false,
      pending: true,
      canonical_source: "pending_authorized_simulation",
      truth_status: resolution.truthStatus,
      provenance: resolution.provenance,
      sale_price_brl: resolution.salePriceBrl,
      rejection_reasons: resolution.rejectionReasons ?? [],
    },
  };
}

/**
 * @param {unknown} scenario
 * @returns {boolean}
 */
export function isOfferComparisonScenarioPending(scenario) {
  if (scenario == null || typeof scenario !== "object") return false;
  const meta =
    /** @type {Record<string, unknown>} */ (scenario)._offer_comparison_financial != null &&
    typeof /** @type {Record<string, unknown>} */ (scenario)._offer_comparison_financial === "object"
      ? /** @type {Record<string, unknown>} */ (
          /** @type {Record<string, unknown>} */ (scenario)._offer_comparison_financial
        )
      : null;
  return meta?.pending === true;
}

/**
 * Remove lucro/margem stale do payload para não flashar valores indevidos.
 * @param {unknown} sourceScenario
 * @returns {Record<string, unknown> | null}
 */
export function stripStaleOfferComparisonFinancialResult(sourceScenario) {
  if (sourceScenario == null || typeof sourceScenario !== "object") return null;
  const src = /** @type {Record<string, unknown>} */ (sourceScenario);
  const rest = { ...src };
  delete rest.result;
  return {
    ...rest,
    result: {
      profit_brl: null,
      margin_pct: null,
    },
    _offer_comparison_financial: {
      scenario_status: "PENDING_TRUTH",
      is_financially_simulated: false,
      pending: true,
      canonical_source: "pending_safe_strip",
    },
  };
}
