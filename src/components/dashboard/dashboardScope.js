// ======================================================================
// Escopo executivo do Dashboard — regra sem filtro vs com filtro (DASH.3).
// Sem cálculos financeiros; apenas resolução de período/conta por bloco.
// Futuro: consumir exclusivamente dados sincronizados no banco Suse7.
// ======================================================================

import {
  buildVendasExecutiveApiParams,
  formatIsoToBrDate,
  resolveVendasPeriodRange,
} from "../../features/vendas/filters/vendasFiltersPeriod.js";

/**
 * Conta do filtro global — vazio = todas as contas do seller (sem enviar ID na API).
 * @param {{ marketplaceAccountId?: string }} filters
 * @param {boolean} filterActive
 */
export function resolveDashboardMarketplaceAccountId(filters, filterActive) {
  if (!filterActive) return "";
  return String(filters.marketplaceAccountId ?? "").trim();
}

/**
 * @param {{
 *   periodPreset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplace?: string;
 *   marketplaceAccountId?: string;
 * }} filters
 */
export function isDashboardSellerFilterActive(filters) {
  const accountActive = Boolean(String(filters.marketplaceAccountId ?? "").trim());
  const defaultMonth = resolveVendasPeriodRange("this_month");
  const appliedRange = resolveVendasPeriodRange(
    filters.periodPreset,
    filters.startDate,
    filters.endDate,
  );

  const periodActive =
    filters.periodPreset !== "this_month" ||
    appliedRange.startDate !== defaultMonth.startDate ||
    appliedRange.endDate !== defaultMonth.endDate;

  return accountActive || periodActive;
}

/**
 * @param {string} startIso
 * @param {string} endIso
 */
export function formatDashboardPeriodRangeLabel(startIso, endIso) {
  const start = formatIsoToBrDate(startIso);
  const end = formatIsoToBrDate(endIso);
  if (!start && !end) return "Período";
  if (start && end && start === end) return start;
  if (start && end) return `${start} – ${end}`;
  return start || end || "Período";
}

/**
 * @param {{
 *   periodPreset: import("../../features/vendas/filters/vendasFiltersPeriod.js").VendasPeriodPresetUi;
 *   startDate: string;
 *   endDate: string;
 *   marketplace?: string;
 *   marketplaceAccountId?: string;
 * }} filters
 */
export function resolveDashboardScope(filters) {
  const filterActive = isDashboardSellerFilterActive(filters);
  const todayRange = resolveVendasPeriodRange("today");
  const monthRange = resolveVendasPeriodRange("this_month");
  const appliedRange = resolveVendasPeriodRange(
    filters.periodPreset,
    filters.startDate,
    filters.endDate,
  );

  const resumoRange = filterActive ? appliedRange : todayRange;
  const executiveRange = filterActive ? appliedRange : monthRange;
  const accountIdForApi = resolveDashboardMarketplaceAccountId(filters, filterActive);

  const resumoParams = buildVendasExecutiveApiParams({
    periodPreset: filterActive ? filters.periodPreset : "today",
    startDate: resumoRange.startDate,
    endDate: resumoRange.endDate,
    marketplace: filters.marketplace,
    marketplaceAccountId: accountIdForApi,
    rankingLimit: 10,
  });

  const executiveParams = buildVendasExecutiveApiParams({
    periodPreset: filterActive ? filters.periodPreset : "this_month",
    startDate: executiveRange.startDate,
    endDate: executiveRange.endDate,
    marketplace: filters.marketplace,
    marketplaceAccountId: accountIdForApi,
    rankingLimit: 10,
  });

  const top10PeriodLabel = filterActive
    ? formatDashboardPeriodRangeLabel(appliedRange.startDate, appliedRange.endDate)
    : "Mês atual";

  const resumoPeriodLabel = filterActive
    ? formatDashboardPeriodRangeLabel(resumoRange.startDate, resumoRange.endDate)
    : "Hoje";

  const resumoDateLabel = filterActive
    ? formatDashboardPeriodRangeLabel(resumoRange.startDate, resumoRange.endDate)
    : formatIsoToBrDate(resumoRange.startDate);

  const unifiedFilterParams = filterActive
    ? {
        periodStart: appliedRange.startDate,
        periodEnd: appliedRange.endDate,
        marketplaceAccountId: accountIdForApi || null,
      }
    : null;

  const accountScopeLabel = accountIdForApi ? "conta_especifica" : "todas_as_contas";

  return {
    filterActive,
    todayRange,
    monthRange,
    appliedRange,
    resumoRange,
    executiveRange,
    resumoParams,
    executiveParams,
    top10PeriodLabel,
    resumoPeriodLabel,
    resumoDateLabel,
    unifiedFilterParams,
    resumoFilterParams: {
      periodStart: resumoRange.startDate,
      periodEnd: resumoRange.endDate,
      marketplaceAccountId: filterActive ? accountIdForApi || null : null,
    },
    executiveFilterParams: {
      periodStart: executiveRange.startDate,
      periodEnd: executiveRange.endDate,
      marketplaceAccountId: accountIdForApi || null,
    },
    accountIdForApi,
    accountScopeLabel,
  };
}
