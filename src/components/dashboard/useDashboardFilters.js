// ======================================================================
// Hook de conveniência — filtros por bloco do Dashboard.
// ======================================================================

import { useMemo } from "react";
import { useDashboardBlockFilters } from "./DashboardBlockFiltersContext.jsx";
import { useDashboardScope } from "./useDashboardScope.js";

/** Estado, escopo e params dos filtros do Dashboard (Resumo + Top 10). */
export function useDashboardFilters() {
  const blockFilters = useDashboardBlockFilters();
  const { resumo, top10 } = useDashboardScope();

  return useMemo(
    () => ({
      dailySummaryFilters: blockFilters.dailySummaryFilters,
      top10Filters: blockFilters.top10Filters,
      resumo,
      top10,
      resumoParams: resumo.resumoParams,
      executiveParams: top10.executiveParams,
      applyDailySummaryPeriod: blockFilters.applyDailySummaryPeriod,
      setDailySummaryAccountId: blockFilters.setDailySummaryAccountId,
      applyTop10Period: blockFilters.applyTop10Period,
      setTop10AccountId: blockFilters.setTop10AccountId,
    }),
    [blockFilters, resumo, top10],
  );
}
