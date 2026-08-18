// ======================================================
// S4.3.6.26 — Manifesto canônico de promoções do Comparativo.
// Somente classificação/identidade — sem fórmulas.
// ======================================================

import { buildFinalPromotionTruthPresentation } from "../../features/pricing/promotions/promotionFinalTruthPresentationGate.js";
import { decimalBrlParaNumeroSimulacao } from "../../features/pricing/promotions/promotionManualSimulationPrice.js";
import { resolverPrecoSimulacaoPromocaoMonetario } from "../../features/pricing/promotions/promotionMiniCardSimulationUx.js";
import { extrairContextoSelecaoPromocao } from "./pricingPromotionClassicPremiumScenario.js";
import { isBaselineOfferComparisonScenario } from "../rayx/offerComparisonPromotionTruth.js";

/**
 * @typedef {"RESOLVED_NUMERIC" | "NO_FINANCIAL_DATA" | "PENDING" | "ERROR_FAIL_CLOSED"} ManifestFinancialState
 */

/**
 * @typedef {{
 *   selectionId: string;
 *   originIndex: number;
 *   scenario: unknown;
 *   promotionId: string | null;
 *   promotionName: string | null;
 *   salePrice: number | null;
 *   salePriceBrl: string | null;
 *   financialState: ManifestFinancialState;
 *   truthStatus: string;
 *   isBaseline: boolean;
 *   hasAuthorizedPrice: boolean;
 *   priority: number;
 * }} PromotionOfferManifestEntry
 */

/**
 * @param {{
 *   opcoes: { row: { scenario: unknown }; selectionId: string }[];
 *   obterPrecoManual?: ((selectionId: string) => { priceBrl?: string } | null) | null;
 *   promocaoAtivaId?: string | null;
 * }} params
 * @returns {PromotionOfferManifestEntry[]}
 */
export function montarManifestoPromocoesComparativo({
  opcoes,
  obterPrecoManual = null,
  promocaoAtivaId = null,
}) {
  if (!Array.isArray(opcoes)) return [];
  /** @type {PromotionOfferManifestEntry[]} */
  const out = [];
  for (let i = 0; i < opcoes.length; i += 1) {
    const op = opcoes[i];
    if (op?.row?.scenario == null) continue;
    const scenario = op.row.scenario;
    const isBaseline = isBaselineOfferComparisonScenario(scenario);
    const manual =
      typeof obterPrecoManual === "function" ? obterPrecoManual(op.selectionId) : null;
    const gate = buildFinalPromotionTruthPresentation({
      scenario,
      manualPriceRecord: manual ?? null,
    });
    const monetario = resolverPrecoSimulacaoPromocaoMonetario(scenario, manual ?? null);
    const salePrice = monetario != null ? decimalBrlParaNumeroSimulacao(monetario) : null;
    const ctx = extrairContextoSelecaoPromocao(scenario);
    const hasAuthorizedPrice = salePrice != null && salePrice > 0 && gate.displayState !== "EMPTY";

    /** @type {ManifestFinancialState} */
    let financialState = "NO_FINANCIAL_DATA";
    if (isBaseline && salePrice != null && salePrice > 0) financialState = "PENDING";
    else if (hasAuthorizedPrice) financialState = "PENDING";
    else financialState = "NO_FINANCIAL_DATA";

    let priority = 40;
    if (isBaseline) priority = 10;
    else if (promocaoAtivaId != null && op.selectionId === promocaoAtivaId) priority = 11;
    else if (gate.displayState === "MANUAL") priority = 12;
    else if (gate.displayState === "CONFIRMED") priority = 20;
    else priority = 50;

    out.push({
      selectionId: op.selectionId,
      originIndex: i,
      scenario,
      promotionId: ctx.promotion_id != null ? String(ctx.promotion_id) : null,
      promotionName: ctx.promotion_name != null ? String(ctx.promotion_name) : null,
      salePrice: hasAuthorizedPrice ? salePrice : null,
      salePriceBrl: hasAuthorizedPrice && monetario != null ? String(monetario) : null,
      financialState,
      truthStatus: String(gate.truthStatus ?? gate.displayState ?? ""),
      isBaseline,
      hasAuthorizedPrice: Boolean(hasAuthorizedPrice),
      priority,
    });
  }
  return out.sort((a, b) => a.priority - b.priority || a.originIndex - b.originIndex);
}

/**
 * Entradas elegíveis para hidratação automática (não dispara cálculo com preço zero).
 * @param {PromotionOfferManifestEntry[]} manifesto
 */
export function filtrarManifestoParaHidratacao(manifesto) {
  return (Array.isArray(manifesto) ? manifesto : []).filter(
    (e) => e.hasAuthorizedPrice === true && e.salePrice != null && e.salePrice > 0 && !e.isBaseline,
  );
}
