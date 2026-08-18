// ======================================================================
// Prévia executiva do relatório — vendas selecionadas (lista carregada).
// ======================================================================

import {
  formatBrlFromApiString,
  formatPercentFromApiString,
} from "../../listings/utils/catalogFormatters";
import { EXECUTIVE_PANEL_EMPTY_KPI_VALUE } from "../../../components/sales/vendasExecutivePanelUx";

/**
 * @param {ReturnType<import("./aggregateVendasSelectedSalesMetrics.js").aggregateVendasSelectedSalesMetrics>} metrics
 */
export function buildVendasSelectedReportExecutivePreview(metrics) {
  const count = metrics?.ordersCount ?? 0;
  if (count <= 0) {
    return {
      quantityValue: EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
      revenueValue: EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
      netProfitValue: EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
      marginValue: EXECUTIVE_PANEL_EMPTY_KPI_VALUE,
      marginUnavailable: true,
      lowMarginCount: 0,
      negativeCount: 0,
      loading: false,
      empty: true,
      error: null,
    };
  }

  const qtyLabel = count === 1 ? "1 venda" : `${count.toLocaleString("pt-BR")} vendas`;

  return {
    quantityValue: qtyLabel,
    revenueValue: formatBrlFromApiString(metrics.grossSalesBrl),
    netProfitValue: formatBrlFromApiString(metrics.netProfitBrl),
    marginValue: metrics.marginUnavailable
      ? "—"
      : formatPercentFromApiString(String(metrics.marginPercent ?? "")),
    marginUnavailable: Boolean(metrics.marginUnavailable),
    lowMarginCount: metrics.lowMarginCount ?? 0,
    negativeCount: metrics.negativeCount ?? 0,
    loading: false,
    empty: false,
    error: null,
  };
}
