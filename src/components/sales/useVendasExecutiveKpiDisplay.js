// ======================================================================
// Exibição dos 4 KPIs executivos — somente formatação visual (sem recálculo).
// ======================================================================

import { useMemo } from "react";
import { formatBrlFromApiString, formatPercentFromApiString } from "../../features/listings/utils/catalogFormatters";
import {
  EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
  isExecutiveApiDecimalNegative,
} from "./vendasExecutivePanelUx";

/** @param {number | string | null | undefined} value */
function formatExecutiveCount(value) {
  if (value == null) return "0";
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("pt-BR");
}

/**
 * @param {{
 *   executiveSummary: Record<string, unknown> | null | undefined;
 *   executivePanelEmpty: boolean;
 * }} params
 */
export function useVendasExecutiveKpiDisplay({ executiveSummary, executivePanelEmpty }) {
  const quantityKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null };
    }
    const qty = executiveSummary?.orders_count;
    const count = formatExecutiveCount(qty);
    return { value: `${count} vendas`, subtitle: null };
  }, [executivePanelEmpty, executiveSummary]);

  const revenueKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null };
    }
    const raw =
      executiveSummary?.gross_sales_brl != null ? String(executiveSummary.gross_sales_brl) : "0.00";
    return { value: formatBrlFromApiString(raw), subtitle: null };
  }, [executivePanelEmpty, executiveSummary]);

  const netProfitKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null };
    }
    const raw =
      executiveSummary?.contribution_profit_brl != null
        ? String(executiveSummary.contribution_profit_brl)
        : executiveSummary?.net_profit_brl != null
          ? String(executiveSummary.net_profit_brl)
          : "0.00";
    return {
      value: formatBrlFromApiString(raw),
      subtitle: null,
      valueNegative: isExecutiveApiDecimalNegative(raw),
    };
  }, [executivePanelEmpty, executiveSummary]);

  const profitPercentKpi = useMemo(() => {
    if (executivePanelEmpty) {
      return { value: EXECUTIVE_PANEL_EMPTY_KPI_VALUE, subtitle: null, unavailable: false };
    }
    const raw =
      executiveSummary?.contribution_margin_percent != null
        ? String(executiveSummary.contribution_margin_percent).trim()
        : "";
    if (raw === "") {
      return { value: "—", subtitle: "Percentual indisponível", unavailable: true };
    }
    return {
      value: formatPercentFromApiString(raw),
      subtitle: null,
      unavailable: false,
      valueNegative: isExecutiveApiDecimalNegative(raw),
    };
  }, [executivePanelEmpty, executiveSummary]);

  return { quantityKpi, revenueKpi, netProfitKpi, profitPercentKpi };
}
