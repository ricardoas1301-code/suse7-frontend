// ======================================================================
// Hook — escopo executivo do Dashboard (período/conta por bloco).
// ======================================================================

import { useEffect, useMemo } from "react";
import { useVendasFilters } from "../../features/vendas/filters/VendasFiltersContext.jsx";
import { resolveDashboardScope } from "./dashboardScope.js";

/** @returns {ReturnType<typeof resolveDashboardScope>} */
export function useDashboardScope() {
  const { filters, dashboardFilterParams } = useVendasFilters();
  const scope = useMemo(() => resolveDashboardScope(filters), [filters]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const accountId = String(filters.marketplaceAccountId ?? "").trim();
    console.info("[S7][Dashboard scope]", {
      filterActive: scope.filterActive,
      accountScopeLabel: scope.accountScopeLabel,
      marketplaceAccountIdSelected: accountId || null,
      dashboardFilterParams,
      resumoParams: scope.resumoParams,
      executiveParams: scope.executiveParams,
      resumoFilterParams: scope.resumoFilterParams,
      executiveFilterParams: scope.executiveFilterParams,
    });
  }, [filters, scope, dashboardFilterParams]);

  return scope;
}
