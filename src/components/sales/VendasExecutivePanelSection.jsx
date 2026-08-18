// ======================================================================
// Painel executivo com dados — executive-summary ou Top 10 leve (controles próprios).
// ======================================================================

import { useMemo } from "react";
import { useSalesExecutiveSummary } from "../../hooks/useSalesExecutiveSummary";
import { useSalesTop10 } from "../../hooks/useSalesTop10";
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
 *   sourceMode?: "executive" | "top10";
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
  sourceMode = "executive",
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
    if (sourceMode === "top10" || !includeListScope || !executiveApiParams) return executiveApiParams;
    return {
      ...executiveApiParams,
      filter: listFilter !== "all" ? listFilter : undefined,
      q: searchQuery || undefined,
    };
  }, [executiveApiParams, includeListScope, listFilter, searchQuery, sourceMode]);

  const authReady = useAuthBootstrapReady();

  const top10QueryEnabled = useMemo(
    () => sourceMode === "top10" && authReady && isExecutiveSummaryQueryEnabled(executiveParams),
    [authReady, executiveParams, sourceMode],
  );

  const executiveQueryEnabled = useMemo(
    () => sourceMode === "executive" && authReady && isExecutiveSummaryQueryEnabled(executiveParams),
    [authReady, executiveParams, sourceMode],
  );

  const top10State = useSalesTop10(executiveParams, { enabled: top10QueryEnabled });
  const executiveState = useSalesExecutiveSummary(executiveParams, { enabled: executiveQueryEnabled });

  const activeState = sourceMode === "top10" ? top10State : executiveState;

  const {
    summary: executiveSummary,
    topListingsByQuantity,
    topListingsByGrossRevenue,
    topListingsByNetProfit,
    period: executivePeriod,
    loading: executiveLoading,
    error: executiveError,
    refetch,
  } = activeState;

  const topProducts =
    sourceMode === "executive" && "topProducts" in executiveState ? executiveState.topProducts : [];

  const executivePeriodLabel = useMemo(() => {
    if (executivePeriodLabelOverride != null && String(executivePeriodLabelOverride).trim() !== "") {
      return executivePeriodLabelOverride;
    }
    return formatExecutivePeriodLabel(executivePeriod);
  }, [executivePeriodLabelOverride, executivePeriod]);

  const executivePanelEmpty = useMemo(() => {
    if (sourceMode === "top10") {
      return top10State.succeeded && top10State.isRealEmpty;
    }
    return (
      !executiveLoading &&
      !executiveError &&
      isExecutiveSummaryEmptyForFilters(executiveSummary)
    );
  }, [sourceMode, top10State.succeeded, top10State.isRealEmpty, executiveLoading, executiveError, executiveSummary]);

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
        onRetry={executiveError ? refetch : undefined}
        showEmptyState={executivePanelEmpty}
      />
    </>
  );
}
