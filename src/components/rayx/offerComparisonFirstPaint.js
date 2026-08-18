// ======================================================
// S4.3.6.22 — First paint do Comparativo a partir do SSOT/cache da PI.
// Async só reconcilia; não inventa o primeiro estado visual.
// ======================================================

import { extrairContextoSelecaoPromocao } from "../pricing/pricingPromotionClassicPremiumScenario.js";
import { chaveCacheSimulacaoOficial } from "../../utils/simulateListingTypeScenarioKeys.js";
import { peekSimulacaoOficialCache } from "../../utils/simulacaoOficialListingTypeCache.js";
import { adaptarCenarioGraficoComparativo } from "./offerComparisonFinancialAdapter.js";
import {
  isBaselineOfferComparisonScenario,
  montarCenarioComparativoPendente,
  montarCenarioComparativoZeroCanonico,
  resolverPrecoVerdadeComparativoOfertas,
} from "./offerComparisonPromotionTruth.js";

/**
 * @param {{
 *   sourceScenario: unknown;
 *   listingType: "classic" | "premium";
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown } | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   configuracaoFinanceira?: unknown;
 *   manualPriceRecord?: import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null;
 *   baselineSalePriceOverride?: number | null;
 *   peekCache?: typeof peekSimulacaoOficialCache;
 * }} params
 */
export function montarLaneComparativoFirstPaint(params) {
  const {
    sourceScenario,
    listingType,
    listingExternalId = null,
    listingId = null,
    mlScenariosPayload = null,
    baselineRow = null,
    catalogRow = null,
    configuracaoFinanceira = null,
    manualPriceRecord = null,
    baselineSalePriceOverride = null,
    peekCache = peekSimulacaoOficialCache,
  } = params;

  const resolution = resolverPrecoVerdadeComparativoOfertas({
    sourceScenario,
    mlScenariosPayload,
    baselineRow,
    catalogRow,
    manualPriceRecord,
    baselineSalePriceOverride,
  });

  if (!resolution.isFinanciallySimulated || resolution.salePrice == null || !(resolution.salePrice > 0)) {
    if (isBaselineOfferComparisonScenario(sourceScenario)) {
      // Baseline sem preço conhecido: pendente (não zero definitivo).
      return {
        scenario: montarCenarioComparativoPendente(sourceScenario, resolution),
        resolution,
        cacheKey: null,
        fromCache: false,
        pending: true,
      };
    }
    return {
      scenario: montarCenarioComparativoZeroCanonico(sourceScenario, resolution),
      resolution,
      cacheKey: null,
      fromCache: false,
      pending: false,
    };
  }

  const promoCtx = isBaselineOfferComparisonScenario(sourceScenario)
    ? null
    : extrairContextoSelecaoPromocao(sourceScenario);
  const promotionId =
    promoCtx?.promotion_id != null && String(promoCtx.promotion_id).trim() !== ""
      ? String(promoCtx.promotion_id).trim()
      : null;

  const cacheKey = chaveCacheSimulacaoOficial({
    listingExternalId,
    listingId,
    listingType,
    kind: "preco",
    value: resolution.salePrice,
    configuracaoFinanceira:
      /** @type {import("../../utils/simulateListingTypeScenarioOficial.js").ConfiguracaoFinanceiraExtras | null} */ (
        configuracaoFinanceira
      ),
    promotionId,
  });

  const cached = typeof peekCache === "function" ? peekCache(cacheKey) : null;
  if (cached?.scenario != null) {
    const adapted = adaptarCenarioGraficoComparativo(sourceScenario, cached.scenario, listingType);
    if (adapted != null) {
      return {
        scenario: {
          ...adapted,
          _offer_comparison_financial: {
            ...(adapted._offer_comparison_financial && typeof adapted._offer_comparison_financial === "object"
              ? adapted._offer_comparison_financial
              : {}),
            scenario_status: resolution.truthStatus,
            is_financially_simulated: true,
            pending: false,
            provenance: resolution.provenance,
            sale_price_brl: resolution.salePriceBrl,
            canonical_source: "shared_simulation_cache",
            from_cache: true,
          },
        },
        resolution,
        cacheKey,
        fromCache: true,
        pending: false,
      };
    }
  }

  return {
    scenario: montarCenarioComparativoPendente(sourceScenario, resolution),
    resolution,
    cacheKey,
    fromCache: false,
    pending: true,
  };
}

/**
 * @param {{
 *   orderedRows: { scenario: unknown }[];
 *   listingType: "classic" | "premium";
 *   listingExternalId?: string | null;
 *   listingId?: string | null;
 *   mlScenariosPayload?: unknown;
 *   baselineRow?: { scenario: unknown } | null;
 *   catalogRow?: Record<string, unknown> | null;
 *   configuracaoFinanceira?: unknown;
 *   resolveManualPriceRecord?: ((scenario: unknown) => unknown) | null;
 *   baselineSalePriceOverride?: number | null;
 *   peekCache?: typeof peekSimulacaoOficialCache;
 * }} params
 */
export function montarFirstPaintComparativoOfertas(params) {
  const {
    orderedRows,
    listingType,
    listingExternalId = null,
    listingId = null,
    mlScenariosPayload = null,
    baselineRow = null,
    catalogRow = null,
    configuracaoFinanceira = null,
    resolveManualPriceRecord = null,
    baselineSalePriceOverride = null,
    peekCache = peekSimulacaoOficialCache,
  } = params;

  /** @type {unknown[]} */
  const scenarios = [];
  let pendingCount = 0;
  let resolvedCount = 0;
  let zeroCount = 0;

  for (const { scenario: sourceScenario } of orderedRows) {
    const manual =
      typeof resolveManualPriceRecord === "function" ? resolveManualPriceRecord(sourceScenario) : null;
    const lane = montarLaneComparativoFirstPaint({
      sourceScenario,
      listingType,
      listingExternalId,
      listingId,
      mlScenariosPayload,
      baselineRow,
      catalogRow,
      configuracaoFinanceira,
      manualPriceRecord:
        /** @type {import("../../features/pricing/promotions/promotionBetaPricePresentation.js").ManualPromotionSimulationPriceRecord | null} */ (
          manual
        ),
      baselineSalePriceOverride,
      peekCache,
    });
    if (lane.scenario != null) scenarios.push(lane.scenario);
    if (lane.pending) pendingCount += 1;
    else if (
      lane.scenario != null &&
      typeof lane.scenario === "object" &&
      /** @type {Record<string, unknown>} */ (lane.scenario)._offer_comparison_financial != null &&
      typeof /** @type {Record<string, unknown>} */ (lane.scenario)._offer_comparison_financial ===
        "object" &&
      /** @type {Record<string, unknown>} */ (
        /** @type {Record<string, unknown>} */ (lane.scenario)._offer_comparison_financial
      ).canonical_source === "zero_canonico"
    ) {
      zeroCount += 1;
      resolvedCount += 1;
    } else {
      resolvedCount += 1;
    }
  }

  return {
    scenarios,
    pendingCount,
    resolvedCount,
    zeroCount,
    needsReconcile: pendingCount > 0,
  };
}
