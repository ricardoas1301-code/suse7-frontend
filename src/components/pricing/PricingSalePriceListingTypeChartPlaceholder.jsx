// ======================================================
// S4.3.7.2 — Entrada da aba Precificação para o comparativo
// vertical de lucro/margem por listing type.
// ======================================================

import { ListingTypeProfitMarginVerticalChart } from "./ListingTypeProfitMarginVerticalChart.jsx";

/**
 * @param {{
 *   classicScenario?: unknown;
 *   premiumScenario?: unknown;
 * }} props
 */
export function PricingSalePriceListingTypeChartPlaceholder({
  classicScenario = null,
  premiumScenario = null,
}) {
  return <ListingTypeProfitMarginVerticalChart {...{ classicScenario, premiumScenario }} />;
}
