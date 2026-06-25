// ======================================================================
// Painel executivo com dados — reutiliza hooks e API existentes (sem duplicar lógica).
// ======================================================================

import { useMemo } from "react";
import { useSalesExecutiveSummary } from "../../hooks/useSalesExecutiveSummary";
import { useAuthBootstrapReady } from "../../hooks/useAuthBootstrapReady";
import { useVendasFilters } from "../../features/vendas/filters/VendasFiltersContext.jsx";
import { isExecutiveSummaryQueryEnabled } from "../dashboard/dashboardScope.js";
import { formatExecutivePeriodLabel } from "./salesTopRankingUtils";
import {
  EXECUTIVE_PANEL_ERROR_MESSAGE,
  isExecutiveSummaryEmptyForFilters,
} from "./vendasExecutivePanelUx";
import { useVendasExecutiveKpiDisplay } from "./useVendasExecutiveKpiDisplay";
import VendasExecutivePanel from "./VendasExecutivePanel";

/**
 * @param {{
 *   includeListScope?: boolean;
 *   listFilter?: string;
 *   searchQuery?: string;
 *   showExecutiveErrorNote?: boolean;
 *   className?: string;
 *   tituloExternoTop10?: boolean;
 *   executiveParamsOverride?: import("../../services/salesExecutiveSummaryApi.js").SalesExecutiveSummaryParams | null;
 *   executivePeriodLabelOverride?: string | null;
 * }} props
 */
export default function VendasExecutivePanelSection({
  includeListScope = false,
  listFilter = "all",
  searchQuery = "",
  showExecutiveErrorNote = false,
  className = "",
  tituloExternoTop10 = false,
  executiveParamsOverride = null,
  executivePeriodLabelOverride = null,
}) {
  const { executiveApiParams: contextExecutiveParams } = useVendasFilters();
  const executiveApiParams = executiveParamsOverride ?? contextExecutiveParams;

  const executiveParams = useMemo(() => {
    if (!includeListScope || !executiveApiParams) return executiveApiParams;
    return {
      ...executiveApiParams,
      filter: listFilter !== "all" ? listFilter : undefined,
      q: searchQuery || undefined,
    };
  }, [executiveApiParams, includeListScope, listFilter, searchQuery]);

  const authReady = useAuthBootstrapReady();

  const executiveQueryEnabled = useMemo(
    () => authReady && isExecutiveSummaryQueryEnabled(executiveParams),
    [authReady, executiveParams],
  );

  const {
    summary: executiveSummary,
    topListingsByQuantity,
    topListingsByGrossRevenue,
    topListingsByNetProfit,
    topProducts,
    period: executivePeriod,
    loading: executiveLoading,
    error: executiveError,
  } = useSalesExecutiveSummary(executiveParams, { enabled: executiveQueryEnabled });

  const executivePeriodLabel = useMemo(() => {
    if (executivePeriodLabelOverride != null && String(executivePeriodLabelOverride).trim() !== "") {
      return executivePeriodLabelOverride;
    }
    return formatExecutivePeriodLabel(executivePeriod);
  }, [executivePeriodLabelOverride, executivePeriod]);

  const executivePanelEmpty = useMemo(
    () =>
      !executiveLoading &&
      !executiveError &&
      isExecutiveSummaryEmptyForFilters(executiveSummary),
    [executiveLoading, executiveError, executiveSummary],
  );

  const executivePanelError = executiveError ? EXECUTIVE_PANEL_ERROR_MESSAGE : null;

  const { quantityKpi, revenueKpi, netProfitKpi, profitPercentKpi } = useVendasExecutiveKpiDisplay({
    executiveSummary,
    executivePanelEmpty,
  });

  return (
    <>
      {showExecutiveErrorNote && executiveError ? (
        <p className="vendas-page__kpi-note vendas-page__kpi-note--error" role="status">
          Resumo executivo indisponível. A listagem de vendas abaixo continua disponível.
        </p>
      ) : null}
      <VendasExecutivePanel
        topListingsByQuantity={/** @type {Record<string, unknown>[]} */ (topListingsByQuantity)}
        topListingsByGrossRevenue={/** @type {Record<string, unknown>[]} */ (topListingsByGrossRevenue)}
        topListingsByNetProfit={/** @type {Record<string, unknown>[]} */ (topListingsByNetProfit)}
        topProductsCount={topProducts.length}
        executiveLoading={executiveLoading}
        executivePanelError={executivePanelError}
        executivePanelEmpty={executivePanelEmpty}
        executivePeriodLabel={executivePeriodLabel}
        quantityKpi={quantityKpi}
        revenueKpi={revenueKpi}
        netProfitKpi={netProfitKpi}
        profitPercentKpi={profitPercentKpi}
        className={className}
        tituloExternoTop10={tituloExternoTop10}
      />
    </>
  );
}
