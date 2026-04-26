// ======================================================
// Página Precificação Inteligente — separação baseline vs promoções (somente UI / dados já vindos da API).
//
// Conceitos:
// - `pricingPageBaselineRow` = simulador "Preço de venda" (futuro: preço/tipo de anúncio editável; hoje só apresentação).
// - `pricingPagePromotionRows` = cenários reais ML (oportunidades / estado); não reagem ao toggle Premium/Clássico do baseline.
//
// Evolução prevista (não implementada aqui):
// - baseline altera preço/tipo publicado no ML
// - promoção: desconto editável em alguns casos vs fixo em outros
// ======================================================

/**
 * @param {{ scenario: unknown; group: string }[]} orderedRows — ex.: `sortPricingScenariosForUi(buildOrderedScenarioRows(...))`
 * @returns {{
 *   pricingPageBaselineRow: { scenario: unknown; group: string } | null;
 *   pricingPagePromotionRows: { scenario: unknown; group: string }[];
 * }}
 */
export function splitPricingPageScenarioRows(orderedRows) {
  if (!Array.isArray(orderedRows)) {
    return { pricingPageBaselineRow: null, pricingPagePromotionRows: [] };
  }
  const pricingPageBaselineRow = orderedRows.find((r) => r.group === "baseline") ?? null;
  const pricingPagePromotionRows = orderedRows.filter((r) => r.group !== "baseline");
  return { pricingPageBaselineRow, pricingPagePromotionRows };
}
